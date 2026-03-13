import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { OpenAPITags } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import { _400Describe, _401Describe, _500Describe, response2xxSchemaWrapper } from '@/openapi';
import { status } from '@poppanator/http-constants';
import { and, desc, eq } from 'drizzle-orm';

const toISO = (ts: Date | number | null | undefined): string =>
	new Date(ts as any).toISOString();

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
					status: z.enum(['all', 'pending', 'ready']).default('all').optional()
				})
				.openapi({
					param: { name: 'status', in: 'query', required: false },
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
									hobbies: z.array(z.string()),
									status: z.enum(['PENDING', 'READY']),
									visualScore: z.number(),
									auditoryScore: z.number(),
									readingScore: z.number(),
									kinestheticScore: z.number(),
									createdAt: z.string(),
									updatedAt: z.string()
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
		const { profileTable } = dbTables;

		try {
			const { status } = c.req.valid('query');
			const clerkId = c.get('clerkUserId');

			const dbRes = await drizzleDB.query.profileTable.findMany({
				where: and(
					eq(profileTable.clerkId, clerkId),
					status === 'ready'
						? eq(profileTable.status, 'READY')
						: status === 'pending'
							? eq(profileTable.status, 'PENDING')
							: undefined
				),
				orderBy: desc(profileTable.createdAt)
			});

			return c.json({
				data: dbRes.map((r) => ({
					id: r.id,
					name: r.name,
					hobbies: r.hobbies ?? [],
					status: r.status,
					visualScore: r.visualScore,
					auditoryScore: r.auditoryScore,
					readingScore: r.readingScore,
					kinestheticScore: r.kinestheticScore,
					createdAt: toISO(r.createdAt),
					updatedAt: toISO(r.updatedAt)
				}))
			});
		} catch (e: any) {
			log.withError(e).error(e.message || 'unknown error');
			return c.json({ message: 'unknown server error' }, status.InternalServerError);
		}
	});
}
