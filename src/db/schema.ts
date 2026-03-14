import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';
import { createdAtUpdatedAt } from '@/db/util';
import { relations, sql } from 'drizzle-orm';

export const userTable = table('users', {
	clerkId: t.text('user_id').primaryKey(),
	...createdAtUpdatedAt()
});
export type DBUser = typeof userTable.$inferSelect;

export const profileTable = table('profiles', {
    id: t.text('profile_id').primaryKey(),
    clerkId: t
        .text('user_id')
        .notNull()
        .references(() => userTable.clerkId, {
            onUpdate: 'cascade',
            onDelete: 'cascade'
        }),
    name: t.text('name').notNull().default(''),
    hobbies: t
        .text('hobbies', { mode: 'json' })
        .$type<string[]>()
        .notNull()
        .default([]),
    qna: t
        .text('qna', { mode: 'json' })
        .$type<{ question: string; answer: string }[]>()
        .notNull()
        .default([]),
    status: t
        .text({ enum: ['PENDING', 'READY'] })
        .default('PENDING'),
    visualScore: t.integer('visual_score').default(-1),
    auditoryScore: t.integer('auditory_score').default(-1),
    readingScore: t.integer('reading_score').default(-1),
    kinestheticScore: t.integer('kinesthetic_score').default(-1),
    ...createdAtUpdatedAt()
});
export type DBProfiles = typeof profileTable.$inferSelect;

export const docTable = table('documents', {
    id: t.text('material_id').primaryKey(),
    clerkId: t
        .text('user_id')
        .notNull()
        .references(() => userTable.clerkId, {
            onUpdate: 'cascade',
            onDelete: 'cascade'
        }),
    profileId: t
        .text('profile_id')
        .notNull()
        .default('')
        .references(() => profileTable.id, {
            onUpdate: 'cascade',
            onDelete: 'cascade'
        }),
    status: t
        .text({ enum: ['PENDING', 'READY'] })
        .default('PENDING'),
    title: t.text('title'),
    description: t.text('description'),
    category: t.text('category').default('General'),
    progressPercentage: t.real().default(-1),
    ...createdAtUpdatedAt()
});
export type DBDocs = typeof docTable.$inferSelect;

export const fileTable = table('file', (t) => ({
	id: t.text().notNull().primaryKey().unique(),
	clerkId: t
		.text()
		.notNull()
		.references(() => userTable.clerkId, {
			onUpdate: 'cascade',
			onDelete: 'cascade'
		}),
	docId: t.text().references(() => docTable.id, {
		onUpdate: 'cascade',
		onDelete: 'cascade'
	}),
	type: t.text({
		enum: [
			'PENDING',
			'USER_SUBMITTED',
			'AI_GENERATED_VISUAL',
			'AI_GENERATED_AUDIO',
			'AI_GENERATED_ANALYTICAL',
			'AI_GENERATED_STORY'
		]
	}).default('PENDING'),
	mimeType: t.text().notNull(),
	fileName: t.text(),
	...createdAtUpdatedAt()
}));
export type DBFile = typeof fileTable.$inferSelect;

export const flashcardTable = table('flashcards', {
    id: t.text('id').primaryKey(),
    documentId: t
        .text('document_id')
        .notNull()
        .references(() => docTable.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    clerkId: t
        .text('user_id')
        .notNull()
        .references(() => userTable.clerkId, { onUpdate: 'cascade', onDelete: 'cascade' }),
    question: t.text('question').notNull(),
    answer: t.text('answer').notNull(),
    hint: t.text('hint'),
    ...createdAtUpdatedAt()
});
export type DBFlashcard = typeof flashcardTable.$inferSelect;

export const quizQuestionTable = table('quiz_questions', {
    id: t.text('id').primaryKey(),
    documentId: t
        .text('document_id')
        .notNull()
        .references(() => docTable.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    clerkId: t
        .text('user_id')
        .notNull()
        .references(() => userTable.clerkId, { onUpdate: 'cascade', onDelete: 'cascade' }),
    question: t.text('question').notNull(),
    options: t
        .text('options', { mode: 'json' })
        .$type<string[]>()
        .notNull()
        .default([]),
    correctAnswer: t.text('correct_answer').notNull(),
    explanation: t.text('explanation'),
    difficulty: t.text('difficulty').notNull().default('medium'),
    concept: t.text('concept'),
    varkDimension: t.text('vark_dimension'),
    createdAt: t.integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch() * 1000)`)
});
export type DBQuizQuestion = typeof quizQuestionTable.$inferSelect;

export const quizAttemptTable = table('quiz_attempts', {
    id: t.text('id').primaryKey(),
    documentId: t
        .text('document_id')
        .notNull()
        .references(() => docTable.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    clerkId: t
        .text('user_id')
        .notNull()
        .references(() => userTable.clerkId, { onUpdate: 'cascade', onDelete: 'cascade' }),
    profileId: t
        .text('profile_id')
        .notNull()
        .references(() => profileTable.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
    score: t.real('score').notNull().default(0),
    correctCount: t.integer('correct_count').notNull().default(0),
    totalQuestions: t.integer('total_questions').notNull().default(0),
    weakAreas: t
        .text('weak_areas', { mode: 'json' })
        .$type<string[]>()
        .notNull()
        .default([]),
    recommendation: t.text('recommendation'),
    createdAt: t.integer('created_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`(unixepoch() * 1000)`)
});
export type DBQuizAttempt = typeof quizAttemptTable.$inferSelect;

// ========================= Relations =================================
export const userRelations = relations(userTable, ({ many }) => ({
	profiles: many(profileTable),
	docs: many(docTable)
}));

export const profileRelations = relations(profileTable, ({ many }) => ({
	docs: many(docTable),
	files: many(fileTable)
}));
