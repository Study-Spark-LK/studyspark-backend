import { integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const timestamps = {
	updatedAt: integer('updated_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
	deletedAt: integer('deleted_at', { mode: 'timestamp' }),
};
