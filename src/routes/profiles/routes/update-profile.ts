import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { APIErrorCodes, OpenAPITags, QueuePayloadType } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import { _400Describe, _401Describe, _404Describe, _500Describe, response2xxSchemaWrapper } from '@/openapi';
import { status } from '@poppanator/http-constants';
import { and, eq } from 'drizzle-orm';

export function setupUpdateProfileRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'put',
		path: '/profiles/{profileId}',
		tags: [OpenAPITags.PROFILES],
		operationId: 'updateProfile',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z.object({ profileId: z.string() }).openapi({
				param: { name: 'profileId', in: 'path', required: true }
			}),
			body: {
				content: {
					'application/json': {
						schema: z.object({
							name: z.string().optional(),
							hobbies: z.array(z.string()).optional(),
							qna: z.array(z.object({
								question: z.string(),
								answer: z.string()
							})).optional()
						})
					}
				}
			}
		},
		responses: {
			[status.Ok]: {
				description: 'profile updated, re-analysis triggered',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
							z.object({
								id: z.string(),
								name: z.string(),
								status: z.literal('PENDING')
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
		const { log, drizzleDB, dbTables, QUEUE_UPSTREAM_INGEST } = c.env;
		const clerkId = c.get('clerkUserId');
		const { profileId } = c.req.valid('param');
		const { name, hobbies, qna } = c.req.valid('json');

		try {
			const existing = await drizzleDB.query.profileTable.findFirst({
				where: and(
					eq(dbTables.profileTable.id, profileId),
					eq(dbTables.profileTable.clerkId, clerkId)
				)
			});

			if (!existing) {
				return c.json(
					{ code: APIErrorCodes.PROFILE_NOT_FOUND, message: 'profile not found' },
					status.NotFound
				);
			}

			const updated = await drizzleDB
				.update(dbTables.profileTable)
				.set({
					...(name !== undefined && { name }),
					...(hobbies !== undefined && { hobbies }),
					...(qna !== undefined && { qna }),
					status: 'PENDING',
					visualScore: -1,
					auditoryScore: -1,
					readingScore: -1,
					kinestheticScore: -1
				})
				.where(
					and(
						eq(dbTables.profileTable.id, profileId),
						eq(dbTables.profileTable.clerkId, clerkId)
					)
				)
				.returning();

			await QUEUE_UPSTREAM_INGEST.send({
				type: QueuePayloadType.PROFILE_ANALYSIS,
				payload: {
					id: profileId,
					name: updated[0].name,
					qna: updated[0].qna
				}
			});

			return c.json({
				data: {
					id: updated[0].id,
					name: updated[0].name,
					status: 'PENDING' as const
				}
			});
		} catch (e: any) {
			log.withError(e).error(e.message || 'unknown error');
			return c.json({ message: 'unknown server error' }, status.InternalServerError);
		}
	});
}
