
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

const schema = z.object({
	name: z.string(),
	email: z.string().email(),
});

app.post('/', zValidator('json', schema), (c) => {
	const data = c.req.valid('json');
	return c.json({ message: 'User Created', user: data });
});

export default app;
