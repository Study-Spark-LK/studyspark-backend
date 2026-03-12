import { z } from 'zod';

const _schema = z.object({
	payload: z.object({
		id: z.uuid(),
		name: z.string(),
		qna: z.array(z.object({
			question: z.string(),
			answer: z.string()
		}))
	})
});

export type ValidatedProfileAnalysisIngestPayload = z.infer<typeof _schema>;
export const profileAnalysisIngestValidatorSchema = _schema;
