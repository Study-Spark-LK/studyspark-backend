import { z } from 'zod';

const _schema = z.object({
	payload: z.object({
		id: z.uuid(),
		originalFileKey: z.string(),
		profileData: z.object({
			id: z.string(),
			clerkId: z.string(),
			name: z.string(),
			hobbies: z.array(z.string()).default([]),
			qna: z.array(z.object({
				question: z.string(),
				answer: z.string()
			})),
			visualScore: z.number().default(-1),
			auditoryScore: z.number().default(-1),
			readingScore: z.number().default(-1),
			kinestheticScore: z.number().default(-1)
		})
	})
});

export type ValidatedDocumentGenerationIngestPayload = z.infer<typeof _schema>;
export const documentGenerationIngestValidatorSchema = _schema;
