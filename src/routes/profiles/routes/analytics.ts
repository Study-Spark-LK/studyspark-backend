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
import { eq, and, sql } from 'drizzle-orm';

const ProfileAnalyticsSchema = z.object({
    profileId: z.string(),
    learningStyles: z.object({
        visual: z.number(),
        auditory: z.number(),
        reading: z.number(),
        kinesthetic: z.number()
    }),
    stats: z.object({
        totalDocuments: z.number(),
        quizzesTaken: z.number(),
        averageQuizScore: z.number()
    })
});

export function setupGetProfileAnalyticsRoute() {
	const app = getHonoInstance();

	const spec = createRoute({
        method: 'get',
        path: '/profiles/{profileId}/analytics',
        tags: [OpenAPITags.PROFILES],
        operationId: 'getProfileAnalytics',
        middleware: [clerkValidate, clerkEnforced],
        request: {
            params: z
                .object({
                    profileId: z.string()
                })
                .strict()
        },
        responses: {
            [status.Ok]: {
                description: 'Profile analytics retrieved successfully',
                content: {
                    'application/json': {
                        schema: response2xxSchemaWrapper(ProfileAnalyticsSchema)
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
        const { profileTable, docTable, quizAttemptTable } = dbTables;

        try {
            const profileId = c.req.param('profileId');
            const clerkId = c.get('clerkUserId');

            const profile = await drizzleDB.query.profileTable.findFirst({
                where: and(
                    eq(profileTable.id, profileId),
                    eq(profileTable.clerkId, clerkId)
                ),
                columns: {
                    visualScore: true,
                    auditoryScore: true,
                    readingScore: true,
                    kinestheticScore: true
                }
            });

            if (!profile) {
                return c.json(
                    {
                        code: 'profile_not_found',
                        message: 'Profile not found or unauthorized'
                    },
                    status.NotFound
                );
            }

            const [docStats] = await drizzleDB
                .select({ count: sql<number>`count(*)` })
                .from(docTable)
                .where(eq(docTable.profileId, profileId));

            const [quizStats] = await drizzleDB
                .select({
                    count: sql<number>`count(*)`,
                    averageScore: sql<number>`COALESCE(avg(${quizAttemptTable.score}), 0)`
                })
                .from(quizAttemptTable)
                .where(eq(quizAttemptTable.profileId, profileId));

            return c.json(
                {
                    data: {
                        profileId: profileId,
                        learningStyles: {
                            visual: profile.visualScore ?? 0,
                            auditory: profile.auditoryScore ?? 0,
                            reading: profile.readingScore ?? 0,
                            kinesthetic: profile.kinestheticScore ?? 0
                        },
                        stats: {
                            totalDocuments: Number(docStats?.count || 0),
                            quizzesTaken: Number(quizStats?.count || 0),
                            averageQuizScore:
                                Math.round(
                                    Number(quizStats?.averageScore || 0) * 10
                                ) / 10
                        }
                    }
                },
                status.Ok
            );
        } catch (e: any) {
            log.withError(e).error('Analytics computation failed');

            return c.json(
                { message: 'unknown server error' },
                status.InternalServerError
            );
        }
    });
}
