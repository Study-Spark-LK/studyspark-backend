import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { OpenAPITags } from '@/constants';
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

export function setupDeleteProfileRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'delete',
		path: '/profiles',
		tags: [OpenAPITags.PROFILES],
		operationId: 'getProfiles',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			body: {
				description: 'name info',
				content: {
					'application/json': {
						schema: z.object({
							id: z.string()
						})
					}
				}
			}
		},
		responses: {
			[status.Ok]: {
				description: 'deleted profile',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
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
					}
				}
			},
			[status.BadRequest]: _400Describe,
			[status.NotFound]: _404Describe,
			[status.Unauthorized]: _401Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables, R2_FILES } = c.env;
		const { profileTable } = dbTables;

		try {
			const { id } = c.req.valid('json');
			const clerkId = c.get('clerkUserId');

			const dbRes = await drizzleDB.delete(profileTable).where(
				and(
					eq(profileTable.id, id),
					eq(profileTable.clerkId, clerkId)
				)
			).returning();

			if (dbRes[0]) {
				const r = dbRes[0];
				return c.json({
					data: {
						id: r.id,
						name: r.name,
						status: r.status,
						visualScore: r.visualScore,
						auditoryScore: r.auditoryScore,
						readingScore: r.readingScore,
						kinestheticScore: r.kinestheticScore,
						createdAt: r.createdAt,
						updatedAt: r.updatedAt
					}
				});
			} else {
				return c.json(
					{
						message: 'profile not found'
					},
					status.NotFound
				);
			}

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
