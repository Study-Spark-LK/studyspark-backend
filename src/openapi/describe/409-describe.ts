import { error4xxSchema } from '@/openapi/schema/error-4xx-schema';
import { RouteConfig, z } from '@hono/zod-openapi';

type ResponseDefinition = RouteConfig['responses'][number];

export const _409Describe: ResponseDefinition = {
	description: 'conflict',
	content: {
		'application/problem+json': {
			schema: error4xxSchema
		}
	},
	headers: z.object({
		'content-type': z.literal('application/problem+json')
	})
};
