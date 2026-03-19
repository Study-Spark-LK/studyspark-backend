import { getHonoInstance } from '@/hono';
import { status } from '@poppanator/http-constants';
import { desc, eq } from 'drizzle-orm';
import { applyDelta } from '@/util/vark';
import { isValidInternalApiKey } from '@/util/internal-api-key';

export function setupUpdateUserProfileRoute() {
	const app = getHonoInstance();

	app.patch('/internal/users/:userId/profile', async (c) => {
		const providedKey = c.req.header('x-internal-key');
		if (!isValidInternalApiKey(providedKey, c.env.INTERNAL_API_KEY)) {
			return c.json({ error: 'Unauthorized' }, status.Unauthorized);
		}

		const { userId } = c.req.param();
		const { drizzleDB, dbTables } = c.env;

		const body = await c.req.json() as {
			visualDelta?: number;
			auditoryDelta?: number;
			readingDelta?: number;
			kinestheticDelta?: number;
		};

		// Find the most recent profile for this user
		const profile = await drizzleDB.query.profileTable.findFirst({
			where: eq(dbTables.profileTable.clerkId, userId),
			orderBy: [desc(dbTables.profileTable.createdAt)]
		});

		if (!profile) {
			return c.json({ error: 'Profile not found' }, status.NotFound);
		}

		const newVisual      = applyDelta(profile.visualScore,      body.visualDelta      ?? 0);
		const newAuditory    = applyDelta(profile.auditoryScore,    body.auditoryDelta    ?? 0);
		const newReading     = applyDelta(profile.readingScore,     body.readingDelta     ?? 0);
		const newKinesthetic = applyDelta(profile.kinestheticScore, body.kinestheticDelta ?? 0);

		await drizzleDB.update(dbTables.profileTable).set({
			visualScore:      newVisual,
			auditoryScore:    newAuditory,
			readingScore:     newReading,
			kinestheticScore: newKinesthetic,
			status:           'READY'
		}).where(eq(dbTables.profileTable.id, profile.id));

		return c.json({ success: true });
	});
}
