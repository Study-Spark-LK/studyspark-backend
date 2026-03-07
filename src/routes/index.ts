import { setupStorageRoutes } from '@/routes/storage';
import { setupWebhookRoutes } from '@/routes/webhooks';
import { setupProfileRoutes } from '@/routes/profiles';

export function setupRoutes() {
	setupStorageRoutes();
	setupWebhookRoutes();
	setupProfileRoutes();
}

