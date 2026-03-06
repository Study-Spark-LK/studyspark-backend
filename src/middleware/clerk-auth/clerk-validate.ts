import type { MiddlewareHandler } from 'hono';

/**
 * This validates clerk authentication.
 * not enforced, so unauthenticated requests are allowed.
 * @param c
 * @param next
 */
export const clerkValidate: MiddlewareHandler<{
	Bindings: AppEnv;
	Variables: ContextVariables;
}> = async (c, next) => {
	const { clerkInstance } = c.env;

	const { isAuthenticated, toAuth } = await clerkInstance.authenticateRequest(
		c.req.raw,
		{
			jwtKey: '',
			publishableKey: c.env.CLERK_PUBLISHABLE_KEY
		}
	);

	c.set('isClerkAuthenticated', isAuthenticated);
	if (isAuthenticated) {
		const authObj = toAuth();
		c.set('clerkUserId', authObj?.userId);
	}

	await next();
};
