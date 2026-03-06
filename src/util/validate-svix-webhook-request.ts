import { Webhook } from 'standardwebhooks';

export function validateSvixWebhookRequest({
											   svixId,
											   svixTimestamp,
											   svixSignature,
											   raw,
											   signingSecret
										   }: {
	svixId: string;
	svixTimestamp: string;
	svixSignature: string;
	raw: string;
	signingSecret: string;
}): boolean {
	const b64SigningSecret = signingSecret.split('_')[1];
	const wh = new Webhook(b64SigningSecret);

	if (!svixId || !svixTimestamp || !svixSignature) {
		return false;
	}

	try {
		wh.verify(raw, {
			'webhook-id': svixId,
			'webhook-timestamp': svixTimestamp,
			'webhook-signature': svixSignature
		});
		return true;
	} catch (err) {
		return false;
	}
}
