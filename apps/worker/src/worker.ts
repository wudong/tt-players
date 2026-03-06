import { run, runMigrations } from 'graphile-worker';
import dotenv from 'dotenv';
import { db } from '@tt-players/db';
import { scrapeUrlTask } from './tasks/scrapeUrlTask.js';
import { processLogTask } from './tasks/processLogTask.js';
import { scrapeMatchesTask } from './tasks/scrapeMatchesTask.js';
import { bootstrap, type ScrapeTarget } from './bootstrap.js';
import { runStartupRecovery } from './startup-recovery.js';

dotenv.config();

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set.');
}

// Holds the scrape targets resolved at startup
let scrapeTargets: ScrapeTarget[] = [];
const SCRAPE_JOB_SPEC = { maxAttempts: 1 };

/**
 * Graphile Worker task: reads the bootstrapped targets and queues
 * a scrapeUrlTask for each one. This is the task triggered by cron.
 */
const scheduleScrapeTasks = async (_payload: unknown, helpers: { addJob: Function; logger: { info: (msg: string) => void } }) => {
    const activeTargets = scrapeTargets.filter((t) => !t.isHistorical);
    const historicalCount = scrapeTargets.length - activeTargets.length;
    helpers.logger.info(
        `scheduleScrapeTasks: queuing ${activeTargets.length} active targets (skipping ${historicalCount} historical targets)`,
    );

    for (const target of activeTargets) {
        // 1. Queue standings scrape
        await helpers.addJob('scrapeUrlTask', {
            url: target.url,
            platformId: target.platformId,
            platformType: target.platformType,
            competitionId: target.competitionId,
            tt365DataType: target.platformType === 'tt365' ? 'standings' : undefined,
        }, SCRAPE_JOB_SPEC);
        helpers.logger.info(`  → Queued standings: ${target.leagueName} - ${target.divisionName}`);

        // 2. Queue fixtures scrape for TT365 divisions
        if (target.platformType === 'tt365' && target.fixturesUrl) {
            await helpers.addJob('scrapeUrlTask', {
                url: target.fixturesUrl,
                platformId: target.platformId,
                platformType: target.platformType,
                competitionId: target.competitionId,
                tt365DataType: 'fixtures',
            }, SCRAPE_JOB_SPEC);
            helpers.logger.info(`  → Queued fixtures:  ${target.leagueName} - ${target.divisionName}`);
        }

        // 3. Queue matches scrape for TT Leagues divisions
        if (target.platformType === 'ttleagues' && target.divisionExtId) {
            await helpers.addJob('scrapeMatchesTask', {
                divisionId: target.divisionExtId,
                platformId: target.platformId,
                platformType: target.platformType,
                competitionId: target.competitionId,
            }, SCRAPE_JOB_SPEC);
            helpers.logger.info(`  → Queued matches:   ${target.leagueName} - ${target.divisionName}`);
        }
    }
};

/**
 * Graphile Worker task list.
 */
export const taskList = {
    scrapeUrlTask,
    processLogTask,
    scrapeMatchesTask,
    scheduleScrapeTasks,
};

/**
 * Cron schedule (UTC):
 * Queue scheduleScrapeTasks every day at 2:00 AM.
 * Backfill up to 1 day of missed jobs.
 */
const CRONTAB = `0 2 * * * scheduleScrapeTasks ?fill=1d`;

/**
 * Starts the Graphile Worker runner.
 *
 * 1. Bootstraps DB records from leagues.json (idempotent)
 * 2. Starts the Graphile Worker with cron scheduling
 */
export async function startWorker(): Promise<void> {
    // Bootstrap: ensure Platform/League/Season/Competition rows exist
    console.log('🔧 Bootstrapping from leagues.json...');
    scrapeTargets = await bootstrap(db);
    console.log(`  ✅ ${scrapeTargets.length} scrape targets resolved\n`);

    // List them
    for (const t of scrapeTargets) {
        console.log(`  📋 ${t.leagueName} - ${t.divisionName}`);
    }
    console.log('');

    // Run graphile-worker schema migrations
    await runMigrations({
        connectionString: DATABASE_URL,
    });
    await runStartupRecovery(db, (message) => console.log(message));

    const runner = await run({
        connectionString: DATABASE_URL,
        concurrency: 1,
        pollInterval: 5000,
        taskList,
        crontab: CRONTAB,
    });

    // Graceful shutdown on signals
    const shutdown = async () => {
        await runner.stop();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    console.log('Graphile Worker started. Waiting for jobs...');
}

// Auto-start when run directly
const isDirectRun = process.argv[1]?.includes('worker');
if (isDirectRun && typeof require === 'undefined') {
    // ESM direct execution
    startWorker().catch((err) => {
        console.error('Worker failed to start:', err);
        process.exit(1);
    });
}
