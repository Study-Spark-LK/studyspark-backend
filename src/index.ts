import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { OpenAPIHono } from '@hono/zod-openapi';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import * as schema from './db/schema';

// routes
import userApp from './routes/users';
import webhookApp from './routes/webhooks';
import docsApp from './routes/docs';

// types
import { AppEnv } from './types';

const app = new OpenAPIHono<AppEnv>();

app.use('/*', cors());
app.use('*', clerkMiddleware());

app.route('/docs', docsApp)

const getDb = (c: Context<AppEnv>) => drizzle(c.env.DB, { schema });



app.get('/', (c) => c.text('API is Running'));
app.get('/api', (c) => c.text('API is Running'));

app.route('/api/users', userApp);
app.route('/api/webhooks', webhookApp);

// app.get('/api/me', async (c) => {
// 	const auth = getAuth(c);

// 	if (!auth?.userId) {
// 		return c.json({ error: 'Unauthorized' }, 401);
// 	}

// 	const db = getDb(c);
// 	const currentUser = await db.query.users.findFirst({
// 		where: (users, { eq }) => eq(users.id, auth.userId),
// 	});

// 	return c.json({
// 		message: `Hello, ${auth.userId}`,
// 		data: currentUser,
// 	});
// });



export default app;

// export default {
// 	async fetch(request, env, ctx): Promise<Response> {
// 		return new Response('Hello World!');
// 	},
// } satisfies ExportedHandler<Env>;
