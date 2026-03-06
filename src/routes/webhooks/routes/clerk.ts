import { ValidateSvixWebhook } from '@/util';
import { drizzle } from 'drizzle-orm/d1';
import { users } from '../../../db/schema';
import * as schema from '../../../db/schema';
import { createHonoApp } from '@/lib/create-app';

const app = createHonoApp();

app.post('/', async (c) => {
	console.log('try....');
	console.log('CLERK_WEBHOOK_SECRET', c.env.CLERK_WEBHOOK_SECRET);
	console.log('DB', c.env.DB);
	console.log('CLERK_PUBLISHABLE_KEY', c.env.CLERK_PUBLISHABLE_KEY);
	console.log('CLERK_SECRET_KEY', c.env.CLERK_SECRET_KEY);

	console.log('Available Env Keys:', Object.keys(c.env));
	try {
		const event = await ValidateSvixWebhook.validate(c, 'clerk', c.env.CLERK_WEBHOOK_SECRET);

		console.log('event', event.type);
		if (event.type === 'user.created') {
			console.log('User created:', event.data.id);

			const { id, email_addresses, first_name, last_name } = event.data;

			const email = email_addresses[0]?.email_address;
			const fullName = `${first_name || ''} ${last_name || ''}`.trim();

			const db = drizzle(c.env.DB, { schema });

			await db.insert(users).values({
				id: id,
				email: email,
				fullName: fullName || ''
			});
			console.log('User inserted successfully');
		}

		if (event.type === 'user.updated') {
			console.log('event.data', event.data);

			const { id, first_name, last_name } = event.data;

			const fullName = `${first_name || ''} ${last_name || ''}`.trim();

			const db = drizzle(c.env.DB, { schema });
		}

		return c.json({ received: true });
	} catch (err) {
		console.error('Webhook Error:', err);
		return c.json({ error: 'Invalid Webhook Signature' }, 400);
	}
});

export default app;
