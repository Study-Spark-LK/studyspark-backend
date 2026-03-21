// src/routes/storage/routes/update.ts
import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import { _400Describe, _401Describe, _404Describe, _500Describe } from '@/openapi';
import { status } from '@poppanator/http-constants';
import { eq, and } from 'drizzle-orm';
import {
	OpenAPITags,
	APIErrorCodes,
	UPLOAD_ALLOWED_FILE_MIME_TYPES,
	UPLOAD_MAX_SIZE_IN_BYTES
} from '@/constants';

export function setupUpdateFileRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'put',
		path: '/storage/files/{id}',
		tags: [OpenAPITags.STORAGE],
		operationId: 'updateFile',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z.object({
				id: z.string()
			}).strict(),
			headers: z.object({
				'content-length': z
					.string()
					.regex(/^\d+$/, 'Content-Length must be a numeric string')
					.refine((value) => {
						const x = parseInt(value, 10);
						if (x <= 0) return false;
						return x <= UPLOAD_MAX_SIZE_IN_BYTES;
					}, 'Content-Length must be greater than 0 and under limit'),
				'content-type': z.enum(UPLOAD_ALLOWED_FILE_MIME_TYPES),
				'x-file-name': z.string().optional()
			}),
			body: {
				content: {
					...UPLOAD_ALLOWED_FILE_MIME_TYPES.reduce(
						(acc, type) => ({
							...acc,
							[type]: {
								schema: { type: 'string', format: 'binary' }
							}
						}),
						{}
					)
				}
			}
		},
		responses: {
			[status.Ok]: {
				description: 'file updated successfully',
				content: {
					'application/json': {
						schema: z.object({
							data: z.object({ id: z.string() })
						})
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
			const id = c.req.param('id');
			const clerkId = c.get('clerkUserId');
			const contentType = c.req.header('content-type') as string;

			// 1. Verify ownership
			const existingFile = await drizzleDB.query.fileTable.findFirst({
				where: and(
					eq(dbTables.fileTable.id, id),
					eq(dbTables.fileTable.clerkId, clerkId)
				)
			});

			if (!existingFile) {
				return c.json(
					{ code: APIErrorCodes.FILE_NOT_FOUND, message: 'file not found' },
					status.NotFound
				);
			}

			// 2. Read new content
			const content = await c.req.arrayBuffer();
			if (content.byteLength > UPLOAD_MAX_SIZE_IN_BYTES) {
				return c.json(
					{ code: APIErrorCodes.FILE_TOO_LARGE, message: 'file too large' },
					status.BadRequest
				);
			}

			const MIME_TO_EXT: Record<string, string> = {
				'application/pdf': 'pdf',
				'image/jpeg': 'jpg',
				'image/png': 'png',
				'image/gif': 'gif',
				'image/webp': 'webp',
				'text/plain': 'txt'
			};

			// 3. Delete old file from R2 (in case the extension changed)
			const oldExt = MIME_TO_EXT[existingFile.mimeType] ?? 'bin';
			// await c.env.R2_FILES.delete(uploads/${id}.${oldExt});

			// 4. Upload new file to R2
			// const newExt = MIME_TO_EXT[contentType] ?? 'bin';
			// await c.env.R2_FILES.put(uploads/${id}.${newExt}, content, {
			// 	httpMetadata: { contentType: contentType }
			// });

			// 5. Update DB metadata
			await drizzleDB
				.update(dbTables.fileTable)
				.set({
					mimeType: contentType,
					fileName: c.req.header('x-file-name') // optional
				})
				.where(eq(dbTables.fileTable.id, id));

			return c.json({ data: { id: id } }, status.Ok);

		} catch (e) {
			log.withError(e).error('File Update Failed...');
			return c.json(
				{ message: 'unknown server error' },
				status.InternalServerError
			);
		}
	});
}