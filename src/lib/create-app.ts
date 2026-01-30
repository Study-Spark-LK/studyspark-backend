import { OpenAPIHono } from '@hono/zod-openapi';
import { AppEnv } from '@/types';
import { APIErrorCodes } from '@/constants';
import { status } from '@poppanator/http-constants';
import { formatZodError } from '@/hono/util';

export function createHonoApp() {
	return new OpenAPIHono<AppEnv>({
		strict: false,
		defaultHook: (result, c) => {
			if (!result.success) {
				if (result.error.name === 'ZodError') {
					const messages = JSON.parse(result.error.message);
					return c.json(
						{
							code: APIErrorCodes.INPUT_VALIDATION_ERROR,
							error: formatZodError([messages[0]]),
						},
						status.BadRequest,
					);
				}
			}
		},
	});
}
