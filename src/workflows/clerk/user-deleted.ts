import {
	WorkflowEntrypoint,
	WorkflowEvent,
	WorkflowStep
} from 'cloudflare:workers';
import { DeletedObjectJSON } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import { createEnv } from '@/util';

type Params = {
	deletedObject: DeletedObjectJSON;
};

export class ClerkUserDeletedWorkflow extends WorkflowEntrypoint<
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
			const deletedObject = payload.deletedObject;

			if (!deletedObject.id) {
				throw new Error(
					'deleted user id not available on object. on user.deleted'
				);
			}

			const dbUser = await drizzleDB.query.userTable.findFirst({
				where: eq(dbTables.userTable.clerkId, deletedObject.id)
			});

			if (!dbUser) {
				throw new Error(`unreachable state. DB user not found`);
			}

			log.withMetadata({
				clerkId: dbUser.clerkId,
				workflow: 'ClerkUserDeletedWorkflow'
			}).info('starting workflow');

			log.debug('extracted the primary email address');

			await step.do('delete user', async () => {
				return drizzleDB
					.delete(dbTables.userTable)
					.where(eq(dbTables.userTable.clerkId, dbUser.clerkId))
					.returning();
			});

			log.debug('successfully deleted user from db');
			log.info('finished successfully');
		} catch (e) {
			log.withError(e).error('failed workflow');
			return;
		}
	}
}
