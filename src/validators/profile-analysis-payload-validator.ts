import { z } from 'zod';

const _varsSchema = z.object({
	id: z.uuid(),
	visualScore: z.number(),
	auditoryScore: z.number(),
	readingScore: z.number(),
	kinestheticScore: z.number()
});

export type ValidatedProfileAnalysisPayload = z.infer<typeof _varsSchema>;
export const profileAnalysisPayloadValidatorSchema = _varsSchema;
