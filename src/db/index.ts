import { userTable, profileTable, docTable, fileTable } from '@/db/schema';

export {
	type DBUser,
	type DBProfiles,
	type DBDocs
} from '@/db/schema';

export const dbTables = {
	userTable,
	profileTable,
	docTable,
	fileTable
};

export { getDB, type DBInstanceType } from '@/db/get-db';
