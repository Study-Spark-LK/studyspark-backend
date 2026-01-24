import { OpenAPIHono } from '@hono/zod-openapi';
import { AppEnv } from '../types';
import { swaggerUI } from '@hono/swagger-ui';

const app = new OpenAPIHono<AppEnv>();

// middleware
app.use('*', async (c, next) => {
	if (c.env.IS_DEV !== 'true') {
		return c.notFound();
	}

	await next();
});

app.doc('/spec', {
	openapi: '3.0.0',
	info: {
		version: '1.0.0',
		title: 'StudySpark API',
	},
});

app.get('/', swaggerUI({ url: 'docs/spec' }));

export default app;
