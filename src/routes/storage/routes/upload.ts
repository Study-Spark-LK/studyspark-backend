import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { z } from 'zod';
import { _400Describe, _401Describe, _500Describe } from '@/openapi';
import { v4 as uuidv4 } from 'uuid';
import { status } from '@poppanator/http-constants';
import {
    OpenAPITags,
    APIErrorCodes,
    UPLOAD_ALLOWED_FILE_MIME_TYPES,
    UPLOAD_MAX_SIZE_IN_BYTES
} from '@/constants';

export function setupUploadFileRoute() {
    const app = getHonoInstance();

    const spec = createRoute({
        method: 'post',
        path: '/storage/files',
        tags: [OpenAPITags.STORAGE],
        operationId: 'uploadFile',
        middleware: [clerkValidate, clerkEnforced],
        request: {
            headers: z.object({
                'content-length': z
                    .string()
                    .regex(/^\d+$/, 'Content-Length must be a numeric string')
                    .refine((value) => {
                        const x = parseInt(value, 10);
                        if (x <= 0) {
                            return false;
                        }
                        return x <= UPLOAD_MAX_SIZE_IN_BYTES;
                    }, 'Content-Length must be greater than 0'),
                'content-type': z.enum(UPLOAD_ALLOWED_FILE_MIME_TYPES),
                'x-file-name': z.string().optional()
            }),
            body: {
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
                    )
                }
            }
        },
        responses: {
            [status.Created]: {
                description: 'file uploaded successfully',
                content: {
                    'application/json': {
                        schema: z.object({
                            data: z.object({
                                id: z.string()
                            })
                        })
                    }
                }
            },
            [status.BadRequest]: _400Describe,
            [status.Unauthorized]: _401Describe,
            [status.InternalServerError]: _500Describe
        }
    });
    app.openapi(spec, async (c) => {
        const { log, drizzleDB, dbTables } = c.env;

        try {
            const contentType = c.req.header('content-type') as string;

            log.info('Reading Buffer...');

            const id = uuidv4();
            const content = await c.req.arrayBuffer();

            if (content.byteLength > UPLOAD_MAX_SIZE_IN_BYTES) {
                log.withContext({
                    contentByteLength: content.byteLength
                }).error('Invalid Content Byte Length...');

                return c.json(
                    {
                        code: APIErrorCodes.FILE_TOO_LARGE,
                        message: 'file too large. greater thant 15mb'
                    },
                    status.BadRequest
                );
            }

            log.withContext({ contentByteLength: content.byteLength }).info(
                'Valid Content Byte Length...'
            );

            const MIME_TO_EXT: Record<string, string> = {
                'application/pdf': 'pdf',
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/gif': 'gif',
                'image/webp': 'webp',
                'text/plain': 'txt'
            };
            const ext = MIME_TO_EXT[contentType] ?? 'bin';

            log.info('Starting File Upload...');
            await c.env.R2_FILES.put(`uploads/${id}.${ext}`, content, {
                httpMetadata: {
                    contentType: contentType
                }
            });

            log.debug('File Upload Complete...');
            log.info('Starting db insert');

            await drizzleDB.insert(dbTables.fileTable).values({
                id: id,
                clerkId: c.get('clerkUserId'),
                mimeType: contentType,
                fileName: c.req.header('x-file-name') //optional
            });

            log.debug('DB insert completed');

            return c.json(
                {
                    data: {
                        id: id
                    }
                },
                status.Created
            );
        } catch (e) {
            log.withError(e).info('File Upload Failed...');

            return c.json(
                {
                    message: 'unknown server error'
                },
                status.InternalServerError
            );
        }
    });
}
