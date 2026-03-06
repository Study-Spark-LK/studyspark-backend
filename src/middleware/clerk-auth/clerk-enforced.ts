import type { MiddlewareHandler } from 'hono';
import { APIErrorCodes } from '@/constants';

/**
 * This enforces clerk authentication.
 * @param c
 * @param next
 */
export const clerkEnforced: MiddlewareHandler<{
	Bindings: AppEnv;
	Variables: ContextVariables;
}> = async (c, next) => {
	const isAuthenticated = c.get('isClerkAuthenticated');
	if (isAuthenticated) {
		await next();
	} else {
		return c.json(
			{
				code: APIErrorCodes.AUTHENTICATION_REQUIRED,
				message: 'needs to be logged in'
			},
			401
		);
	}
};
