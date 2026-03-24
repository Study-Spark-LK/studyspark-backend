import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { OpenAPITags, } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';



export function setupGetQuizAttemptRoute() {
    const app = getHonoInstance();

    const spec = createRoute({
        method: 'get',
        path: '/documents/{documentId}/quiz/attempts/{attemptId}',
        tags: [OpenAPITags.DOCUMENTS],
        operationId: 'getQuizAttempt',
        middleware: [clerkValidate, clerkEnforced],
        request: {
            params: z
                .object({
                    documentId: z.string(),
                    attemptId: z.string()
                })
                .strict()
        }
    });
}
