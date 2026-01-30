import {  createRoute, z } from '@hono/zod-openapi';
import { status } from '@poppanator/http-constants';
import { error400, error401, error500 } from '@/openapi/common';
import { createHonoApp } from '@/lib/create-app';

const app = createHonoApp();

const createUserSchema = z.object({
	name: z.string().openapi({ example: 'John' }),
	email: z.email().openapi({ example: 'johnexample.com' }),
});

const route = createRoute({
	method: 'post',
	path: '/',
	tags: ['Users'],
	summary: 'Create a new user',
	request: {
		body: {
			content: {
				'application/json': {
					schema: createUserSchema,
				},
			},
		},
	},
	responses: {
		[status.Created]: {
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						user: createUserSchema,
					}),
				},
			},
			description: 'User successfully created',
		},
		[status.BadRequest]: error400,
		[status.Unauthorized]: error401,
		[status.InternalServerError]: error500,
	},
});

app.openapi(route, async (c) => {
	const data = c.req.valid('json');
	return c.json({ message: 'User Created', user: data }, status.Created);
});

export default app;
