import { z } from 'zod';

export const response2xxSchemaWrapper = (
	data: z.ZodObject | z.ZodArray | z.ZodUnion
) =>
	z
		.object({
			data:
				data instanceof z.ZodArray || data instanceof z.ZodUnion
					? data
					: data.strict()
		})
		.strict();

export const response2xxSchema = z
	.object({
		data: z.looseObject({})
	})
	.strict();
