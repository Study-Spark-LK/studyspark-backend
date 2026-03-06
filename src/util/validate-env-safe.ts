import { envValidatorSchema, ValidatedEnv } from '@/validators';
import { ZodError } from 'zod';

export function validateEnvSafe(
	env: Env
):
	| { success: true; vars: ValidatedEnv; error: undefined }
	| { success: false; vars: undefined; error: ZodError<ValidatedEnv> } {
	const varsParse = envValidatorSchema.safeParse(env);
	if (!varsParse.success) {
		return {
			success: false,
			vars: undefined,
			error: varsParse.error
		};
	} else {
		return {
			success: true,
			vars: varsParse.data,
			error: undefined
		};
	}
}
