// src/routes/documents/routes/quiz.ts
import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
	_401Describe,
	_404Describe,
	_500Describe,
	response2xxSchemaWrapper
} from '@/openapi';
import { OpenAPITags, APIErrorCodes } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { status } from '@poppanator/http-constants';
import { eq, and } from 'drizzle-orm';

// Schema for the frontend: Intentionally omits 'correctAnswer' and 'explanation'
// to prevent users from cheating by inspecting network requests.
const QuestionSchema = z.object({
	id: z.string(),
	question: z.string(),
	options: z.array(z.string()), 
	difficulty: z.string(),
	concept: z.string().nullable().optional()
});

export function setupGetQuizRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'get',
		path: '/documents/{documentId}/quiz',
		tags: [OpenAPITags.DOCUMENTS],
		operationId: 'getDocumentQuiz',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z.object({
				documentId: z.string()
			}).strict()
		},
		responses: {
			[status.Ok]: {
				description: 'Quiz retrieved successfully',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
							z.object({
								documentId: z.string(),
								questions: z.array(QuestionSchema)
							})
						)
					}
				}
			},
			[status.Unauthorized]: _401Describe,
			[status.NotFound]: _404Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables } = c.env;
		const { docTable, quizQuestionTable } = dbTables; 

		try {
			const documentId = c.req.param('documentId');
			const clerkId = c.get('clerkUserId');

			// Security Check 1: Ensure document exists AND belongs to the requesting user
			const existingDoc = await drizzleDB.query.docTable.findFirst({
				where: and(
					eq(docTable.id, documentId),
					eq(docTable.clerkId, clerkId)
				)
			});

			if (!existingDoc) {
				return c.json(
					{
						code: APIErrorCodes.FILE_NOT_FOUND, 
						message: 'Document not found or unauthorized'
					},
					status.NotFound
				);
			}

			// Fetch all questions mapped to this document ID
			const quizQuestions = await drizzleDB.query.quizQuestionTable.findMany({
				where: eq(quizQuestionTable.documentId, documentId),
				// Explicitly select only the safe columns to send to the client
				columns: {
					id: true,
					question: true,
					options: true,
					difficulty: true,
					concept: true
				}
			});

			// Guard clause if the AI hasn't finished inserting questions yet
			if (!quizQuestions || quizQuestions.length === 0) {
				return c.json(
					{
						code: 'quiz_not_found',
						message: 'No questions have been generated for this document yet'
					},
					status.NotFound
				);
			}

			return c.json(
				{
					data: {
						documentId: documentId,
						questions: quizQuestions
					}
				},
				status.Ok
			);
		} catch (e: any) {
			log.withError(e).error(e.message || 'unknown error');

			return c.json(
				{ message: 'unknown server error' },
				status.InternalServerError
			);
		}
	});
}