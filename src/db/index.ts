import { userTable, profileTable, docTable } from '@/db/schema';

export {
	type DBUser,
	type DBProfiles,
	type DBDocs
} from '@/db/schema';

export const dbTables = {
	userTable,
	profileTable,
	docTable
};

export { getDB, type DBInstanceType } from '@/db/get-db';
