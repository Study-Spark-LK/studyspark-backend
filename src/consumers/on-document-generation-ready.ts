import { ValidatedGenerationPayload } from '@/validators';
import { eq } from 'drizzle-orm';

export async function onDocumentGenerationReady(env: AppEnv, payload: ValidatedGenerationPayload) {
	const { drizzleDB, dbTables } = env;
	const { docTable } = dbTables;

	const doc = await drizzleDB.query.docTable.findFirst({
		where: eq(docTable.id, payload.id)
	});

	if (!doc) {
		throw new Error('document not found');
	}

	const visualFile = payload.generatedFiles
		.find(x => x.type === 'AI_GENERATED_VISUAL');
	const audioFile = payload.generatedFiles
		.find(x => x.type === 'AI_GENERATED_AUDIO');
	const analyticalFile = payload.generatedFiles
		.find(x => x.type === 'AI_GENERATED_ANALYTICAL');
	const storyFile = payload.generatedFiles
		.find(x => x.type === 'AI_GENERATED_STORY');

	if (!visualFile || !audioFile || !storyFile || !analyticalFile) {
		throw new Error('all files not found, at least one is missing');
	}

	const insertRes = await drizzleDB.batch([
		drizzleDB
			.insert(dbTables.fileTable)
			.values({
				id: visualFile.fileKey,
				clerkId: doc.clerkId,
				docId: doc.id,
				type: 'AI_GENERATED_VISUAL',
				mimeType: visualFile.mimeType
			}),
		drizzleDB
			.insert(dbTables.fileTable)
			.values({
				id: audioFile.fileKey,
				clerkId: doc.clerkId,
				docId: doc.id,
				type: 'AI_GENERATED_AUDIO',
				mimeType: audioFile.mimeType
			}),
		drizzleDB
			.insert(dbTables.fileTable)
			.values({
				id: analyticalFile.fileKey,
				clerkId: doc.clerkId,
				docId: doc.id,
				type: 'AI_GENERATED_ANALYTICAL',
				mimeType: analyticalFile.mimeType
			}),
		drizzleDB
			.insert(dbTables.fileTable)
			.values({
				id: storyFile.fileKey,
				clerkId: doc.clerkId,
				docId: doc.id,
				type: 'AI_GENERATED_STORY',
				mimeType: storyFile.mimeType
			})
	]);
}
