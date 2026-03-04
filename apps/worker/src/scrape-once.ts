import { quickAddJob, runMigrations, runOnce } from 'graphile-worker';
import { db } from '@tt-players/db';
import { bootstrap } from './bootstrap.js';
import { taskList } from './worker.js';
import dotenv from 'dotenv';
import { sql } from 'kysely';

dotenv.config();

async function main() {
    const DATABASE_URL = process.env['DATABASE_URL'];
    if (!DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }

    console.log('🚀 Starting one-off scrape...');

    // 1. Run migrations for graphile-worker
    await runMigrations({ connectionString: DATABASE_URL });

    // 2. Bootstrap targets from config
    const targets = await bootstrap(db);
    console.log(`✅ Bootstrapped ${targets.length} targets.`);

    // 3. Add initial jobs to the queue
    for (const target of targets) {
        console.log(`  → Queuing standings: ${target.leagueName} - ${target.divisionName}`);
        await quickAddJob({ connectionString: DATABASE_URL }, 'scrapeUrlTask', {
            url: target.url,
            platformId: target.platformId,
            platformType: target.platformType,
            competitionId: target.competitionId,
        });

        if (target.platformType === 'ttleagues' && target.divisionExtId) {
            console.log(`  → Queuing matches:   ${target.leagueName} - ${target.divisionName}`);
            await quickAddJob({ connectionString: DATABASE_URL }, 'scrapeMatchesTask', {
                divisionId: target.divisionExtId,
                platformId: target.platformId,
                platformType: target.platformType,
                competitionId: target.competitionId,
            });
        }
    }

    console.log('✨ Jobs queued. Starting worker to process all jobs...');

    // 4. Run worker until queue is empty
    // Note: runOnce will process all jobs currently in the queue.
    // Since our tasks add more jobs (scrapeUrlTask -> processLogTask),
    // we might need to call runOnce in a loop until no more jobs are found,
    // or use a runner that we stop when idle.
    
    let jobsProcessed = 0;
    while (true) {
        const result = await sql<{ count: string }>`select count(*) from graphile_worker.jobs`.execute(db);
        const pendingJobs = Number(result.rows[0]?.count ?? 0);
        
        if (pendingJobs === 0) break;
        
        console.log(`📦 Processing ${pendingJobs} jobs...`);
        await runOnce({
            connectionString: DATABASE_URL,
            taskList,
        });
    }

    console.log('🏁 Scraping and processing complete.');
    await db.destroy();
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Scrape failed:', err);
    process.exit(1);
});
