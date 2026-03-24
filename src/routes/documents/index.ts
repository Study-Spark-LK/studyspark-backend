import { setupGetDocumentsRoute } from '@/routes/documents/routes/get-documents';
import { setupCreateDocumentRoute } from '@/routes/documents/routes/create-document';
import { setupGetDocumentRoute } from '@/routes/documents/routes/get-document';
import { setupUpdateDocumentProgressRoute } from '@/routes/documents/routes/update-document-progress';
import { setupDeleteDocumentRoute } from '@/routes/documents/routes/delete-document';
import { setupGenerateQuizRoute } from '@/routes/documents/routes/generate-quiz';
import { setupEvaluateQuizRoute } from '@/routes/documents/routes/evaluate-quiz';
import { setupGetFlashcardsRoute } from '@/routes/documents/routes/get-flashcards';
import { setupGetDocumentStatusRoute } from '@/routes/documents/routes/status';
import { setupGetQuizAttemptsRoute } from '@/routes/documents/routes/get-quiz-attempts';
import { setupGetQuizRoute } from '@/routes/documents/routes/quiz';
import { setupGetQuizAttemptRoute } from './routes/attempt';
import { setupEvaluateFlashcardRoute } from './routes/evaluate-flashcard';

export function setupDocumentRoutes() {
	setupGetDocumentsRoute();
	setupCreateDocumentRoute();
	setupGetDocumentRoute();
	setupUpdateDocumentProgressRoute();
	setupDeleteDocumentRoute();
	setupGenerateQuizRoute();
	setupEvaluateQuizRoute();
	setupGetFlashcardsRoute();
	setupGetDocumentStatusRoute();
	setupGetQuizAttemptsRoute();
	setupGetQuizRoute();
	setupGetQuizAttemptRoute();
	setupEvaluateFlashcardRoute();
}
