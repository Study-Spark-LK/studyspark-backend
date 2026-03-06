import { setupUploadFileRoute } from '@/routes/storage/routes/upload';
import { setupDownloadFileRoute } from '@/routes/storage/routes/download';

export function setupStorageRoutes() {
	setupUploadFileRoute();
	setupDownloadFileRoute();
}
