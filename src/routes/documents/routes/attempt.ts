import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
    _401Describe,
    _404Describe,
    _500Describe,
    response2xxSchemaWrapper
} from '@/openapi';
import { OpenAPITags, APIErrorCodes } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { status } from '@poppanator/http-constants';
import { eq, and } from 'drizzle-orm';

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
        },
        responses: {
            [status.Ok]: {
                description: 'Quiz attempt retrieved successfully',
                content: {
                    'application/json': {
                        schema: response2xxSchemaWrapper(QuizAttemptSchema)
                    }
                }
            },
            [status.Unauthorized]: _401Describe,
            [status.NotFound]: _404Describe,
            [status.InternalServerError]: _500Describe
        }
	});

	app.openapi(spec, async (c) => {
        const { log, drizzleDB, dbTables } = c.env;
        const { quizAttemptTable } = dbTables;

        try {
            const documentId = c.req.param('documentId');
            const attemptId = c.req.param('attemptId');
            const clerkId = c.get('clerkUserId');

            const attempt = await drizzleDB.query.quizAttemptTable.findFirst({
                where: and(
                    eq(quizAttemptTable.id, attemptId),
                    eq(quizAttemptTable.documentId, documentId),
                    eq(quizAttemptTable.clerkId, clerkId)
                ),
                columns: {
                    id: true,
                    documentId: true,
                    score: true,
                    correctCount: true,
                    totalQuestions: true,
                    weakAreas: true,
                    recommendation: true,
                    createdAt: true
                }
            });

            if (!attempt) {
                return c.json(
                    {
                        code: 'attempt_not_found',
                        message: 'Quiz attempt not found or unauthorized'
                    },
                    status.NotFound
                );
            }

            return c.json(
                {
                    data: {
                        id: attempt.id,
                        documentId: attempt.documentId,
                        score: attempt.score,
                        correctCount: attempt.correctCount,
                        totalQuestions: attempt.totalQuestions,
                        weakAreas: attempt.weakAreas,
                        recommendation: attempt.recommendation,
                        createdAt: Number(attempt.createdAt)
                    }
                },
                status.Ok
            );
        } catch (e: any) {
            log.withError(e).error(e.message || 'unknown error');

            return c.json(
                { message: 'unknown server error' },
                status.InternalServerError
            );
        }
    });
}
