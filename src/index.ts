import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';
import * as schema from './db/schema';

type Bindings = {
	DB: D1Database;
	CLERK_SECRET_KEY: string;
	CLERK_PUBLISHABLE_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.use('*', clerkMiddleware());

const getDb = (c: any) => drizzle(c.env.DB, { schema });

app.get('/', (c) => c.text('API is Running'));

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
