import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';

const LessonSchema = z.object({
    id: z.string(),
    documentId: z.string(),
    title: z.string().nullable().optional(),
    content: z.string(),
    createdAt: z.number().optional()
});


export function setupGetLessonRoute() {
	const app = getHonoInstance();

	const spec = createRoute({

	})

}
