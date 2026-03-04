import type { Task } from 'graphile-worker';
import { db } from '@tt-players/db';
import { extractAndStore } from '../extractor.js';

export interface ScrapeUrlPayload {
    url: string;
    platformId: string;
    platformType: 'tt365' | 'ttleagues';
    competitionId: string;
}

/**
 * Graphile Worker task: Phase 1 (Extract).
 *
 * Fetches a URL, hashes the body, upserts into raw_scrape_logs,
 * then chains a processLogTask for the resulting log row.
 */
export const scrapeUrlTask: Task = async (payload, helpers) => {
    const { url, platformId, platformType, competitionId } = payload as ScrapeUrlPayload;

    helpers.logger.info(`scrapeUrlTask: fetching ${url}`);

    // Run the extractor (returns the upserted log ID)
    const logId = await extractAndStore(url, platformId, db);

    helpers.logger.info(`scrapeUrlTask: stored log ${logId}, queuing processLogTask`);

    // Chain: immediately queue a Phase 2 (transform + load) task
    await helpers.addJob('processLogTask', {
        logId,
        competitionId,
        platformId,
        platformType,
    });
};
