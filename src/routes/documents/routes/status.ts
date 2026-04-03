// src/routes/documents/routes/status.ts
import { getHonoInstance } from '@/hono'; //Import the Hono app instance (main backend app)
import { createRoute } from '@hono/zod-openapi'; // Used to define API routes with OpenAPI documentation
import { z } from 'zod'; // Zod is used for validating request data

import {
	_401Describe, //unauthorized response
	_404Describe, //not found response
	_500Describe, //internal server error response
	response2xxSchemaWrapper // helper to wrap successful response schemas
} from '@/openapi';

import { OpenAPITags, APIErrorCodes } from '@/constants'; // Constants (tags and error codes)
import { clerkEnforced, clerkValidate } from '@/middleware'; // Middleware for authentication usinh clerk
import { status } from '@poppanator/http-constants'; // HTTP status code constants(eg.404,500)
import { eq, and } from 'drizzle-orm'; // Drizzle ORM helpers for building SQL queries (eq for equality, and for combining conditions)

export function setupGetDocumentStatusRoute() {

	// Get the Hono app instance to define routes on
	const app = getHonoInstance();

	// Define the OpenAPI specification(methid, path, request, responses)
	const spec = createRoute({

		method: 'get', // Read operation to get document status (CRUD - Read)
		path: '/documents/{documentId}/status', // API endpoint

		//Group this API under "Documents"
		tags: [OpenAPITags.DOCUMENTS],

		//Unique identifier for this operation (used in OpenAPI docs)
		operationId: 'getDocumentStatus',

		// Middleware to validate the user is authenticated with Clerk
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z
				.object({
					documentId: z.string() // document must be String
				})
				.strict() //no extra fields allowed
		},
		responses: {
			[status.Ok]: {
				description: 'Document status retrieved successfully',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
							z.object({
								id: z.string(),
								status: z.string() // document status, e.g., 'PENDING', 'PROCESSING', 'READY', 'FAILED'
							})
						)
					}
				}
			},

			//Error respoonses
			[status.Unauthorized]: _401Describe, // user not logged in
			[status.NotFound]: _404Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables } = c.env; // extract useful objects from environment
		const { docTable } = dbTables; //get document table

		try {
			const documentId = c.req.param('documentId');
			const clerkId = c.get('clerkUserId');

			// Only select the fields we actually need for a lightweight polling request
			const existingDoc = await drizzleDB.query.docTable.findFirst({

				// conditions: document ID matches and belongs to logged in user (clerkId)
				where: and(
					eq(docTable.id, documentId),
					eq(docTable.clerkId, clerkId)
				),

				columns: {
					id: true,
					status: true
				}
			});


			// if document not found OR not owned by user
			if (!existingDoc) {
				return c.json(
					{
						// Fallback to a generic code if DOCUMENT_NOT_FOUND isn't in your constants yet
						code: 'document_not_found',
						message: 'Document not found or unauthorized'
					},
					status.NotFound // 404 status code
				);
			}

			// If found, return the document status
			return c.json(
				{
					data: {
						id: existingDoc.id,
						status: existingDoc.status
					}
				},
				status.Ok // 200 status code
			);
		} catch (e: any) {

			// log the error for debugging
			log.withError(e).error(e.message || 'unknown error');

			return c.json(
				{
					message: 'unknown server error'
				},
				status.InternalServerError // 500 status codes
			);
		}
	});
}
