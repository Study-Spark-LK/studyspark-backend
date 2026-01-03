import { sqliteTable as table } from 'drizzle-orm/sqlite-core';
import * as t from 'drizzle-orm/sqlite-core';
import { timestamps } from '../util/columns';

export const users = table('users', {
	id: t.text('user_id').primaryKey(),
	email: t.text('email').notNull(),
	fullName: t.text('full_name'),
	...timestamps,
});

export const learningProfiles = table('learning_profiles', {
	id: t.integer('profile_id').primaryKey({ autoIncrement: true }),
	userId: t
		.text('user_id')
		.notNull()
		.references(() => users.id),

	visualScore: t.integer('visual_score').default(0),
	auditoryScore: t.integer('auditory_score').default(0),
	readingScore: t.integer('reading_score').default(0),
	kinestheticScore: t.integer('kinesthetic_score').default(0),
	
	learningStyle: t.text('learning_style'),
	hobbies: t.text('hobbies'),
	...timestamps,
});
