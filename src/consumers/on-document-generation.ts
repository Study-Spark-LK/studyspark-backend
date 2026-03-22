import { QueuePayloadType } from '@/constants';
import { type ValidatedDocumentGenerationIngestPayload } from '@/validators';
import { eq } from 'drizzle-orm';

interface AgentProcessResponse {
	topic: string;
	personalised_explanation: string;
	tldr_summary: string;
	key_points: string[];
	analogies: string[];
	difficulty: string;
	story_mode_explanation: string;
	concept_map: Record<string, unknown>;
	flashcards?: Array<{ question: string; answer: string; hint?: string }>;
}

const MIME_TO_EXT: Record<string, string> = {
	'application/pdf': 'pdf',
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'text/plain': 'txt'
};

export async function onDocumentGeneration(env: AppEnv, payload: ValidatedDocumentGenerationIngestPayload) {
	const { AGENT_URL, INTERNAL_API_KEY, QUEUE_UPSTREAM_OUTPUT, drizzleDB, dbTables, R2_FILES } = env;
	const { id: documentId, originalFileKey, profileData } = payload.payload;

	// Look up document and file for clerkId and mimeType
	const [doc, file] = await Promise.all([
		drizzleDB.query.docTable.findFirst({ where: eq(dbTables.docTable.id, documentId) }),
		drizzleDB.query.fileTable.findFirst({ where: eq(dbTables.fileTable.id, originalFileKey) })
	]);
	if (!doc) throw new Error(`Document not found: ${documentId}`);
	if (!file) throw new Error(`File record not found: ${originalFileKey}`);

	// Read original file from R2 (key includes extension since upload route appends it)
	const ext = MIME_TO_EXT[file.mimeType] ?? 'bin';
	const r2Object = await R2_FILES.get(`uploads/${originalFileKey}.${ext}`);
	if (!r2Object) throw new Error(`R2 object not found: uploads/${originalFileKey}.${ext}`);
	const arrayBuffer = await r2Object.arrayBuffer();
	const mimeType = file.mimeType;

	// Build material payload for the agent
	const material: Record<string, unknown> = {};
	if (mimeType === 'application/pdf') {
		material.pdfBase64 = Buffer.from(arrayBuffer).toString('base64');
	} else if (mimeType.startsWith('image/')) {
		material.imageBase64 = Buffer.from(arrayBuffer).toString('base64');
		material.mimeType = mimeType;
	} else {
		material.text = new TextDecoder().decode(arrayBuffer);
	}

	// Call agent to process the content
	const res = await fetch(`${AGENT_URL}/internal/process`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Internal-Key': INTERNAL_API_KEY
		},
		body: JSON.stringify({
			userId: doc.clerkId,
			material,
			profileData: {
				user_id: profileData.clerkId,
				visual_score: profileData.visualScore,
				auditory_score: profileData.auditoryScore,
				reading_score: profileData.readingScore,
				kinesthetic_score: profileData.kinestheticScore,
				hobbies: profileData.hobbies,
				education_level: null,
				learning_goal: null,
				preferred_difficulty: 'intermediate'
			}
		})
	});

	if (!res.ok) {
		throw new Error(`Agent /internal/process failed: ${res.status} ${await res.text()}`);
	}

	const result = await res.json() as AgentProcessResponse;

	// Upload 2 generated content files to R2
	const analyticalKey = `generated/${documentId}/analytical`;
	const storyKey = `generated/${documentId}/story`;

	await Promise.all([
		R2_FILES.put(analyticalKey, JSON.stringify({
			topic: result.topic,
			explanation: result.personalised_explanation,
			tldrSummary: result.tldr_summary,
			keyPoints: result.key_points,
			analogies: result.analogies,
			difficulty: result.difficulty,
			conceptMap: result.concept_map
		}), { httpMetadata: { contentType: 'application/json' } }),
		R2_FILES.put(storyKey, JSON.stringify({
			story: result.story_mode_explanation
		}), { httpMetadata: { contentType: 'application/json' } })
	]);

	// Notify via upstream-output queue
	await QUEUE_UPSTREAM_OUTPUT.send({
		type: QueuePayloadType.DOCUMENT_GENERATION_READY,
		payload: {
			id: documentId,
			title: result.topic,
			description: result.personalised_explanation.slice(0, 200),
			category: 'AI Generated',
			generatedFiles: [
				{ type: 'AI_GENERATED_ANALYTICAL', fileKey: analyticalKey, mimeType: 'application/json' },
				{ type: 'AI_GENERATED_STORY',      fileKey: storyKey,      mimeType: 'application/json' }
			],
			flashcards: result.flashcards ?? []
		}
	});
}
