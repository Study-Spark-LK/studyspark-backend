import { createHonoApp } from '@/lib/create-app';
import { createRoute, z } from '@hono/zod-openapi';
import { getAuth } from '@hono/clerk-auth';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { userProfileSchema } from '../schema';
import { status } from '@poppanator/http-constants';

const app = createHonoApp();

const route = createRoute({
	method: 'get',
	path: '/me',
	tags: ['Users'],
	summary: 'Get current user profile',
	responses: {
		[status.Ok]: {
			content: {
				'application/json': {
					schema: userProfileSchema,
				},
			},
			description: 'User profile details',
		},
		[status.Unauthorized]: {
			description: 'User not logged in',
		},
		[status.NotFound]: {
			description: 'User not found in database',
		},
	},
});

app.openapi(route, async (c) => {
	const auth = getAuth(c);

	if (!auth?.userId) {
		return c.json({ message: 'Unauthorized' }, status.Unauthorized);
	}

	const db = drizzle(c.env.DB, { schema });

	const user = await db.query.users.findFirst({
		where: eq(schema.users.id, auth.userId),
	});

	if (!user) {
		// if a user exists in clerk but hasn't been synced to D1 DB yet
		return c.json({ message: 'User profile not found' }, status.NotFound);
	}

	return c.json(
		{
			id: user.id,
			email: user.email,
			fullName: user.fullName,
			createdAt: new Date(user.createdAt).toISOString(),
		},
		status.Ok,
	);
});

export default app;
