import { z } from 'zod';

const _varsSchema = z.object({
    // -----> General ENVs
    // This is the safest approach. ======> PRODUCTION BY DEFAULT <=====.
    ENVIRONMENT: z
        .enum(['development', 'test', 'production'])
        .default('production'),
    // -----> Clerk
    CLERK_SECRET_KEY: z.string().nonempty(),
    CLERK_PUBLISHABLE_KEY: z.string().nonempty(),
    CLERK_WEBHOOK_SIGNING_KEY: z.string().nonempty(),
    // -----> Drizzle ORM ENVs
    // -----> Other
    MAXIMUM_PROFILES_PER_USER: z.coerce.number()

});

export type ValidatedEnv = z.infer<typeof _varsSchema>;
export const envValidatorSchema = _varsSchema;
