import {
	userTable,
	profileTable,
	docTable,
	fileTable,
	flashcardTable,
	quizQuestionTable,
	quizAttemptTable
} from '@/db/schema';

export {
	type DBUser,
	type DBProfiles,
	type DBDocs,
	type DBFlashcard,
	type DBQuizQuestion,
	type DBQuizAttempt
} from '@/db/schema';

export const dbTables = {
	userTable,
	profileTable,
	docTable,
	fileTable,
	flashcardTable,
	quizQuestionTable,
	quizAttemptTable
};

export { getDB, type DBInstanceType } from '@/db/get-db';
