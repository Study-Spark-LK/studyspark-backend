// src/routes/documents/routes/status.ts
import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
	_401Describe,
	_404Describe,
	_500Describe,
	response2xxSchemaWrapper
} from '@/openapi';
import { OpenAPITags, APIErrorCodes } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { status } from '@poppanator/http-constants';
import { eq, and } from 'drizzle-orm';

export function setupGetDocumentStatusRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'get',
		path: '/documents/{documentId}/status',
		tags: [OpenAPITags.DOCUMENTS],
		operationId: 'getDocumentStatus',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z
				.object({
					documentId: z.string()
				})
				.strict()
		},
		responses: {
			[status.Ok]: {
				description: 'Document status retrieved successfully',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
							z.object({
								id: z.string(),
								status: z.string() // e.g., 'PENDING', 'PROCESSING', 'READY', 'FAILED'
							})
						)
					}
				}
			},
			[status.Unauthorized]: _401Describe,
			[status.NotFound]: _404Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables } = c.env;
		const { docTable } = dbTables;

		try {
			const documentId = c.req.param('documentId');
			const clerkId = c.get('clerkUserId');

			// Only select the fields we actually need for a lightweight polling request
			const existingDoc = await drizzleDB.query.docTable.findFirst({
				where: and(
					eq(docTable.id, documentId),
					eq(docTable.clerkId, clerkId)
				),
				columns: {
					id: true,
					status: true
				}
			});

			if (!existingDoc) {
				return c.json(
					{
						// Fallback to a generic code if DOCUMENT_NOT_FOUND isn't in your constants yet
						code: 'document_not_found',
						message: 'Document not found or unauthorized'
					},
					status.NotFound
				);
			}

			return c.json(
				{
					data: {
						id: existingDoc.id,
						status: existingDoc.status
					}
				},
				status.Ok
			);
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
