
import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { _404Describe, _500Describe, _401Describe } from '@/openapi';
import { OpenAPITags, APIErrorCodes } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { status } from '@poppanator/http-constants';
import { eq, and } from 'drizzle-orm';

export function setupDeleteFileRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'delete',
		path: '/storage/files/{id}',
		tags: [OpenAPITags.STORAGE],
		operationId: 'deleteFile',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z.object({
				id: z.string()
			}).strict()
		},
		responses: {
			[status.Ok]: {
				description: 'file deleted successfully',
				content: {
					'application/json': {
						schema: z.object({
							message: z.string()
						})
					}
				}
			},
			[status.NotFound]: _404Describe,
			[status.Unauthorized]: _401Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	app.openapi(spec, async (c) => {
		const { log, drizzleDB, dbTables } = c.env;

		try {
			const id = c.req.param('id');
			const clerkId = c.get('clerkUserId');

			log.info(`Attempting to delete file ${id} for user ${clerkId}`);

			// 1. Verify ownership and existence
			const existingFile = await drizzleDB.query.fileTable.findFirst({
				where: and(
					eq(dbTables.fileTable.id, id),
					eq(dbTables.fileTable.clerkId, clerkId)
				)
			});

			if (!existingFile) {
				return c.json(
					{
						code: APIErrorCodes.FILE_NOT_FOUND,
						message: 'file not found or unauthorized'
					},
					status.NotFound
				);
			}

			// 2. Reconstruct the R2 key
			const MIME_TO_EXT: Record<string, string> = {
				'application/pdf': 'pdf',
				'image/jpeg': 'jpg',
				'image/png': 'png',
				'image/gif': 'gif',
				'image/webp': 'webp',
				'text/plain': 'txt'
			};
			const ext = MIME_TO_EXT[existingFile.mimeType] ?? 'bin';
			const r2Key = `uploads/${id}.${ext}`;

			// 3. Delete from R2
			await c.env.R2_FILES.delete(r2Key);
			log.debug('Deleted from R2');

			// 4. Delete from DB
			await drizzleDB
				.delete(dbTables.fileTable)
				.where(eq(dbTables.fileTable.id, id));
			
			log.debug('Deleted from Database');

			return c.json({ message: 'file deleted successfully' }, status.Ok);

		} catch (e) {
			log.withError(e).error('File Deletion Failed...');
			return c.json(
				{ message: 'unknown server error' },
				status.InternalServerError
			);
		}
	});
}