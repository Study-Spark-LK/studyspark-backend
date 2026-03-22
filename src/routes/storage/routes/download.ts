import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { _404Describe, _500Describe } from '@/openapi';
import {
	OpenAPITags,
	APIErrorCodes,
	UPLOAD_ALLOWED_FILE_MIME_TYPES
} from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { status } from '@poppanator/http-constants';

export function setupDownloadFileRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
		method: 'get',
		path: '/storage/files/{id}',
		tags: [OpenAPITags.STORAGE],
		operationId: 'downloadFile',
		middleware: [clerkValidate, clerkEnforced],
		request: {
			params: z
				.object({
					id: z.string()
				})
				.strict()
		},
		responses: {
			[status.Ok]: {
				description: 'file content',
				content: {
					...UPLOAD_ALLOWED_FILE_MIME_TYPES.reduce(
						(acc, type) => ({
							...acc,
							[type]: {
								schema: {
									type: 'string',
									format: 'binary'
								}
							}
						}),
						{}
					),
					'application/octet-stream': {
						description: 'when file content type is missing',
						schema: {
							type: 'string',
							format: 'binary'
						}
					}
				}
			},
			[status.NotFound]: _404Describe,
			[status.InternalServerError]: _500Describe
		}
	});

	async function handleDownload(c: any, id: string) {
		const object = await c.env.R2_FILES.get(id);
		if (!object) {
			return c.json(
				{
					code: APIErrorCodes.FILE_NOT_FOUND,
					message: 'file not found'
				},
				status.NotFound
			);
		}
		const body = await object.arrayBuffer();
		return new Response(body, {
			headers: {
				'Content-Type':
					object.httpMetadata?.contentType || 'application/octet-stream'
			},
			status: status.Ok
		});
	}

	app.openapi(spec, async (c) => {
		try {
			const id = c.req.param('id');
			return await handleDownload(c, id);
		} catch (e) {
			c.env.log
				.withError(e)
				.error('[storage][download]: ', (e as Error).message);
			return c.text('Unknown server error', status.InternalServerError);
		}
	});

	// Fallback for multi-segment R2 keys (e.g. generated/{documentId}/analytical)
	// The OpenAPI route above only matches a single path segment.
	app.get('/storage/files/*', clerkValidate, clerkEnforced, async (c) => {
		try {
			const id = c.req.path.slice('/storage/files/'.length);
			return await handleDownload(c, id);
		} catch (e) {
			c.env.log
				.withError(e)
				.error('[storage][download]: ', (e as Error).message);
			return c.text('Unknown server error', status.InternalServerError);
		}
	});
}
