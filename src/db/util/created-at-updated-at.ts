import { integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export function createdAtUpdatedAt() {
	return {
        createdAt: integer({ mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
        updatedAt: integer({ mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(unixepoch() * 1000)`)
            .$onUpdateFn(() => new Date())
    };
}
