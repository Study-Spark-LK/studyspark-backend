import { setupGetDocumentsRoute } from '@/routes/documents/routes/get-documents';
import { setupCreateDocumentRoute } from '@/routes/documents/routes/create-document';
import { setupGetDocumentRoute } from '@/routes/documents/routes/get-document';
import { setupUpdateDocumentProgressRoute } from '@/routes/documents/routes/update-document-progress';
import { setupDeleteDocumentRoute } from '@/routes/documents/routes/delete-document';

export function setupDocumentRoutes() {
	setupGetDocumentsRoute();
	setupCreateDocumentRoute();
	setupGetDocumentRoute();
	setupUpdateDocumentProgressRoute();
	setupDeleteDocumentRoute();
}
