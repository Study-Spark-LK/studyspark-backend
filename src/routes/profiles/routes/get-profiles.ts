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

export function setupGetProfilesRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'get',
		path: '/profiles',
		tags: [OpenAPITags.PROFILES],
		operationId: 'getProfiles',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			query: z
				.object({
					status: z.enum(['all', 'pending', 'ready']).default('all')
				})
				.openapi({
					param: {
						name: 'status',
						in: 'query',
						required: true
					},
					example: 'all'
				})
		},
		responses: {
			[status.Ok]: {
				description: 'all profiles',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
							z.array(
								z.object({
									id: z.string(),
									name: z.string(),
									status: z.enum(['PENDING', 'READY']),
									visualScore: z.number(),
									auditoryScore: z.number(),
									readingScore: z.number(),
									kinestheticScore: z.number(),
									createdAt: z.number(),
									updatedAt: z.number()
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
		const { log, drizzleDB, dbTables, R2_FILES } = c.env;
		const { profileTable } = dbTables;

		try {
			const { status } = c.req.valid('query');
			const clerkId = c.get('clerkUserId');

			const dbRes = await drizzleDB.query.profileTable.findMany({
				where: and(
					eq(profileTable.clerkId, clerkId),
					status === 'ready' ?
						eq(profileTable.status, 'READY') : status === 'pending' ?
							eq(profileTable.status, 'PENDING') : undefined
				),
				orderBy: desc(profileTable.createdAt)
			});

			return c.json({
				data: {
					jobs: dbRes.map((r) => ({
						id: r.id,
						name: r.name,
						status: r.status,
						visualScore: r.visualScore,
						auditoryScore: r.auditoryScore,
						readingScore: r.readingScore,
						kinestheticScore: r.kinestheticScore,
						createdAt: r.createdAt,
						updatedAt: r.updatedAt
					}))
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
