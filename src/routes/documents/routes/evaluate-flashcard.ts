import { getHonoInstance } from '@/hono';
import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';



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
        

    });
}
