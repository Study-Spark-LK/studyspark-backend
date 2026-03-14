import { getHonoInstance } from '@/hono';
import { status } from '@poppanator/http-constants';
import { desc, eq } from 'drizzle-orm';

export function setupGetUserProfileRoute() {
	const app = getHonoInstance();

	app.get('/internal/users/:userId', async (c) => {
		const providedKey = c.req.header('x-internal-key');
		if (!providedKey || providedKey !== c.env.INTERNAL_API_KEY) {
			return c.json({ error: 'Unauthorized' }, status.Unauthorized);
		}

		const { userId } = c.req.param();
		const { drizzleDB, dbTables } = c.env;

		// Return the most recent READY profile for this user, or the most recent overall
		const profile = await drizzleDB.query.profileTable.findFirst({
			where: eq(dbTables.profileTable.clerkId, userId),
			orderBy: [desc(dbTables.profileTable.createdAt)]
		});

		if (!profile) {
			return c.json({ error: 'Profile not found' }, status.NotFound);
		}

		// Derive dominant learning style from VARK scores
		const scores = {
			visual: profile.visualScore ?? 0,
			auditory: profile.auditoryScore ?? 0,
			reading: profile.readingScore ?? 0,
			kinesthetic: profile.kinestheticScore ?? 0
		};
		const maxScore = Math.max(...Object.values(scores));
		const learningStyle = maxScore <= 0
			? null
			: (Object.entries(scores).find(([, v]) => v === maxScore)?.[0] ?? null) as
				'visual' | 'auditory' | 'reading' | 'kinesthetic' | null;

		return c.json({
			user_id: userId,
			email: null,
			full_name: profile.name ?? null,
			visual_score: profile.visualScore ?? -1,
			auditory_score: profile.auditoryScore ?? -1,
			reading_score: profile.readingScore ?? -1,
			kinesthetic_score: profile.kinestheticScore ?? -1,
			learning_style: learningStyle,
			hobbies: profile.hobbies ?? [],
			education_level: null,
			learning_goal: null,
			preferred_difficulty: 'intermediate'
		});
	});
}
