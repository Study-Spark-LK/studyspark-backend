import { z } from 'zod';

const _varsSchema = z.object({
	id: z.uuid(),
	visualScore: z.number().positive(),
	auditoryScore: z.number().positive(),
	readingScore: z.number().positive(),
	kinestheticScore: z.number().positive()
});

export type ValidatedProfileAnalysisPayload = z.infer<typeof _varsSchema>;
export const profileAnalysisPayloadValidatorSchema = _varsSchema;
