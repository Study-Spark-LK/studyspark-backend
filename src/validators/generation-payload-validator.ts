import { z } from 'zod';

const _varsSchema = z.object({
	id: z.uuid(),
	title: z.string(),
	description: z.string(),
	category: z.string(),
	generatedFiles: z.array(z.object({
		type: z.enum([
			'AI_GENERATED_VISUAL',
			'AI_GENERATED_AUDIO',
			'AI_GENERATED_ANALYTICAL',
			'AI_GENERATED_STORY'
		]),
		fileKey: z.string(),
		mimeType: z.string()
	}))
});

export type ValidatedGenerationPayload = z.infer<typeof _varsSchema>;
export const generationPayloadValidatorSchema = _varsSchema;
