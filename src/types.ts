export type Bindings = {
	DB: D1Database;
	CLERK_SECRET_KEY: string;
	CLERK_PUBLISHABLE_KEY: string;
	CLERK_WEBHOOK_SECRET: string;
	// other keys
	ENVIRONMENT: string;
};

export type Variables = {
	userId?: string;
};

export type AppEnv = {
	Bindings: Bindings;
	Variables: Variables;
};
