import { FileMigrationProvider, Migrator } from 'kysely';
import * as path from 'path';
import * as fs from 'fs/promises';
import { db } from './database.js';

async function migrateDown(): Promise<void> {
    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: path.join(import.meta.dirname, 'migrations'),
        }),
    });

    const { error, results } = await migrator.migrateDown();

    results?.forEach((result) => {
        if (result.status === 'Success') {
            console.log(`⬇️  Migration "${result.migrationName}" rolled back successfully`);
        } else if (result.status === 'Error') {
            console.error(`❌ Rollback of "${result.migrationName}" failed`);
        }
    });

    if (error) {
        console.error('❌ Migration rollback failed:', error);
        process.exit(1);
    }

    console.log('\n✅ Rollback completed');
    await db.destroy();
}

migrateDown();
