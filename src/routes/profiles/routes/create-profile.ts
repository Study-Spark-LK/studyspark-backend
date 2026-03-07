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

export function setupCreateProfileRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'post',
		path: '/profiles',
		tags: [OpenAPITags.PROFILES],
		operationId: 'createProfile',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			body: {
				description: 'name info',
				content: {
					'application/json': {
						schema: z.object({
							name: z.string(),
							qna: z.array(z.object({
								question: z.string(),
								answer: z.string()
							}))
						})
					}
				}
			}
		},
		responses: {
			[status.Created]: {
				description: 'profile created successfully',
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
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables } = c.env;

		try {
			const profileId = crypto.randomUUID();
			const { name, qna } = c.req.valid('json');
			const clerkId = c.get('clerkUserId');

			const insertRes = await drizzleDB
				.insert(dbTables.profileTable)
				.values({
					id: profileId,
					clerkId: clerkId,
					name: name,
					status: 'PENDING',
					qna: qna
				})
				.returning();

			return c.json(
				{
					data: {
						id: profileId,
						name: name,
						status: insertRes[0].status
					}
				},
				status.Created
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
