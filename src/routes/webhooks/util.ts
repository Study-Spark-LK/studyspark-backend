import { Webhook } from 'svix';

type WebhookProvider = 'clerk';

export class WebhookValidator {
	static async validate(c: any, provider:  WebhookProvider, secret: string): Promise<any> {
		const payload = await c.req.text();
		const headers = c.req.header();

		switch (provider) {
			case 'clerk':
				return validateClerk(payload, headers, secret);

			default:
				throw new Error(`Unknown webhook provider: ${provider}`);
		}
	}
}

function validateClerk(payload: string, headers: any, secret: string) {
	const wh = new Webhook(secret);

	return wh.verify(payload, {
		'svix-id': headers['svix-id'],
		'svix-timestamp': headers['svix-timestamp'],
		'svix-signature': headers['svix-signature'],
	});
}
