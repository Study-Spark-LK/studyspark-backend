import { setupStorageRoutes } from '@/routes/storage';
import { setupWebhookRoutes } from '@/routes/webhooks';
import { setupProfileRoutes } from '@/routes/profiles';
import { setupDocumentRoutes } from '@/routes/documents';
import { setupInternalRoutes } from '@/routes/internal';

export function setupRoutes() {
	setupStorageRoutes();
	setupWebhookRoutes();
	setupProfileRoutes();
	setupDocumentRoutes();
	setupInternalRoutes();
}

