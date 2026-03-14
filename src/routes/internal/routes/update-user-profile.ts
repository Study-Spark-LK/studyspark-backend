import { getHonoInstance } from '@/hono';
import { status } from '@poppanator/http-constants';
import { desc, eq } from 'drizzle-orm';

export function setupUpdateUserProfileRoute() {
	const app = getHonoInstance();

	app.patch('/internal/users/:userId/profile', async (c) => {
		const providedKey = c.req.header('x-internal-key');
		if (!providedKey || providedKey !== c.env.INTERNAL_API_KEY) {
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

		// Apply deltas: treat -1 (unset) as 0 before adding delta, clamp result to 0–100
		const applyDelta = (current: number | null, delta: number) => {
			const base = (current ?? -1) === -1 ? 0 : (current ?? 0);
			return Math.min(100, Math.max(0, base + delta));
		};

		const newVisual      = applyDelta(profile.visualScore,      body.visualDelta      ?? 0);
		const newAuditory    = applyDelta(profile.auditoryScore,    body.auditoryDelta    ?? 0);
		const newReading     = applyDelta(profile.readingScore,     body.readingDelta     ?? 0);
		const newKinesthetic = applyDelta(profile.kinestheticScore, body.kinestheticDelta ?? 0);

		await drizzleDB.update(dbTables.profileTable).set({
			visualScore:      newVisual,
			auditoryScore:    newAuditory,
			readingScore:     newReading,
			kinestheticScore: newKinesthetic
		}).where(eq(dbTables.profileTable.id, profile.id));

		return c.json({ success: true });
	});
}
