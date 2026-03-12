import { z } from 'zod';

const _schema = z.object({
	payload: z.object({
		id: z.uuid(),
		originalFileKey: z.string(),
		profileData: z.object({
			id: z.string(),
			name: z.string(),
			qna: z.array(z.object({
				question: z.string(),
				answer: z.string()
			}))
		})
	})
});

export type ValidatedDocumentGenerationIngestPayload = z.infer<typeof _schema>;
export const documentGenerationIngestValidatorSchema = _schema;
