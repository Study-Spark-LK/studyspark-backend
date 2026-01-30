import { createHonoApp } from '@/lib/create-app';
import { swaggerUI } from '@hono/swagger-ui';

const app = createHonoApp();

// guard - only allow in development
app.use('*', async (c, next) => {
	if (c.env.ENVIRONMENT !== 'development') {
		return c.notFound();
	}
	await next();
});

// serve ui
app.get('/', swaggerUI({ url: '/doc' }));

export default app;
