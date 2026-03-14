import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { db } from '@tt-players/db';
import { sql } from 'kysely';
import { bootstrap, type ScrapeTarget } from './bootstrap.js';
import { taskList } from './task-list.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '../../..');
const DOCS_DIR = resolve(ROOT_DIR, 'docs');
const RESEARCH_CSV_PATH = resolve(DOCS_DIR, 'uk-league-research-2026-03-10.csv');
const TRACKER_CSV_PATH = resolve(DOCS_DIR, 'uk-ready-league-scrape-tracker-2026-03-10.csv');
const TRACKER_MD_PATH = resolve(DOCS_DIR, 'uk-ready-league-scrape-tracker-2026-03-10.md');
const PROGRESS_MD_PATH = resolve(DOCS_DIR, 'uk-ready-league-scrape-progress-2026-03-10.md');
const PROGRESS_INTERVAL_MS = 10 * 60 * 1000;

type CurrentStatus = 'pending' | 'in_progress' | 'completed' | 'partial' | 'not_required';
type OverallStatus = 'pending' | 'in_progress' | 'completed' | 'partial';
type CampaignTaskIdentifier = 'scrapeUrlTask' | 'scrapeMatchesTask' | 'processLogTask';

interface ReadyLeagueRow {
    country: string;
    region: string;
    leagueName: string;
    activePlatform: string;
    activeUrl: string;
    currentSeasonName: string;
    currentDivisions: number;
    seasonsAvailable: number;
    notes: string;
}

interface LeagueWorkItem extends ReadyLeagueRow {
    currentTargets: ScrapeTarget[];
    historyTargets: ScrapeTarget[];
}

interface QueueStatus {
    total: number;
    runnable: number;
    deferred: number;
    exhausted: number;
    nextRunAt: Date | null;
}

interface TrackerRow {
    country: string;
    region: string;
    league_name: string;
    platform: string;
    active_url: string;
    current_season_name: string;
    current_divisions: number;
    seasons_available: number;
    current_targets_total: number;
    current_targets_scraped: number;
    current_status: CurrentStatus;
    history_targets_total: number;
    history_targets_scraped: number;
    history_status: CurrentStatus;
    overall_status: OverallStatus;
    started_at: string;
    finished_at: string;
    notes: string;
}

interface LeagueRunState {
    status: OverallStatus;
    startedAt: Date | null;
    finishedAt: Date | null;
}

interface CampaignJob {
    identifier: CampaignTaskIdentifier;
    payload: Record<string, unknown>;
    description: string;
}

interface CampaignExecutionResult {
    processedJobs: number;
    failedJobs: number;
    failureSamples: string[];
}

function nowIso(): string {
    return new Date().toISOString();
}

function csvEscape(value: string | number): string {
    const text = String(value);
    if (!/[",\n]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
}

function toIsoOrEmpty(value: Date | null): string {
    return value ? value.toISOString() : '';
}

function escapeMarkdownCell(value: string | number): string {
    return String(value)
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, '<br>');
}

function normalizeLeagueLookupKey(value: string): string {
    return value
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/\btable tennis\b/g, ' ')
        .replace(/\bttl\b/g, ' ')
        .replace(/\bleague\b/g, ' ')
        .replace(/\bdistrict\b/g, ' ')
        .replace(/\bassociation\b/g, ' ')
        .replace(/\band\b/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function parseCsvLine(line: string): string[] {
    return line
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map((value) => value.replace(/^"|"$/g, '').replace(/""/g, '"'));
}

async function appendProgress(message: string): Promise<void> {
    await appendFile(PROGRESS_MD_PATH, `${message}\n`, 'utf8');
}

async function initializeProgressLog(totalLeagues: number): Promise<void> {
    const header = [
        '# UK Ready League Scrape Progress',
        '',
        `Started: ${nowIso()}`,
        '',
        `- Total ready leagues scheduled: ${totalLeagues}`,
        '- Mode: isolated sequential scrape by league using an internal campaign queue',
        '- Progress checkpoint cadence: every 10 minutes',
        '',
        '## Log',
        '',
    ].join('\n');

    await writeFile(PROGRESS_MD_PATH, `${header}\n`, 'utf8');
}

async function loadReadyLeagues(): Promise<ReadyLeagueRow[]> {
    const file = await readFile(RESEARCH_CSV_PATH, 'utf8');
    const rows = file
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map(parseCsvLine)
        .filter((cols) => cols[8] === 'ready')
        .map((cols) => ({
            country: cols[0]!,
            region: cols[1]!,
            leagueName: cols[2]!,
            activePlatform: cols[6]!,
            activeUrl: cols[7]!,
            currentSeasonName: cols[9]!,
            currentDivisions: Number(cols[10] ?? '0'),
            seasonsAvailable: Number(cols[11] ?? '0'),
            notes: cols[12]!,
        }));

    rows.sort((a, b) =>
        a.country.localeCompare(b.country)
        || a.region.localeCompare(b.region)
        || a.leagueName.localeCompare(b.leagueName),
    );

    return rows;
}

function buildLeagueWorkItems(
    readyRows: ReadyLeagueRow[],
    targets: ScrapeTarget[],
): LeagueWorkItem[] {
    const targetsByLeague = new Map<string, ScrapeTarget[]>();
    const targetsByNormalizedLeague = new Map<string, ScrapeTarget[]>();
    for (const target of targets) {
        const existing = targetsByLeague.get(target.leagueName) ?? [];
        existing.push(target);
        targetsByLeague.set(target.leagueName, existing);

        const normalizedKey = normalizeLeagueLookupKey(target.leagueName);
        const normalizedExisting = targetsByNormalizedLeague.get(normalizedKey) ?? [];
        normalizedExisting.push(target);
        targetsByNormalizedLeague.set(normalizedKey, normalizedExisting);
    }

    return readyRows.map((row) => {
        const leagueTargets = targetsByLeague.get(row.leagueName)
            ?? targetsByNormalizedLeague.get(normalizeLeagueLookupKey(row.leagueName))
            ?? [];
        return {
            ...row,
            currentTargets: leagueTargets.filter((target) => !target.isHistorical),
            historyTargets: leagueTargets.filter((target) => target.isHistorical),
        };
    });
}

async function getQueueStatus(): Promise<QueueStatus> {
    const result = await sql<{
        total: string;
        runnable: string;
        deferred: string;
        exhausted: string;
        next_run_at: Date | null;
    }>`
        select
            count(*)::text as total,
            count(*) filter (where attempts < max_attempts and run_at <= now())::text as runnable,
            count(*) filter (where attempts < max_attempts and run_at > now())::text as deferred,
            count(*) filter (where attempts >= max_attempts)::text as exhausted,
            min(run_at) filter (where attempts < max_attempts and run_at > now()) as next_run_at
        from graphile_worker.jobs
    `.execute(db);

    const row = result.rows[0];
    return {
        total: Number(row?.total ?? 0),
        runnable: Number(row?.runnable ?? 0),
        deferred: Number(row?.deferred ?? 0),
        exhausted: Number(row?.exhausted ?? 0),
        nextRunAt: row?.next_run_at ?? null,
    };
}

function buildInitialCampaignJobs(item: LeagueWorkItem): CampaignJob[] {
    const jobs: CampaignJob[] = [];

    for (const target of [...item.currentTargets, ...item.historyTargets]) {
        jobs.push({
            identifier: 'scrapeUrlTask',
            payload: {
                url: target.url,
                platformId: target.platformId,
                platformType: target.platformType,
                competitionId: target.competitionId,
                tt365DataType: target.platformType === 'tt365' ? 'standings' : undefined,
            },
            description: `${item.leagueName}: standings ${target.divisionName}`,
        });

        if (target.platformType === 'tt365' && target.fixturesUrl) {
            jobs.push({
                identifier: 'scrapeUrlTask',
                payload: {
                    url: target.fixturesUrl,
                    platformId: target.platformId,
                    platformType: target.platformType,
                    competitionId: target.competitionId,
                    tt365DataType: 'fixtures',
                },
                description: `${item.leagueName}: fixtures ${target.divisionName}`,
            });
        }

        if (target.platformType === 'ttleagues' && target.divisionExtId) {
            jobs.push({
                identifier: 'scrapeMatchesTask',
                payload: {
                    divisionId: target.divisionExtId,
                    platformId: target.platformId,
                    platformType: target.platformType,
                    competitionId: target.competitionId,
                },
                description: `${item.leagueName}: matches ${target.divisionName}`,
            });
        }
    }

    return jobs;
}

function makeCampaignLogger(): {
    info: (_message: string) => void;
    warn: (_message: string) => void;
    error: (_message: string) => void;
    debug: (_message: string) => void;
} {
    return {
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        debug: () => undefined,
    };
}

async function executeCampaignJobs(
    initialJobs: CampaignJob[],
    successfulCompetitionIds: Set<string>,
): Promise<CampaignExecutionResult> {
    const pendingJobs = [...initialJobs];
    const logger = makeCampaignLogger();
    let processedJobs = 0;
    let failedJobs = 0;
    const failureSamples: string[] = [];

    while (pendingJobs.length > 0) {
        const job = pendingJobs.shift()!;
        const task = taskList[job.identifier];
        if (!task) {
            throw new Error(`Campaign task not found: ${job.identifier}`);
        }

        const addJob = async (
            identifier: CampaignTaskIdentifier,
            payload: Record<string, unknown>,
        ): Promise<Record<string, unknown>> => {
            pendingJobs.unshift({
                identifier,
                payload,
                description: `${identifier}: ${JSON.stringify(payload)}`,
            });
            return { task_identifier: identifier, payload };
        };

        const helpers = {
            logger,
            addJob,
            withPgClient: async () => {
                throw new Error('withPgClient is not supported in campaign mode');
            },
            query: async () => {
                throw new Error('query is not supported in campaign mode');
            },
            getQueueName: async () => null,
            job: {
                id: `campaign-${processedJobs + failedJobs + 1}`,
                job_queue_id: null,
                task_id: 0,
                payload: job.payload,
                priority: 0,
                run_at: new Date(),
                attempts: 0,
                max_attempts: 1,
                last_error: null,
                created_at: new Date(),
                updated_at: new Date(),
                key: null,
                revision: 0,
                locked_at: null,
                locked_by: 'uk-campaign',
                flags: null,
                is_available: true,
                task_identifier: job.identifier,
            },
            abortSignal: undefined,
        };

        try {
            const result = await task(job.payload, helpers as never);
            if (Array.isArray(result)) {
                await Promise.all(result);
            }

            if (job.identifier === 'processLogTask') {
                const competitionId = job.payload['competitionId'];
                if (typeof competitionId === 'string' && competitionId.length > 0) {
                    successfulCompetitionIds.add(competitionId);
                }
            }

            processedJobs += 1;
        } catch (error) {
            failedJobs += 1;
            if (failureSamples.length < 5) {
                failureSamples.push(
                    `${job.description}: ${(error as Error).message ?? String(error)}`,
                );
            }
        }
    }

    return {
        processedJobs,
        failedJobs,
        failureSamples,
    };
}

function deriveStatus(scraped: number, total: number): CurrentStatus {
    if (total === 0) return 'not_required';
    if (scraped === 0) return 'pending';
    if (scraped === total) return 'completed';
    return 'partial';
}

function createRunStateMap(items: LeagueWorkItem[]): Map<string, LeagueRunState> {
    return new Map(
        items.map((item) => [
            item.leagueName,
            {
                status: 'pending' as const,
                startedAt: null,
                finishedAt: null,
            },
        ]),
    );
}

function buildTrackerRow(
    item: LeagueWorkItem,
    successfulCompetitionIds: Set<string>,
    state: LeagueRunState | undefined,
): TrackerRow {
    const currentScraped = item.currentTargets
        .filter((target) => successfulCompetitionIds.has(target.competitionId))
        .length;
    const historyScraped = item.historyTargets
        .filter((target) => successfulCompetitionIds.has(target.competitionId))
        .length;

    const currentStatus = deriveStatus(currentScraped, item.currentTargets.length);
    const historyStatus = deriveStatus(historyScraped, item.historyTargets.length);

    let overallStatus: TrackerRow['overall_status'] = state?.status ?? 'pending';
    if (overallStatus !== 'in_progress') {
        if (
            currentStatus === 'completed'
            && (historyStatus === 'completed' || historyStatus === 'not_required')
        ) {
            overallStatus = 'completed';
        } else if (state?.finishedAt || currentScraped > 0 || historyScraped > 0) {
            overallStatus = 'partial';
        } else {
            overallStatus = 'pending';
        }
    }

    return {
        country: item.country,
        region: item.region,
        league_name: item.leagueName,
        platform: item.activePlatform,
        active_url: item.activeUrl,
        current_season_name: item.currentSeasonName,
        current_divisions: item.currentDivisions,
        seasons_available: item.seasonsAvailable,
        current_targets_total: item.currentTargets.length,
        current_targets_scraped: currentScraped,
        current_status: currentStatus,
        history_targets_total: item.historyTargets.length,
        history_targets_scraped: historyScraped,
        history_status: historyStatus,
        overall_status: overallStatus,
        started_at: toIsoOrEmpty(state?.startedAt ?? null),
        finished_at: toIsoOrEmpty(state?.finishedAt ?? null),
        notes: item.notes,
    };
}

async function buildTrackerRows(
    items: LeagueWorkItem[],
    runStates: Map<string, LeagueRunState>,
    successfulCompetitionIds: Set<string>,
): Promise<TrackerRow[]> {
    return items.map((item) => {
        const state = runStates.get(item.leagueName);
        return buildTrackerRow(item, successfulCompetitionIds, state);
    });
}

async function writeTrackerFiles(
    items: LeagueWorkItem[],
    runStates: Map<string, LeagueRunState>,
    successfulCompetitionIds: Set<string>,
): Promise<TrackerRow[]> {
    const rows = await buildTrackerRows(items, runStates, successfulCompetitionIds);
    const orderedRows = [...rows].sort((a, b) =>
        a.country.localeCompare(b.country)
        || a.region.localeCompare(b.region)
        || a.league_name.localeCompare(b.league_name),
    );

    const csvHeader = [
        'country',
        'region',
        'league_name',
        'platform',
        'active_url',
        'current_season_name',
        'current_divisions',
        'seasons_available',
        'current_targets_total',
        'current_targets_scraped',
        'current_status',
        'history_targets_total',
        'history_targets_scraped',
        'history_status',
        'overall_status',
        'started_at',
        'finished_at',
        'notes',
    ];

    const csvLines = [
        csvHeader.join(','),
        ...orderedRows.map((row) => [
            row.country,
            row.region,
            row.league_name,
            row.platform,
            row.active_url,
            row.current_season_name,
            row.current_divisions,
            row.seasons_available,
            row.current_targets_total,
            row.current_targets_scraped,
            row.current_status,
            row.history_targets_total,
            row.history_targets_scraped,
            row.history_status,
            row.overall_status,
            row.started_at,
            row.finished_at,
            row.notes,
        ].map(csvEscape).join(',')),
    ];

    await writeFile(TRACKER_CSV_PATH, `${csvLines.join('\n')}\n`, 'utf8');

    const grouped = new Map<string, TrackerRow[]>();
    for (const row of orderedRows) {
        const existing = grouped.get(row.country) ?? [];
        existing.push(row);
        grouped.set(row.country, existing);
    }

    const completed = orderedRows.filter((row) => row.overall_status === 'completed').length;
    const inProgress = orderedRows.filter((row) => row.overall_status === 'in_progress').length;
    const partial = orderedRows.filter((row) => row.overall_status === 'partial').length;
    const pending = orderedRows.filter((row) => row.overall_status === 'pending').length;

    const markdown = [
        '# UK Ready League Scrape Tracker',
        '',
        `Last updated: ${nowIso()}`,
        '',
        '## Summary',
        '',
        `- Total ready leagues: ${orderedRows.length}`,
        `- Completed: ${completed}`,
        `- In progress: ${inProgress}`,
        `- Partial: ${partial}`,
        `- Pending: ${pending}`,
        '',
    ];

    for (const [country, countryRows] of [...grouped.entries()].sort()) {
        markdown.push(`## ${country}`);
        markdown.push('');
        markdown.push('| Region | League | Current | History | Overall | Started | Finished | Platform | Active URL |');
        markdown.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
        for (const row of countryRows) {
            markdown.push(
                `| ${escapeMarkdownCell(row.region)} | ${escapeMarkdownCell(row.league_name)} | ${row.current_targets_scraped}/${row.current_targets_total} (${row.current_status}) | ${row.history_targets_scraped}/${row.history_targets_total} (${row.history_status}) | ${row.overall_status} | ${escapeMarkdownCell(row.started_at)} | ${escapeMarkdownCell(row.finished_at)} | ${escapeMarkdownCell(row.platform)} | ${escapeMarkdownCell(row.active_url)} |`,
            );
        }
        markdown.push('');
    }

    await writeFile(TRACKER_MD_PATH, `${markdown.join('\n')}\n`, 'utf8');
    return orderedRows;
}

async function logCheckpoint(
    items: LeagueWorkItem[],
    runStates: Map<string, LeagueRunState>,
    successfulCompetitionIds: Set<string>,
    reason: string,
): Promise<void> {
    const rows = await writeTrackerFiles(items, runStates, successfulCompetitionIds);
    const completed = rows.filter((row) => row.overall_status === 'completed').length;
    const partial = rows.filter((row) => row.overall_status === 'partial').length;
    const inProgress = rows.filter((row) => row.overall_status === 'in_progress').length;
    const pending = rows.filter((row) => row.overall_status === 'pending').length;
    await appendProgress(
        `- ${nowIso()} checkpoint (${reason}): completed=${completed}, partial=${partial}, in_progress=${inProgress}, pending=${pending}`,
    );
}

async function main(): Promise<void> {
    await mkdir(DOCS_DIR, { recursive: true });

    const allReadyRows = await loadReadyLeagues();
    const limitLeagues = Number(process.env['SCRAPE_UK_LIMIT_LEAGUES'] ?? '0');
    const readyRows = limitLeagues > 0
        ? allReadyRows.slice(0, limitLeagues)
        : allReadyRows;
    await initializeProgressLog(readyRows.length);

    const sharedQueueStatus = await getQueueStatus();
    await appendProgress(
        `- ${nowIso()} shared queue snapshot (ignored by isolated campaign runner): total=${sharedQueueStatus.total}, runnable=${sharedQueueStatus.runnable}, deferred=${sharedQueueStatus.deferred}, exhausted=${sharedQueueStatus.exhausted}`,
    );

    await appendProgress(`- ${nowIso()} bootstrapping ready leagues with history discovery`);
    const bootstrappedTargets = await bootstrap(db, {
        includeHistory: true,
        leagueNames: readyRows.map((row) => row.leagueName),
    });
    const items = buildLeagueWorkItems(readyRows, bootstrappedTargets);
    const missingItems = items.filter((item) =>
        item.currentTargets.length === 0 && item.historyTargets.length === 0,
    );
    const runStates = createRunStateMap(items);
    const successfulCompetitionIds = new Set<string>();

    await appendProgress(
        `- ${nowIso()} bootstrapped ${items.length} ready leagues with scrape targets; missing_targets=${missingItems.length}; writing initial tracker snapshot`,
    );
    if (missingItems.length > 0) {
        await appendProgress(
            `- ${nowIso()} ready leagues without targets: ${missingItems.map((item) => item.leagueName).join('; ')}`,
        );
    }
    if (limitLeagues > 0) {
        await appendProgress(
            `- ${nowIso()} SCRAPE_UK_LIMIT_LEAGUES active: processing first ${items.length} leagues only`,
        );
    }
    await writeTrackerFiles(items, runStates, successfulCompetitionIds);

    const interval = setInterval(() => {
        void logCheckpoint(items, runStates, successfulCompetitionIds, '10 minute timer');
    }, PROGRESS_INTERVAL_MS);

    try {
        for (let index = 0; index < items.length; index += 1) {
            const item = items[index]!;
            const state = runStates.get(item.leagueName);
            if (!state) {
                throw new Error(`Run state missing for ${item.leagueName}`);
            }
            state.status = 'in_progress';
            state.startedAt = new Date();
            state.finishedAt = null;
            await writeTrackerFiles(items, runStates, successfulCompetitionIds);
            await appendProgress(
                `- ${nowIso()} starting ${index + 1}/${items.length}: ${item.leagueName} (${item.country} / ${item.region}), current_targets=${item.currentTargets.length}, history_targets=${item.historyTargets.length}`,
            );

            const initialJobs = buildInitialCampaignJobs(item);
            const executionResult = await executeCampaignJobs(initialJobs, successfulCompetitionIds);
            const interimRows = await buildTrackerRows(items, runStates, successfulCompetitionIds);
            const interimRow = interimRows.find((trackerRow) => trackerRow.league_name === item.leagueName);

            state.status = (
                interimRow?.current_status === 'completed'
                && (
                    interimRow.history_status === 'completed'
                    || interimRow.history_status === 'not_required'
                )
            )
                ? 'completed'
                : (
                    (interimRow?.current_targets_scraped ?? 0) > 0
                    || (interimRow?.history_targets_scraped ?? 0) > 0
                    || executionResult.failedJobs > 0
                )
                    ? 'partial'
                    : 'pending';
            state.finishedAt = new Date();

            const rows = await writeTrackerFiles(items, runStates, successfulCompetitionIds);
            const row = rows.find((trackerRow) => trackerRow.league_name === item.leagueName);

            await appendProgress(
                `- ${nowIso()} completed ${index + 1}/${items.length}: ${item.leagueName}, current=${row?.current_targets_scraped ?? 0}/${row?.current_targets_total ?? 0}, history=${row?.history_targets_scraped ?? 0}/${row?.history_targets_total ?? 0}, overall=${row?.overall_status ?? 'unknown'}, jobs_processed=${executionResult.processedJobs}, jobs_failed=${executionResult.failedJobs}`,
            );
            if (executionResult.failureSamples.length > 0) {
                await appendProgress(
                    `- ${nowIso()} failure samples for ${item.leagueName}: ${executionResult.failureSamples.join(' | ')}`,
                );
            }
        }

        await logCheckpoint(items, runStates, successfulCompetitionIds, 'run complete');
        await appendProgress(`- ${nowIso()} scrape run finished successfully`);
    } finally {
        clearInterval(interval);
        await db.destroy();
    }
}

main().catch(async (error) => {
    await appendProgress(`- ${nowIso()} scrape run failed: ${(error as Error).stack ?? String(error)}`);
    await db.destroy();
    process.exit(1);
});
