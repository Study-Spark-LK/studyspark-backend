import { APIErrorCodes } from '@/constants';
import { RouteConfig, z } from '@hono/zod-openapi';

// RFC 9457, refer :https://docs.stripe.com/api/errors?utm_source=chatgpt.com
// for in-depth inspiration when making new API.
export const error4xxSchema = z
	.object({
		code: z.enum(APIErrorCodes),
		message: z.string()
	})
	.strict()
	.openapi('error 4xx schema');
