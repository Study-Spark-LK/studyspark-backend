import { error5xxSchema } from '@/openapi/schema/error-5xx-schema';
import { RouteConfig, z } from '@hono/zod-openapi';

type ResponseDefinition = RouteConfig['responses'][number];

export const _500Describe: ResponseDefinition = {
	description: 'unknown server error',
	content: {
		'application/json': {
			schema: error5xxSchema
		}
	}
};
