import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { OpenAPITags, } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';

// schema for quiz attempt response
const QuizAttemptSchema = z.object({
    id: z.string(),
    documentId: z.string(),
    score: z.number(),
    correctCount: z.number(),
    totalQuestions: z.number(),
    weakAreas: z.array(z.string()), // Parses the JSON string[] from the DB
    recommendation: z.string().nullable(),
    createdAt: z.number() // timestamp
});

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
