import { text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const timestamps = {
	updatedAt: text('updated_at'),
	createdAt: text('created_at')
		.default(sql`(CURRENT_TIMESTAMP)`)
		.notNull(),
	deletedAt: text('deleted_at'),
};
