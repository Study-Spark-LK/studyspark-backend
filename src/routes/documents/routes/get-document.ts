import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { APIErrorCodes, OpenAPITags } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import {
	_400Describe,
	_401Describe, _404Describe,
	_500Describe,
	response2xxSchemaWrapper
} from '@/openapi';
import { status } from '@poppanator/http-constants';
import { and, desc, eq } from 'drizzle-orm';

export function setupGetDocumentRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'get',
		path: '/documents/{documentId}',
		tags: [OpenAPITags.DOCUMENTS],
		operationId: 'getDocument',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z
				.object({
					documentId: z.string()
				})
				.openapi({
					param: {
						name: 'documentId',
						in: 'path',
						required: true
					},
					example: '25ad8416-fd96-4fd7-9185-de00ca8269c5'
				})
		},
		responses: {
			[status.Ok]: {
				description: 'documents',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
							z.object({
								id: z.string(),
								profileId: z.string(),
								status: z.enum(['PENDING', 'READY']),
								// --- Info
								title: z.string(),
								description: z.string(),
								category: z.string(),
								progressPercentage: z.number(),
								// -- Files
								originalFileId: z.string(),
								generatedFiles: z.array(z.object({
									fileId: z.string(),
									type: z.enum(['analytical', 'story'])
								}))
							})
						)
					}
				}
			},
			[status.BadRequest]: _400Describe,
			[status.Unauthorized]: _401Describe,
			[status.NotFound]: _404Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables } = c.env;

		try {
			const clerkId = c.get('clerkUserId');
			const { documentId } = c.req.valid('param');
			const { docTable, fileTable } = dbTables;

			const doc = await drizzleDB.query.docTable.findFirst({
				where: and(
					eq(docTable.id, documentId),
					eq(docTable.clerkId, clerkId)
				)
			});

			if (!doc) {
				return c.json(
					{
						code: APIErrorCodes.DOCUMENT_NOT_FOUND,
						message: 'document not found'
					},
					status.NotFound
				);
			}

			// original, analytical, story
			const files = await drizzleDB.batch([
				drizzleDB.query.fileTable.findFirst({
					where: and(
						eq(fileTable.docId, documentId),
						eq(fileTable.clerkId, clerkId),
						eq(fileTable.type, 'USER_SUBMITTED')
					)
				}),
				drizzleDB.query.fileTable.findFirst({
					where: and(
						eq(fileTable.docId, documentId),
						eq(fileTable.clerkId, clerkId),
						eq(fileTable.type, 'AI_GENERATED_ANALYTICAL')
					)
				}),
				drizzleDB.query.fileTable.findFirst({
					where: and(
						eq(fileTable.docId, documentId),
						eq(fileTable.clerkId, clerkId),
						eq(fileTable.type, 'AI_GENERATED_STORY')
					)
				})
			]);

			function getGeneratedFileArr() {
				const types = ['analytical', 'story'] as const;
				const a: { fileId: string; type: typeof types[number] }[] = [];
				for (let x = 0; x < types.length; x++) {
					const res = files[x + 1];
					if (res) a.push({ fileId: res.id, type: types[x] });
				}
				return a;
			}

			return c.json({
				data: {
					id: doc.id,
					profileId: doc.profileId,
					status: doc.status,
					// --- Info
					title: doc.title,
					description: doc.description,
					category: doc.category,
					progressPercentage: doc.progressPercentage,
					// --- Files
					originalFileId: files[0]?.id,
					generatedFiles: getGeneratedFileArr()
				}
			});
		} catch (e: any) {
			log.withError(e).error(e.message || 'unknown error');

			return c.json(
				{
					message: 'unknown server error'
				},
				status.InternalServerError
			);
		}
	});
}
