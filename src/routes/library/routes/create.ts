import { createHonoApp } from '@/lib/create-app';
import { createRoute, z } from '@hono/zod-openapi';
import { createLibraryItemSchema, libraryItemSchema } from '@/routes/library/schema';
import { status } from '@poppanator/http-constants';
import * as schema from '@/db/schema';
import { drizzle } from 'drizzle-orm/d1';
import { getAuth } from '@hono/clerk-auth';

const app = createHonoApp();

const route = createRoute({
	method: 'post',
	path: '/',
	tags: ['Library'],
	summary: 'Add a new study material to library',
	request: {
		body: {
			content: {
				'application/json': { schema: createLibraryItemSchema },
			},
		},
	},
	responses: {
		[status.Created]: {
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						material: libraryItemSchema,
					}),
				},
			},
			description: 'Material added successfully',
		},
		[status.Unauthorized]: {
			description: 'User not logged in',
		},
	},
});

app.openapi(route, async (c) => {
	const auth = getAuth(c);

	if (!auth?.userId) {
		return c.json({ message: 'You must be logged in.' }, status.Unauthorized);
	}

	const data = c.req.valid('json');
	const db = drizzle(c.env.DB, { schema });


	const newMaterial = {
		id: crypto.randomUUID(),
		userId: auth.userId,
		...data,
		isFavorite: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	await db.insert(schema.studyMaterials).values(newMaterial);

	return c.json(
		{
			message: 'Material added',
			material: newMaterial,
		},
		status.Created,
	);
});

export default app;
