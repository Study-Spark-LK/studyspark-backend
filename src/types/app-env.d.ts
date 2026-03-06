import { type ValidatedEnv } from '@/validators/env-validator';
import { type ClerkClient } from '@clerk/backend';
import { type DBInstanceType } from '@/db';
import { dbTables } from '@/db';
import { getLogger } from '@/util';

type Custom = {
	// ------- Auth
	clerkInstance: ClerkClient;
	// ------- DB
	drizzleDB: DBInstanceType;
	dbTables: typeof dbTables;
	// ------- Logging
	log: ReturnType<typeof getLogger>;
	// ------- Other & Util
};

// Note: Omit<Env, keyof ValidatedEnvTypes>: Removes any keys from Env that are also present in ValidatedEnvTypes.
export type AppEnv = Custom &
	Omit<ValidatedEnv, keyof Custom> &
	Omit<Env, keyof ValidatedEnv>;

export type ContextVariables = {
	// ------- Clerk Auth
	isClerkAuthenticated: boolean;
	clerkUserId: string;
};
