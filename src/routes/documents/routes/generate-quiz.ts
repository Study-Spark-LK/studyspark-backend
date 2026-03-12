import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { APIErrorCodes, OpenAPITags } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import { _400Describe, _401Describe, _404Describe, _500Describe } from '@/openapi';
import { status } from '@poppanator/http-constants';
import { and, eq } from 'drizzle-orm';

export function setupGenerateQuizRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'post',
		path: '/documents/{documentId}/quiz/generate',
		tags: [OpenAPITags.DOCUMENTS],
		operationId: 'generateQuiz',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z.object({ documentId: z.string() }).openapi({
				param: { name: 'documentId', in: 'path', required: true }
			}),
			body: {
				content: {
					'application/json': {
						schema: z.object({
							numQuestions: z.number().int().min(1).max(20).optional(),
							difficulty: z.enum(['easy', 'medium', 'hard']).optional()
						})
					}
				}
			}
		},
		responses: {
			[status.Ok]: {
				description: 'quiz questions',
				content: { 'application/json': { schema: z.record(z.unknown()) } }
			},
			[status.BadRequest]: _400Describe,
			[status.Unauthorized]: _401Describe,
			[status.NotFound]: _404Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables, AGENT_URL, INTERNAL_API_KEY } = c.env;
		const clerkId = c.get('clerkUserId');
		const { documentId } = c.req.valid('param');
		const { numQuestions = 10, difficulty = 'medium' } = c.req.valid('json');

		try {
			// Verify document belongs to user
			const doc = await drizzleDB.query.docTable.findFirst({
				where: and(eq(dbTables.docTable.id, documentId), eq(dbTables.docTable.clerkId, clerkId))
			});
			if (!doc) {
				return c.json({ code: APIErrorCodes.DOCUMENT_NOT_FOUND, message: 'document not found' }, status.NotFound);
			}

			// Fetch analytical content from R2
			const analyticalFile = await drizzleDB.query.fileTable.findFirst({
				where: and(
					eq(dbTables.fileTable.docId, documentId),
					eq(dbTables.fileTable.type, 'AI_GENERATED_ANALYTICAL')
				)
			});
			if (!analyticalFile) {
				return c.json({ code: APIErrorCodes.FILE_NOT_FOUND, message: 'document not ready yet' }, status.NotFound);
			}

			const r2Object = await c.env.R2_FILES.get(analyticalFile.id);
			if (!r2Object) {
				return c.json({ code: APIErrorCodes.FILE_NOT_FOUND, message: 'content file not found' }, status.NotFound);
			}
			const content = await r2Object.text();

			// Call agent
			const res = await fetch(`${AGENT_URL}/internal/quiz/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'X-Internal-Key': INTERNAL_API_KEY },
				body: JSON.stringify({ userId: clerkId, content, numQuestions, difficulty })
			});

			if (!res.ok) {
				throw new Error(`Agent quiz/generate failed: ${res.status}`);
			}

			const agentResult = await res.json() as { questions?: Array<Record<string, unknown>> };

			// Store full questions (with correct_answer) in R2 for evaluate to use later
			if (agentResult.questions?.length) {
				await c.env.R2_FILES.put(
					`generated/${documentId}/quiz`,
					JSON.stringify(agentResult.questions),
					{ httpMetadata: { contentType: 'application/json' } }
				);
			}

			// Strip correct_answer before returning to Flutter
			const stripped = {
				...agentResult,
				questions: agentResult.questions?.map(({ correct_answer, correctAnswer, ...rest }) => rest)
			};
			return c.json(stripped);
		} catch (e: any) {
			log.withError(e).error(e.message || 'unknown error');
			return c.json({ message: 'unknown server error' }, status.InternalServerError);
		}
	});
}
