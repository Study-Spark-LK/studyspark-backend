import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { APIErrorCodes, OpenAPITags } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import { _400Describe, _401Describe, _404Describe, _500Describe, response2xxSchemaWrapper } from '@/openapi'; // import predefined response descriptions
import { status } from '@poppanator/http-constants'; // HTTP status code constants
import { and, eq } from 'drizzle-orm'; // Import query helpers for database filtering


// Helper function to convert timestamps to ISO string format
const toISO = (ts: Date | number | null | undefined): string =>
	new Date(ts as any).toISOString();

// Function to set up GET flashcards route (READ operation in CRUD)
export function setupGetFlashcardsRoute() {
	const app = getHonoInstance();


    // Define the OpenAPI specification for this route using openAPI
	const spec = createRoute({

		method: 'get', // HTTP GET method for retrieving data
		path: '/documents/{documentId}/flashcards', // API endpoint with path parameter for document ID
		tags: [OpenAPITags.DOCUMENTS], // Group this route under DOCUMENTS tag
		operationId: 'getFlashcards', // Unique identifier for this API
		middleware: [clerkValidate, clerkEnforced], // middleware to validate and enforce authentication with Clerk

        // define request paraameters using Zod schema
		request: {
			params: z.object({
				documentId: z.string() // documentId must be a string
			 }).openapi({

				// Define this as a path parameter in OpenAPI documentation
				param: { name: 'documentId', in: 'path', required: true }
			})
		},

		//Define possible responses for this API endpoint
		responses: {
			[status.Ok]: {
				description: 'flashcards for document',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(

							// Response is an array of dlashcard objects
							z.array(z.object({
								id: z.string(), // Flashcard ID
								question: z.string(), // Flashcard question
								answer: z.string(), // Flashcard answer
								hint: z.string().nullable(), // optional hint for the flashcard
								createdAt: z.string() //Create date
							}))
						)
					}
				}
			},
			[status.NotFound]: _404Describe, // 404 response if document or flashcards not found
			[status.Unauthorized]: _401Describe, // 401 response if user is unauthorized
			[status.InternalServerError]: _500Describe // 500 response for any server errors
		}
	});


	// Attach the route to the app with logic to handle the request
	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables } = c.env; // extract logger, database and tables from environment
		const clerkId = c.get('clerkUserId'); // get logged in user ID from clerk
		const { documentId } = c.req.valid('param'); // get validated documentId from request parameters

		try {
			 // step 1 : Check if the document exists and belongs to the logged in user
			const doc = await drizzleDB.query.docTable.findFirst({
				where: and(
					eq(dbTables.docTable.id, documentId), // match document ID
					eq(dbTables.docTable.clerkId, clerkId) // match the user Id
				)
			});

			// If no document is found, return a 404 error response
			if (!doc) {
				return c.json(
					{ code: APIErrorCodes.DOCUMENT_NOT_FOUND, message: 'document not found' },
					status.NotFound
				);
			}

			// step 2 : If document exists and is owned by user, retrieve associated flashcards
			const flashcards = await drizzleDB.query.flashcardTable.findMany({
				where: and(
					eq(dbTables.flashcardTable.documentId, documentId),
					eq(dbTables.flashcardTable.clerkId, clerkId)
				)
			});

			// step 3 : Return the flashcards in the response
			return c.json({
				data: flashcards.map((f) => ({
					id: f.id,
					question: f.question,
					answer: f.answer,
					hint: f.hint ?? null,
					createdAt: toISO(f.createdAt)
				}))
			});
		} catch (e: any) {
			log.withError(e).error(e.message || 'unknown error');
			return c.json({ message: 'unknown server error' }, status.InternalServerError);
		}
	});
}
