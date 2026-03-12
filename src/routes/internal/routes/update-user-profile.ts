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
			visual?: number;
			auditory?: number;
			reading?: number;
			kinesthetic?: number;
		};

		// Find the most recent profile for this user
		const profile = await drizzleDB.query.profileTable.findFirst({
			where: eq(dbTables.profileTable.clerkId, userId),
			orderBy: [desc(dbTables.profileTable.createdAt)]
		});

		if (!profile) {
			return c.json({ error: 'Profile not found' }, status.NotFound);
		}

		// Apply deltas, clamped to 0–100
		const clamp = (val: number) => Math.min(100, Math.max(0, val));
		const updated = await drizzleDB.update(dbTables.profileTable).set({
			visualScore:      clamp((profile.visualScore      ?? 0) + (body.visual      ?? 0)),
			auditoryScore:    clamp((profile.auditoryScore    ?? 0) + (body.auditory    ?? 0)),
			readingScore:     clamp((profile.readingScore     ?? 0) + (body.reading     ?? 0)),
			kinestheticScore: clamp((profile.kinestheticScore ?? 0) + (body.kinesthetic ?? 0))
		})
			.where(eq(dbTables.profileTable.id, profile.id))
			.returning();

		return c.json({ updated: true, profile: updated[0] });
	});
}
