import { z } from 'zod';
import { extendZodWithOpenApi } from '@hono/zod-openapi';

extendZodWithOpenApi(z);

export const userProfileSchema = z.object({
    id: z.string().openapi({ example: 'user_2sR...' }),
    email: z.email().openapi({ example: 'sasindu@example.com' }),
    fullName: z.string().nullable().openapi({ example: 'Sasindu Opatha' }),
    createdAt: z.iso.datetime(),
});

export const updateProfileSchema = z.object({
	learningStyle: z.enum(['Visual', 'Auditory', 'Read/Write', 'Kinesthetic']).openapi({ example: 'visual' }),
	visualScore: z.number().min(0).max(100).openapi({ example: 85 }),
	auditoryScore: z.number().min(0).max(100),
	readingScore: z.number().min(0).max(100),
	kinestheticScore: z.number().min(0).max(100),
	hobbies: z.array(z.string()).optional(),
});
