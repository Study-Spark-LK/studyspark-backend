import { getHonoInstance } from '@/hono';
import { cors } from 'hono/cors';
import { status } from '@poppanator/http-constants';
import { createEnv } from '@/util';
import { setupRoutes } from '@/routes';
import { setupDevOnlyRoute } from '@/routes/dev-only';
import { clerkEnforced, clerkValidate } from '@/middleware';

// export { AIPayrollWorkflow } from '@/workflows/ai/ai-payroll-workflow';
export { ClerkUserCreatedWorkflow } from '@/workflows/clerk/user-created';
export { ClerkUserDeletedWorkflow } from '@/workflows/clerk/user-deleted';

const app = getHonoInstance();

//#region -------------------------- App Setup --------------------------
app.use(cors());
app.onError((error, c) => {
	const { ENVIRONMENT } = c.env;

	// onError hook to report unhandled exceptions to Sentry or console;
	if (ENVIRONMENT === 'development' || ENVIRONMENT === 'test') {
		// Log is not available here, so console.error is used.
		console.error(error);
	} else {
		// Sentry.captureException(error);
		console.error(error);
	}
	return c.json(
		{ error: 'Internal server error' },
		status.InternalServerError
	);
});

// Context Creation
app.use(async (c, next) => {
	// 'OnError' hook above will catch any errors thrown here
	// @ts-ignore
	const env = await createEnv(c.env as Env);

	c.env = env;
	await next();
});

// API Healthcheck
app.get('/health', async (c) => {
	return c.json({
		status: 'ok'
	});
});

//#endregion --------------------- End App Setup ------------------------

//TODO add response enforce middleware here
setupRoutes();
setupDevOnlyRoute(app);

app.get(
	'/create-user-if-not-exists',
	clerkValidate,
	clerkEnforced,
	async (c) => {
		const { dbTables, drizzleDB, clerkInstance } = c.env;

		await drizzleDB
			.insert(dbTables.userTable)
			.values({
				clerkId: c.get('clerkUserId')
			})
			.onConflictDoNothing();

		return c.json({
			msg: 'ok'
		});
	}
);


export default {
	fetch: app.fetch
} satisfies ExportedHandler<Env>;
