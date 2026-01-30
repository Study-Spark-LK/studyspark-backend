import { z } from '@hono/zod-openapi';

export enum APIErrorCodes {
	INPUT_VALIDATION_ERROR = 'input_validation_error',
	AUTHENTICATION_REQUIRED = 'authentication_required',
	SERVER_ERROR = 'server_error',
}

export const errorSchema = z.object({
	code: z.enum(APIErrorCodes).openapi({ example: APIErrorCodes.INPUT_VALIDATION_ERROR }),
	message: z.string().openapi({ example: 'Invalid email format' }),
});

export const error400 = {
	description: 'Bad Request / Validation Error',
	content: {
		'application/json': { schema: errorSchema },
	},
};

export const error401 = {
	description: 'Unauthorized / Missing Token',
	content: {
		'application/json': { schema: errorSchema },
	},
};

export const error500 = {
	description: 'Internal Server Error',
	content: {
		'application/json': { schema: errorSchema },
	},
};
