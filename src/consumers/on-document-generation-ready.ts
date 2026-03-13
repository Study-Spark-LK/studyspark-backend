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

	const analyticalFile = payload.generatedFiles
		.find(x => x.type === 'AI_GENERATED_ANALYTICAL');
	const storyFile = payload.generatedFiles
		.find(x => x.type === 'AI_GENERATED_STORY');

	if (!analyticalFile || !storyFile) {
		throw new Error('analytical or story file missing from payload');
	}

	// Update document with AI-generated metadata and mark as READY
	await drizzleDB.update(docTable).set({
		title: payload.title,
		description: payload.description,
		category: payload.category,
		status: 'READY'
	}).where(eq(docTable.id, payload.id));

	await drizzleDB.batch([
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
