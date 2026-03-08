import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { APIErrorCodes, OpenAPITags } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import {
	_400Describe,
	_401Describe, _404Describe,
	_500Describe,
	response2xxSchemaWrapper
} from '@/openapi';
import { status } from '@poppanator/http-constants';
import { and, desc, eq } from 'drizzle-orm';

export function setupUpdateDocumentProgressRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'put',
		path: '/documents/{documentId}',
		tags: [OpenAPITags.DOCUMENTS],
		operationId: 'getDocumentProgress',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z
				.object({
					documentId: z.string()
				})
				.openapi({
					param: {
						name: 'documentId',
						in: 'path',
						required: true
					},
					example: '25ad8416-fd96-4fd7-9185-de00ca8269c5'
				}),
			query: z
				.object({
					progress: z.coerce.number().positive()
				})
				.openapi({
					param: {
						name: 'progress',
						in: 'query',
						required: true
					},
					example: '58'
				})
		},
		responses: {
			[status.Ok]: {
				description: 'documents',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
							z.object({
								id: z.string(),
								profileId: z.string(),
								status: z.enum(['PENDING', 'READY'])
							})
						)
					}
				}
			},
			[status.BadRequest]: _400Describe,
			[status.Unauthorized]: _401Describe,
			[status.NotFound]: _404Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables } = c.env;

		try {
			const clerkId = c.get('clerkUserId');
			const { documentId } = c.req.valid('param');
			const { progress } = c.req.valid('query');
			const { docTable, fileTable } = dbTables;

			const updateRes = await drizzleDB
				.update(docTable)
				.set({
					progressPercentage: progress
				})
				.where(and(
					eq(docTable.id, documentId),
					eq(docTable.clerkId, clerkId)
				))
				.returning();

			const doc = updateRes[0];

			if (!doc) {
				return c.json(
					{
						code: APIErrorCodes.DOCUMENT_NOT_FOUND,
						message: 'document not found'
					},
					status.NotFound
				);
			}

			return c.json({
				data: {
					id: doc.id,
					profileId: doc.profileId,
					status: doc.status
				}
			});
		} catch (e: any) {
			log.withError(e).error(e.message || 'unknown error');

			return c.json(
				{
					message: 'unknown server error'
				},
				status.InternalServerError
			);
		}
	});
}
