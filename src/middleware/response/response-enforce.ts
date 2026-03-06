import type { MiddlewareHandler } from 'hono';
import { z } from 'zod';
import { response2xxSchema, error4xxSchema, error5xxSchema } from '@/openapi';

const jsonSafeParse = (str: string) => {
	try {
		return JSON.parse(str);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		return {};
	}
};

function create500Response() {
	return new Response(
		JSON.stringify({
			message: 'output validation error'
		} as z.infer<typeof error5xxSchema>),
		{
			status: 500,
			headers: {
				'Content-Type': 'application/problem+json'
			}
		}
	);
}

export const responseEnforce: MiddlewareHandler<{ Bindings: AppEnv }> = async (
	c,
	next
) => {
	await next();

	const res = c.res.clone();
	const outStr = await res.text();

	if (res.status >= 200 && res.status <= 299) {
		if (res.status === 204 && outStr) {
			c.res = create500Response();
		} else {
			const parsed = response2xxSchema.safeParse(jsonSafeParse(outStr));
			if (!parsed.success) {
				c.res = create500Response();
			} else {
				c.res.headers.set('content-type', 'application/json');
			}
		}
	} else if (res.status >= 400 && res.status <= 499) {
		const parsed = error4xxSchema.safeParse(jsonSafeParse(outStr));
		if (!parsed.success) {
			c.res = create500Response();
		} else {
			c.res.headers.set('content-type', 'application/problem+json');
		}
	} else if (res.status >= 500) {
		const parsed = error5xxSchema.safeParse(JSON.parse(outStr));
		if (!parsed.success) {
			c.res = create500Response();
		} else {
			c.res.headers.set('content-type', 'application/problem+json');
		}
	}
};
