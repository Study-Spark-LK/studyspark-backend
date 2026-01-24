import { z } from 'zod';

export const updateProfileSchema = z.object({
	learningStyle: z.enum(['Visual', 'Auditory', 'Read/Write', 'Kinesthetic']),
	visualScore: z.number().min(0).max(100),
	auditoryScore: z.number().min(0).max(100),
	readingScore: z.number().min(0).max(100),
	kinestheticScore: z.number().min(0).max(100),
	hobbies: z.array(z.string()).optional(),
});
