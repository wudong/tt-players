import { FileMigrationProvider, Migrator } from 'kysely';
import * as path from 'path';
import * as fs from 'fs/promises';
import { db } from './database.js';

async function migrateToLatest(): Promise<void> {
    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: path.join(import.meta.dirname, 'migrations'),
        }),
    });

    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((result) => {
        if (result.status === 'Success') {
            console.log(`✅ Migration "${result.migrationName}" applied successfully`);
        } else if (result.status === 'Error') {
            console.error(`❌ Migration "${result.migrationName}" failed`);
        }
    });

    if (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }

    console.log('\n✅ All migrations applied successfully');
    await db.destroy();
}

migrateToLatest();
