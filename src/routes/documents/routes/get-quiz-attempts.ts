import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { APIErrorCodes, OpenAPITags } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import { _400Describe, _401Describe, _404Describe, _500Describe, response2xxSchemaWrapper } from '@/openapi';
import { status } from '@poppanator/http-constants';
import { and, desc, eq } from 'drizzle-orm';

const toISO = (ts: Date | number | null | undefined): string =>
	new Date(ts as any).toISOString();

export function setupGetQuizAttemptsRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'get',
		path: '/documents/{documentId}/quiz/attempts',
		tags: [OpenAPITags.DOCUMENTS],
		operationId: 'getQuizAttempts',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z.object({ documentId: z.string() }).openapi({
				param: { name: 'documentId', in: 'path', required: true }
			})
		},
		responses: {
			[status.Ok]: {
				description: 'past quiz attempts for document',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
							z.array(z.object({
								id: z.string(),
								score: z.number(),
								correctCount: z.number(),
								totalQuestions: z.number(),
								weakAreas: z.array(z.string()),
								recommendation: z.string().nullable(),
								createdAt: z.string()
							}))
						)
					}
				}
			},
			[status.NotFound]: _404Describe,
			[status.Unauthorized]: _401Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables } = c.env;
		const clerkId = c.get('clerkUserId');
		const { documentId } = c.req.valid('param');

		try {
			const doc = await drizzleDB.query.docTable.findFirst({
				where: and(
					eq(dbTables.docTable.id, documentId),
					eq(dbTables.docTable.clerkId, clerkId)
				)
			});
			if (!doc) {
				return c.json(
					{ code: APIErrorCodes.DOCUMENT_NOT_FOUND, message: 'document not found' },
					status.NotFound
				);
			}

			const attempts = await drizzleDB.query.quizAttemptTable.findMany({
				where: and(
					eq(dbTables.quizAttemptTable.documentId, documentId),
					eq(dbTables.quizAttemptTable.clerkId, clerkId)
				),
				orderBy: desc(dbTables.quizAttemptTable.createdAt)
			});

			return c.json({
				data: attempts.map((a) => ({
					id: a.id,
					score: a.score,
					correctCount: a.correctCount,
					totalQuestions: a.totalQuestions,
					weakAreas: a.weakAreas ?? [],
					recommendation: a.recommendation ?? null,
					createdAt: toISO(a.createdAt)
				}))
			});
		} catch (e: any) {
			log.withError(e).error(e.message || 'unknown error');
			return c.json({ message: 'unknown server error' }, status.InternalServerError);
		}
	});
}
