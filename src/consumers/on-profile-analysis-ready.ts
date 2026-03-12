import { ValidatedProfileAnalysisPayload } from '@/validators';
import { eq } from 'drizzle-orm';
import { profileTable } from '@/db/schema';

export async function onProfileAnalysisReady(env: AppEnv, payload: ValidatedProfileAnalysisPayload) {
	const { drizzleDB, dbTables } = env;

	const updateRes = await drizzleDB.update(dbTables.profileTable).set({
		auditoryScore: payload.auditoryScore,
		visualScore: payload.visualScore,
		readingScore: payload.readingScore,
		kinestheticScore: payload.kinestheticScore,
		status: 'READY'
	})
		.where(eq(profileTable.id, payload.id))
		.returning();

	if (updateRes.length === 0) {
		throw new Error('No profile found');
	}
}
