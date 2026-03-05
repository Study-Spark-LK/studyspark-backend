import { integer } from 'drizzle-orm/sqlite-core';

export function createdAtUpdatedAt() {
	return {
		createdAt: integer({ mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer({ mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	};
}
