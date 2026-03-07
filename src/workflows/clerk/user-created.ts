import {
	WorkflowEntrypoint,
	WorkflowEvent,
	WorkflowStep
} from 'cloudflare:workers';
import { UserJSON as ClerkUserJSON } from '@clerk/backend';
import { createEnv } from '@/util';

type Params = {
	clerkUser: ClerkUserJSON;
};

export class ClerkUserCreatedWorkflow extends WorkflowEntrypoint<
	AppEnv,
	Params
> {
	async run(
		{ payload }: WorkflowEvent<Params>,
		step: WorkflowStep
	): Promise<void> {
		// @ts-ignore
		this.env = await createEnv(this.env as Env);
		const { dbTables, log, drizzleDB } = this.env;

		try {
			const user = payload.clerkUser;

			log.withMetadata({
				clerkId: user.id,
				workflow: 'ClerkUserCreatedWorkflow'
			}).info('starting workflow');

			log.debug('extracted the primary email address');

			await step.do('ensure db sync', async () => {
				return drizzleDB
					.insert(dbTables.userTable)
					.values({
						clerkId: user.id
					})
					.returning();
			});

			log.debug('successfully inserted user to db');
			log.info('finished successfully');
		} catch (e) {
			log.withError(e).error('failed workflow');
			return;
		}
	}
}
