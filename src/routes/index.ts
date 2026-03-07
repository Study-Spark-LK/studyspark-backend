import { setupStorageRoutes } from '@/routes/storage';
import { setupWebhookRoutes } from '@/routes/webhooks';

export function setupRoutes() {
	setupStorageRoutes();
	setupWebhookRoutes();
}

