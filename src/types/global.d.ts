import {
	type AppEnv as _AppEnv,
	type ContextVariables as _ContextVariables
} from '@/types/app-env';

declare global {
	type AppEnv = _AppEnv;
	type ContextVariables = _ContextVariables;
	// const ErrorCodes = _ErrorCodes;
	// const HTTPStatusCodes = _HTTPStatusCodes;
	/*
	 * This is a workaround for a bug in Cloudflare Workers vitest.
	 * to make fetch? into -> fetch!.
	 * ↓↓↓  ↓↓↓
	 */
	type RequiredFetchHandler<Env> = Omit<ExportedHandler<Env>, 'fetch'> & {
		fetch: ExportedHandlerFetchHandler<Env>;
	};
}
export {};
