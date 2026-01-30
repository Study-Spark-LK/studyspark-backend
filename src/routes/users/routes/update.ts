import { createRoute, z } from '@hono/zod-openapi';
import { updateProfileSchema } from '../../../validators/schemas';
import { status } from '@poppanator/http-constants';
import { error400, error401, error500 } from '../../../openapi/common';
import { createHonoApp } from '@/lib/create-app';

const app = createHonoApp();

const route = createRoute({
	method: 'post',
	path: '/',
	tags: ['Users'],
	summary: 'Update User Profile',
	security: [{ Bearer: [] }],
	request: {
		body: {
			content: {
				'application/json': {
					schema: updateProfileSchema,
				},
			},
		},
	},
	responses: {
		[status.Ok]: {
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						method: z.string(),
					}),
				},
			},
			description: 'Profile updated successfully',
		},
		[status.BadRequest]: error400,
		[status.Unauthorized]: error401,
		[status.InternalServerError]: error500,
	},
});

app.openapi(route, async (c) => {
	const data = c.req.valid('json');
	return c.json({ message: 'Success', method: 'update' }, status.Ok);
});

export default app;
