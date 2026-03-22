import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { APIErrorCodes, OpenAPITags } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import { _400Describe, _401Describe, _404Describe, _500Describe, response2xxSchemaWrapper } from '@/openapi';
import { status } from '@poppanator/http-constants';
import { and, eq } from 'drizzle-orm';

const toISO = (ts: Date | number | null | undefined): string =>
	new Date(ts as any).toISOString();

export function setupGetFlashcardsRoute() {
	const app = getHonoInstance();



	const spec = createRoute({
		method: 'get',
		path: '/documents/{documentId}/flashcards',
		tags: [OpenAPITags.DOCUMENTS],
		operationId: 'getFlashcards',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z.object({ documentId: z.string() }).openapi({
				param: { name: 'documentId', in: 'path', required: true }
			})
		},
		responses: {
			[status.Ok]: {
				description: 'flashcards for document',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
							z.array(z.object({
								id: z.string(),
								question: z.string(),
								answer: z.string(),
								hint: z.string().nullable(),
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

			const flashcards = await drizzleDB.query.flashcardTable.findMany({
				where: and(
					eq(dbTables.flashcardTable.documentId, documentId),
					eq(dbTables.flashcardTable.clerkId, clerkId)
				)
			});

			return c.json({
				data: flashcards.map((f) => ({
					id: f.id,
					question: f.question,
					answer: f.answer,
					hint: f.hint ?? null,
					createdAt: toISO(f.createdAt)
				}))
			});
		} catch (e: any) {
			log.withError(e).error(e.message || 'unknown error');
			return c.json({ message: 'unknown server error' }, status.InternalServerError);
		}
	});
}
