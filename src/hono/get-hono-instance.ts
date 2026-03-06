import { OpenAPIHono } from '@hono/zod-openapi';
import { APIErrorCodes } from '@/constants';
import { formatZodError } from '@/hono/util';
import { status } from '@poppanator/http-constants';

const HONO_INSTANCE = new OpenAPIHono<{
	Bindings: AppEnv;
	Variables: ContextVariables;
}>({
	defaultHook: (result, c) => {
		if (!result.success) {
			if (result.error.name === 'ZodError') {
				const messages = JSON.parse(result.error.message);
				return c.json(
					{
						code: APIErrorCodes.INPUT_VALIDATION_ERROR,
						error: formatZodError([messages[0]])
					},
					status.BadRequest
				);
			}
		}
	}
});

export function getHonoInstance() {
	return HONO_INSTANCE;
}
