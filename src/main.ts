import { getHonoInstance } from '@/hono';
import { cors } from 'hono/cors';
import { status } from '@poppanator/http-constants';
import { createEnv } from '@/util';
import { setupRoutes } from '@/routes';
import { setupDevOnlyRoute } from '@/routes/dev-only';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { QueuePayloadType } from '@/constants';
import { profileAnalysisPayloadValidatorSchema } from '@/validators';
import { onProfileAnalysisReady } from '@/consumers/on-profile-analysis-ready';

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
	fetch: app.fetch,
	queue: async function(batch, _env, ctx): Promise<void> {

		const env = await createEnv(_env);
		const { log } = env;

		for (const message of batch.messages) {
			const body = message.body as { type: string };

			if (body['type'] && body['type'] === QueuePayloadType.PROFILE_ANALYSIS_READY) {
				const parsed = profileAnalysisPayloadValidatorSchema.safeParse(body);
				if (parsed.success) {
					try {
						await onProfileAnalysisReady(env, parsed.data);
						message.ack();
					} catch (error: any) {
						log.withMetadata({
							id: message.id,
							attempts: message.attempts
						}).error(error);
					}
				} else {
					log.withMetadata({
						id: message.id,
						attempts: message.attempts
					}).error('invalid body');
				}
			} else if (body['type'] && body['type'] === QueuePayloadType.DOCUMENT_GENERATION_READY) {
				//Document Generation Ready
			} else {
				log.withMetadata({
					id: message.id,
					attempts: message.attempts
				}).error('unknown message type');
			}
		}
	}
} satisfies ExportedHandler<Env>;
