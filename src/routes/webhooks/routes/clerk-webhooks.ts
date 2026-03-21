import { getHonoInstance } from '@/hono';
import { validateSvixWebhookRequest } from '@/util';
import { WebhookEvent } from '@clerk/backend';

export function setupClerkWebhooksRoute() {
	const app = getHonoInstance();

	app.post('/webhooks/clerk', async (c) => {
		const { log } = c.env;
		const raw = await c.req.raw.text();

		const isValidated = validateSvixWebhookRequest({
            svixId: c.req.header('Svix-Id') as string,
            svixTimestamp: c.req.header('Svix-Timestamp') as string,
            svixSignature: c.req.header('Svix-Signature') as string,
            raw: raw,
            signingSecret: c.env.CLERK_WEBHOOK_SIGNING_KEY
        });

		if (isValidated) {
			log.debug('request is validated');

			const webhookData = JSON.parse(raw) as WebhookEvent;
			if (webhookData.type === 'user.created') {
				log.withContext({
					clerkId: webhookData.data.id
				});

				const instance =
					await c.env.WORKFLOWS_CLERK_USER_CREATED.create({
						params: {
							clerkUser: webhookData.data
						}
					});

				log.withContext({
					msg: ''
				}).debug('clerk user.created workflow started');

				return c.json({
					id: instance.id,
					details: await instance.status()
				});
			} else if (webhookData.type === 'user.deleted') {
				log.withContext({
					clerkId: webhookData.data.id
				});

				const instance =
					await c.env.WORKFLOWS_CLERK_USER_DELETED.create({
						params: {
							deletedObject: webhookData.data
						}
					});

				log.debug('clerk user.deleted workflow started');

				return c.json({
					id: instance.id,
					details: await instance.status()
				});
			} else {
				log.withContext({
					type: webhookData.type
				});
				log.debug('uninterested event type');

				return c.json(
					{
						msg: 'uninterested event type'
					},
					{
						status: 400
					}
				);
			}
		} else {
			log.debug('request validation failed');

			return c.text('invalid signature', {
				status: 400
			});
		}
	});
}
