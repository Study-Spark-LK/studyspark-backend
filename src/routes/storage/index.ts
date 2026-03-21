import { setupUploadFileRoute } from '@/routes/storage/routes/upload';
import { setupDownloadFileRoute } from '@/routes/storage/routes/download';
import { setupDeleteFileRoute } from '@/routes/storage/routes/delete';

export function setupStorageRoutes() {
	setupUploadFileRoute();
	setupDownloadFileRoute();
	setupDeleteFileRoute();
}
