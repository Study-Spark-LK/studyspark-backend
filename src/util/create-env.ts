import { AppEnv } from '@/types/app-env';
import { validateEnvSafe } from '@/util/validate-env-safe';
import { getLogger } from '@/util/get-logger';
import { createClerkClient } from '@clerk/backend';
import { dbTables, getDB } from '@/db';

export async function createEnv(env: Env): Promise<AppEnv> {
	const {
		success,
		vars: validatedVars,
		error: validationError
	} = validateEnvSafe(env);

	if (!success) {
		throw validationError;
	}

	const validatedEnv = {
		...env,
		...validatedVars
	};

	// ----------------- END OF VALIDATION -------------------

	const IS_PRODUCTION = validatedEnv.ENVIRONMENT === 'production';

	// Logs
	const logger = getLogger(env, validatedEnv);

	// Auth
	const clerkInstance = createClerkClient({
		secretKey: env.CLERK_SECRET_KEY
	});

	// DB
	const drizzleDB = getDB(env.HYPERDRIVE_COCKROACH_DB.connectionString);


	// ---------------------- Setting up Context ----------------------
	return {
		...validatedEnv,
		// Logs
		log: logger,
		// Auth
		clerkInstance: clerkInstance,
		// DB
		drizzleDB: drizzleDB,
		dbTables: dbTables
	};
}
