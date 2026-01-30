import { createHonoApp } from '@/lib/create-app';
import { swaggerUI } from '@hono/swagger-ui';

const app = createHonoApp();

// middleware
app.use('*', async (c, next) => {
	if (c.env.ENVIRONMENT !== 'development') {
		return c.notFound();
	}
	await next();
});

// json spec
app.doc('/json', {
	openapi: '3.0.0',
	info: {
		version: '1.0.0',
		title: 'StudySpark API',
	},
});

// ui
app.get('/', swaggerUI({ url: '/dev/json' }));

export default app;
