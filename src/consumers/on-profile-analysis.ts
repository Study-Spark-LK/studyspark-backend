import { QueuePayloadType } from '@/constants';
import { type ValidatedProfileAnalysisIngestPayload } from '@/validators';
import { eq } from 'drizzle-orm';

export async function onProfileAnalysis(env: AppEnv, payload: ValidatedProfileAnalysisIngestPayload) {
	const { AGENT_URL, INTERNAL_API_KEY, QUEUE_UPSTREAM_OUTPUT, drizzleDB, dbTables } = env;
	const agentUrl = AGENT_URL.replace(/\/$/, '');
	const { id: profileId, name, qna } = payload.payload;

	// Look up clerkId — needed so agent tools can retrieve the user's profile
	const profile = await drizzleDB.query.profileTable.findFirst({
		where: eq(dbTables.profileTable.id, profileId)
	});
	if (!profile) throw new Error(`Profile not found: ${profileId}`);

	const res = await fetch(`${agentUrl}/internal/profile/analyze`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Internal-Key': INTERNAL_API_KEY
		},
		body: JSON.stringify({ userId: profile.clerkId, profileId, name, qna })
	});

	if (!res.ok) {
		throw new Error(`Agent /internal/profile/analyze failed: ${res.status} ${await res.text()}`);
	}

	const { visualScore, auditoryScore, readingScore, kinestheticScore } = await res.json() as {
		visualScore: number;
		auditoryScore: number;
		readingScore: number;
		kinestheticScore: number;
	};

	await QUEUE_UPSTREAM_OUTPUT.send({
		type: QueuePayloadType.PROFILE_ANALYSIS_READY,
		payload: {
			id: profileId,
			visualScore,
			auditoryScore,
			readingScore,
			kinestheticScore
		}
	});
}
