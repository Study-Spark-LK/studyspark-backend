import { createHonoApp } from '@/lib/create-app';
import { clerkMiddleware } from '@hono/clerk-auth';
import { cors } from 'hono/cors';

// sub apps
import userApp from '@/routes/users';
import webhookApp from '@/routes/webhooks';
import devApp from '@/routes/dev-only';

const app = createHonoApp();

// middleware
app.use('/*', cors());
app.use('*', clerkMiddleware());

// routes
app.route('/api/users', userApp);
app.route('/api/webhooks', webhookApp);

app.doc('/doc', {
	openapi: '3.0.0',
	info: {
		version: '1.0.0',
		title: 'StudySpark API',
	},
});

app.route('/dev', devApp);

export default app;
