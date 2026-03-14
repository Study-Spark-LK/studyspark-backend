import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { APIErrorCodes, OpenAPITags } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import { _400Describe, _401Describe, _404Describe, _500Describe } from '@/openapi';
import { status } from '@poppanator/http-constants';
import { and, eq } from 'drizzle-orm';

const AnswerSchema = z.object({
	questionId: z.string(),
	selectedAnswer: z.string()
});

export function setupEvaluateQuizRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'post',
		path: '/documents/{documentId}/quiz/evaluate',
		tags: [OpenAPITags.DOCUMENTS],
		operationId: 'evaluateQuiz',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z.object({ documentId: z.string() }).openapi({
				param: { name: 'documentId', in: 'path', required: true }
			}),
			body: {
				content: {
					'application/json': {
						schema: z.object({
							answers: z.array(AnswerSchema)
						})
					}
				}
			}
		},
		responses: {
			[status.Ok]: {
				description: 'quiz evaluation result',
				content: { 'application/json': { schema: z.record(z.unknown()) } }
			},
			[status.BadRequest]: _400Describe,
			[status.Unauthorized]: _401Describe,
			[status.NotFound]: _404Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables, AGENT_URL, INTERNAL_API_KEY, R2_FILES } = c.env;
		const clerkId = c.get('clerkUserId');
		const { documentId } = c.req.valid('param');
		const { answers } = c.req.valid('json');

		try {
			// Verify document belongs to user
			const doc = await drizzleDB.query.docTable.findFirst({
				where: and(eq(dbTables.docTable.id, documentId), eq(dbTables.docTable.clerkId, clerkId))
			});
			if (!doc) {
				return c.json({ code: APIErrorCodes.DOCUMENT_NOT_FOUND, message: 'document not found' }, status.NotFound);
			}

			// Fetch stored questions (with correct_answer) from R2
			const quizR2 = await c.env.R2_FILES.get(`generated/${documentId}/quiz`);
			if (!quizR2) {
				return c.json({ code: APIErrorCodes.FILE_NOT_FOUND, message: 'quiz not yet generated for this document' }, status.NotFound);
			}
			const questions = await quizR2.json();

			// Call agent to evaluate answers (agent also updates VARK scores internally)
			const res = await fetch(`${AGENT_URL}/internal/quiz/evaluate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-Internal-Key': INTERNAL_API_KEY },
				body: JSON.stringify({ userId: clerkId, questions, answers })
			});

			if (!res.ok) {
				throw new Error(`Agent quiz/evaluate failed: ${res.status}`);
			}

			const evaluation = await res.json() as {
				score?: number;
				correct_count?: number;
				total_questions?: number;
				weak_areas?: string[];
				recommendation?: string;
				[key: string]: unknown;
			};

			// Persist the attempt to D1
			await drizzleDB.insert(dbTables.quizAttemptTable).values({
				id: crypto.randomUUID(),
				documentId,
				clerkId,
				profileId: doc.profileId,
				score: evaluation.score ?? 0,
				correctCount: evaluation.correct_count ?? 0,
				totalQuestions: Array.isArray(questions) ? (questions as unknown[]).length : 0,
				weakAreas: evaluation.weak_areas ?? [],
				recommendation: evaluation.recommendation ?? null,
				createdAt: new Date(Date.now())
			});

			// Auto-update document progress: treat -1 (unset) as 0 before adding
			const currentProgress = (doc.progressPercentage ?? -1) < 0 ? 0 : (doc.progressPercentage ?? 0);
			const newProgress = Math.min(100, currentProgress + Math.round((evaluation.score ?? 0) / 10));
			await drizzleDB.update(dbTables.docTable).set({
				progressPercentage: newProgress
			}).where(eq(dbTables.docTable.id, documentId));

			return c.json(evaluation);
		} catch (e: any) {
			log.withError(e).error(e.message || 'unknown error');
			return c.json({ message: 'unknown server error' }, status.InternalServerError);
		}
	});
}
