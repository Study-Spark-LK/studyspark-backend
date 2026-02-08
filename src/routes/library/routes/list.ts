import { createHonoApp } from '@/lib/create-app';
import { createRoute, z } from '@hono/zod-openapi';
import { libraryItemSchema, searchLibrarySchema } from '@/routes/library/schema';
import { status } from '@poppanator/http-constants';
import { drizzle } from 'drizzle-orm/d1';
import { eq, like, and, desc } from 'drizzle-orm';
import * as schema from '@/db/schema';

const app = createHonoApp();

const route = createRoute({
	method: 'get',
	path: '/',
	tags: ['Library'],
	summary: 'Search and list library materials',
	request: {
		query: searchLibrarySchema,
	},
	responses: {
		[status.Ok]: {
			content: {
				'application/json': {
					schema: z.object({
						materials: z.array(libraryItemSchema),
					}),
				},
			},
			description: 'List of materials',
		},
	},
});

app.openapi(route, async (c) => {
	const { q, subject, isFavorite } = c.req.valid('query');
	const db = drizzle(c.env.DB, { schema });

	const conditions = [];

	if (q) conditions.push(like(schema.studyMaterials.title, `%${q}%`));
	if (subject && subject !== 'All') conditions.push(eq(schema.studyMaterials.subject, subject));
	if (isFavorite === 'true') conditions.push(eq(schema.studyMaterials.isFavorite, true));

	const results = await db
		.select()
		.from(schema.studyMaterials)
		.where(and(...conditions))
		.orderBy(desc(schema.studyMaterials.createdAt));

	const formattedResults = results.map((item) => ({
		id: item.id,
		title: item.title,
		fileUrl: item.fileUrl,
		fileType: item.fileType as 'pdf' | 'image' | 'text',
		subject: item.subject || 'General',
		isFavorite: item.isFavorite ?? false,
		createdAt: new Date(item.createdAt).toISOString(),
		description: item.description || undefined,
	}));

	return c.json({ materials: formattedResults }, status.Ok);
});

export default app;
