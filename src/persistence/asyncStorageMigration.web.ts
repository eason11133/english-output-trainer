import type { U1MigrationReportV1 } from './operationalTypes';
export async function migrateU1AsyncStorageV1(_learnerId:string):Promise<U1MigrationReportV1>{return{runId:'web-deferred',accepted:0,rejected:0,deduped:0,quarantined:0,sourceDeleted:false,errors:['native_sqlite_migration_not_available_on_web']}}
