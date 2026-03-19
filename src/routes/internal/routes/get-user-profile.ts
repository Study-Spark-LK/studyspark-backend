import { getHonoInstance } from '@/hono';
import { status } from '@poppanator/http-constants';
import { desc, eq } from 'drizzle-orm';
import { computeLearningStyle } from '@/util/learning-style';
import { isValidInternalApiKey } from '@/util/internal-api-key';

export function setupGetUserProfileRoute() {
	const app = getHonoInstance();

	app.get('/internal/users/:userId', async (c) => {
		const providedKey = c.req.header('x-internal-key');
		if (!isValidInternalApiKey(providedKey, c.env.INTERNAL_API_KEY)) {
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

		const learningStyle = computeLearningStyle(
			profile.visualScore,
			profile.auditoryScore,
			profile.readingScore,
			profile.kinestheticScore
		);

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
