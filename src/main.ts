import { getHonoInstance } from '@/hono';
import { cors } from 'hono/cors';
import { status } from '@poppanator/http-constants';
import { createEnv } from '@/util';
import { setupRoutes } from '@/routes';
import { setupDevOnlyRoute } from '@/routes/dev-only';
import { clerkEnforced, clerkValidate } from '@/middleware';
import { QueuePayloadType } from '@/constants';
import {
	generationPayloadValidatorSchema,
	profileAnalysisPayloadValidatorSchema,
	profileAnalysisIngestValidatorSchema,
	documentGenerationIngestValidatorSchema
} from '@/validators';
import { onProfileAnalysisReady } from '@/consumers/on-profile-analysis-ready';
import { onDocumentGenerationReady } from '@/consumers/on-document-generation-ready';
import { onProfileAnalysis } from '@/consumers/on-profile-analysis';
import { onDocumentGeneration } from '@/consumers/on-document-generation';

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

// Agent connectivity check
app.get('/health/agent', async (c) => {
	const { AGENT_URL } = c.env;
	try {
		const res = await fetch(`${AGENT_URL}/health`, { method: 'GET' });
		const body = await res.text();
		return c.json({ status: res.ok ? 'ok' : 'error', agentUrl: AGENT_URL, httpStatus: res.status, body });
	} catch (err: any) {
		return c.json({ status: 'unreachable', agentUrl: AGENT_URL, error: err?.message }, 502);
	}
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
			const body = message.body as { type: string, payload: any };

			const meta = { id: message.id, attempts: message.attempts, msgType: body['type'] };

			if (body['type'] && body['type'] === QueuePayloadType.PROFILE_ANALYSIS_READY) {
				const parsed = profileAnalysisPayloadValidatorSchema.safeParse(body.payload);
				if (parsed.success) {
					try {
						await onProfileAnalysisReady(env, parsed.data);
						message.ack();
					} catch (error: any) {
						log.withMetadata(meta).error(error);
					}
				} else {
					log.withMetadata({ ...meta, zodErrors: parsed.error.issues }).error('invalid body');
				}
			} else if (body['type'] && body['type'] === QueuePayloadType.DOCUMENT_GENERATION_READY) {
				const parsed = generationPayloadValidatorSchema.safeParse(body.payload);
				if (parsed.success) {
					try {
						await onDocumentGenerationReady(env, parsed.data);
						message.ack();
					} catch (error: any) {
						log.withMetadata(meta).error(error);
					}
				} else {
					log.withMetadata({ ...meta, zodErrors: parsed.error.issues }).error('invalid body');
				}
			} else if (body['type'] && body['type'] === QueuePayloadType.PROFILE_ANALYSIS) {
				const parsed = profileAnalysisIngestValidatorSchema.safeParse(body);
				if (parsed.success) {
					try {
						await onProfileAnalysis(env, parsed.data);
						message.ack();
					} catch (error: any) {
						log.withMetadata(meta).error(error);
					}
				} else {
					log.withMetadata({ ...meta, zodErrors: parsed.error.issues }).error('invalid body');
				}
			} else if (body['type'] && body['type'] === QueuePayloadType.DOCUMENT_GENERATION) {
				const parsed = documentGenerationIngestValidatorSchema.safeParse(body);
				if (parsed.success) {
					try {
						await onDocumentGeneration(env, parsed.data);
						message.ack();
					} catch (error: any) {
						log.withMetadata(meta).error(error);
					}
				} else {
					log.withMetadata({ ...meta, zodErrors: parsed.error.issues }).error('invalid body');
				}
			} else {
				log.withMetadata(meta).error('unknown message type');
			}
		}
	}
} satisfies ExportedHandler<Env>;
