import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
    _400Describe,
    _401Describe,
    _404Describe,
    _500Describe,
    response2xxSchemaWrapper
} from '@/openapi';
import { OpenAPITags, APIErrorCodes } from '@/constants';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { status } from '@poppanator/http-constants';
import { eq, and } from 'drizzle-orm';

const EvaluateFlashcardBodySchema = z.object({
    flashcardId: z.string(),
    userAnswer: z.string().min(1, 'Answer cannot be empty').max(1000)
});

const EvaluateFlashcardResponseSchema = z.object({
    isCorrect: z.boolean(),
    score: z.number(),
    feedback: z.string()
});

export function setupEvaluateFlashcardRoute() {
    const app = getHonoInstance();

    const spec = createRoute({
        method: 'post',
        path: '/documents/{documentId}/flashcards/evaluate',
        tags: [OpenAPITags.DOCUMENTS],
        operationId: 'evaluateFlashcard',
        middleware: [clerkValidate, clerkEnforced],
        request: {
            params: z
                .object({
                    documentId: z.string()
                })
                .strict(),
            body: {
                content: {
                    'application/json': { schema: EvaluateFlashcardBodySchema }
                }
            }
        },
        responses: {
            [status.Ok]: {
                description: 'Flashcard evaluated successfully',
                content: {
                    'application/json': {
                        schema: response2xxSchemaWrapper(
                            EvaluateFlashcardResponseSchema
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

        const { flashcardTable } = dbTables;

        try {
            const documentId = c.req.param('documentId');

            const clerkId = c.get('clerkUserId');

            const { flashcardId, userAnswer } = c.req.valid('json');

            const flashcard = await drizzleDB.query.flashcardTable.findFirst({
                where: and(
                    eq(flashcardTable.id, flashcardId),

                    eq(flashcardTable.documentId, documentId),

                    eq(flashcardTable.clerkId, clerkId)
                ),

                columns: { question: true, answer: true }
            });

            if (!flashcard) {
                return c.json(
                    {
                        code: 'flashcard_not_found',
                        message: 'Flashcard not found or unauthorized'
                    },

                    status.NotFound
                );
            }

            const cleanUserAnswer = userAnswer.trim().toLowerCase();

            const cleanRealAnswer = flashcard.answer.trim().toLowerCase();

            const isCorrect =
                cleanUserAnswer === cleanRealAnswer ||
                cleanRealAnswer.includes(cleanUserAnswer);

            const score = isCorrect ? 100 : 0;

            const feedback = isCorrect
                ? 'Correct!'
                : `Incorrect. The expected answer was: ${flashcard.answer}`;

            return c.json(
                {
                    data: {
                        isCorrect: isCorrect,

                        score: score,

                        feedback: feedback
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
