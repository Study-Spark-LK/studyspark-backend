import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { OpenAPITags } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import {
	_400Describe,
	_401Describe,
	_500Describe,
	response2xxSchemaWrapper
} from '@/openapi';
import { status } from '@poppanator/http-constants';
import { and, desc, eq } from 'drizzle-orm';
import { docTable } from '@/db/schema';

const ITEMS_PER_PAGE = 10;

export function setupGetDocumentsRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'get',
		path: '/documents',
		tags: [OpenAPITags.DOCUMENTS],
		operationId: 'getDocuments',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			query: z
				.object({
					category: z.string().optional(),
					page: z.coerce.number().optional()
				})
				.openapi({
					param: {
						name: 'category',
						in: 'query',
						required: false
					}
				})
				.openapi({
					param: {
						name: 'page',
						in: 'query',
						required: false
					},
					example: '2'
				})
		},
		responses: {
			[status.Ok]: {
				description: 'documents',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
							z.array(
								z.object({
									id: z.string(),
									profileId: z.string(),
									status: z.enum(['PENDING', 'READY']),
									// --- Info
									title: z.string(),
									description: z.string(),
									category: z.string(),
									progressPercentage: z.number()
								})
							)
						)
					}
				}
			},
			[status.BadRequest]: _400Describe,
			[status.Unauthorized]: _401Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables } = c.env;

		try {
			const clerkId = c.get('clerkUserId');
			const { page: _page, category } = c.req.valid('query');
			const { docTable } = dbTables;

			let page = _page || 1;

			const dbRes = await drizzleDB.query.docTable.findMany({
				where: and(
					eq(docTable.clerkId, clerkId),
					category ? eq(docTable.category, category) : undefined
				),
				orderBy: desc(docTable.createdAt),
				limit: ITEMS_PER_PAGE,
				offset: (page - 1) * ITEMS_PER_PAGE
			});

			return c.json({
				data: dbRes.map((r) => ({
					id: r.id,
					profileId: r.profileId,
					status: r.status,
					// ---- Info
					title: r.description,
					description: r.description,
					category: r.category,
					progressPercentage: r.progressPercentage
				}))
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
