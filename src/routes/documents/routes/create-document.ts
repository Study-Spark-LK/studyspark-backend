import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { APIErrorCodes, OpenAPITags, QueuePayloadType } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import {
	_400Describe,
	_401Describe,
	_500Describe,
	response2xxSchemaWrapper
} from '@/openapi';
import { status } from '@poppanator/http-constants';
import { and, eq, isNull } from 'drizzle-orm';

export function setupCreateDocumentRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'post',
		path: '/documents',
		tags: [OpenAPITags.DOCUMENTS],
		operationId: 'createDocument',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			body: {
				description: 'document info',
				content: {
					'application/json': {
						schema: z.object({
							fileId: z.string(),
							profileId: z.string()
						})
					}
				}
			}
		},
		responses: {
			[status.Created]: {
				description: 'document created successfully',
				content: {
					'application/json': {
						schema: response2xxSchemaWrapper(
							z.object({
								id: z.string(),
								profileId: z.string(),
								status: z.literal('PENDING')
							})
						)
					}
				}
			},
			[status.BadRequest]: _400Describe,
			[status.Unauthorized]: _401Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables, QUEUE_UPSTREAM_INGEST } = c.env;
		const { profileTable, fileTable, docTable } = dbTables;

		try {
			const documentId = crypto.randomUUID();
			const { fileId, profileId } = c.req.valid('json');
			const clerkId = c.get('clerkUserId');

			const existingProfile = await drizzleDB.query.profileTable.findFirst({
				where: and(
					eq(profileTable.id, profileId),
					eq(profileTable.clerkId, clerkId)
				)
			});

			if (!existingProfile) {
				return c.json(
					{
						code: APIErrorCodes.PROFILE_NOT_FOUND,
						message: 'profile not found'
					},
					status.BadRequest
				);
			}

			if (existingProfile.status === 'PENDING') {
				return c.json(
					{
						code: APIErrorCodes.PROFILE_NOT_READY,
						message: 'profile not ready yet'
					},
					status.BadRequest
				);
			}

			const existingFile = await drizzleDB.query.fileTable.findFirst({
				where: and(
					eq(fileTable.id, fileId),
					isNull(fileTable.docId)
				)
			});

			if (!existingFile) {
				return c.json(
					{
						code: APIErrorCodes.FILE_NOT_FOUND,
						message: 'file not found'
					},
					status.BadRequest
				);
			}

			if (existingFile.type !== 'USER_SUBMITTED') {
				return c.json(
					{
						code: APIErrorCodes.INVALID_FILE,
						message: 'file is not a valid USER_SUBMITTED type'
					},
					status.BadRequest
				);
			}


			const batchRes = await drizzleDB.batch([
				drizzleDB
					.insert(docTable)
					.values({
						id: documentId,
						clerkId: clerkId,
						profileId: profileId,
						status: 'PENDING'
					})
					.returning(),
				drizzleDB
					.update(fileTable)
					.set({
						docId: documentId
					})
					.where(and(
						eq(fileTable.id, fileId),
						isNull(fileTable.docId)
					))
					.returning()
			]);

			await QUEUE_UPSTREAM_INGEST.send({
				type: QueuePayloadType.DOCUMENT_GENERATION,
				payload: {
					id: documentId,
					originalFileKey: fileId,
					profileData: {
						id: existingProfile.id,
						name: existingProfile.name,
						qna: existingProfile.qna
					}
				}
			});

			return c.json(
				{
					data: {
						id: documentId,
						profileId: profileId,
						status: 'PENDING'
					}
				},
				status.Created
			);
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
