import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';


export function setupGetLessonRoute() {
	const app = getHonoInstance();

	const spec = createRoute({

	})

}
