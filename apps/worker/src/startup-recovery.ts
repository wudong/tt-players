import type { Database } from '@tt-players/db';
import type { Kysely } from 'kysely';
import { sql } from 'kysely';

interface QueueStatus {
    total: number;
    runnable: number;
    deferred: number;
    exhausted: number;
}

interface StaleLockSnapshot {
    staleLockedJobs: number;
    workerIds: string[];
}

export interface StartupRecoveryOptions {
    staleLockMinutes?: number;
    transientRetryBatchLimit?: number;
    enabled?: boolean;
}

export interface StartupRecoverySummary {
    enabled: boolean;
    staleLockMinutes: number;
    transientRetryBatchLimit: number;
    queueBefore: QueueStatus;
    queueAfter: QueueStatus;
    staleWorkersUnlocked: number;
    staleJobsUnlocked: number;
    transientJobsRequeued: number;
}

const DEFAULT_STALE_LOCK_MINUTES = 20;
const DEFAULT_TRANSIENT_RETRY_BATCH_LIMIT = 300;
const TRANSIENT_HTTP_ERROR_PATTERN = 'HTTP (429|500|502|503|504)';

function toPositiveIntOrDefault(raw: string | undefined, fallback: number): number {
    if (!raw) return fallback;
    const value = Number(raw);
    return Number.isInteger(value) && value > 0 ? value : fallback;
}

function resolveOptions(options: StartupRecoveryOptions): {
    enabled: boolean;
    staleLockMinutes: number;
    transientRetryBatchLimit: number;
} {
    const envEnabled = process.env['SCRAPE_STARTUP_RECOVERY_ENABLED'] !== '0';
    const staleLockMinutes = options.staleLockMinutes
        ?? toPositiveIntOrDefault(
            process.env['SCRAPE_STALE_LOCK_MINUTES'],
            DEFAULT_STALE_LOCK_MINUTES,
        );
    const transientRetryBatchLimit = options.transientRetryBatchLimit
        ?? toPositiveIntOrDefault(
            process.env['SCRAPE_TRANSIENT_RETRY_BATCH_LIMIT'],
            DEFAULT_TRANSIENT_RETRY_BATCH_LIMIT,
        );

    return {
        enabled: options.enabled ?? envEnabled,
        staleLockMinutes,
        transientRetryBatchLimit,
    };
}

async function getQueueStatus(db: Kysely<Database>): Promise<QueueStatus> {
    const result = await sql<{
        total: string;
        runnable: string;
        deferred: string;
        exhausted: string;
    }>`
        select
            count(*)::text as total,
            count(*) filter (where attempts < max_attempts and run_at <= now())::text as runnable,
            count(*) filter (where attempts < max_attempts and run_at > now())::text as deferred,
            count(*) filter (where attempts >= max_attempts)::text as exhausted
        from graphile_worker.jobs
    `.execute(db);

    const row = result.rows[0];
    return {
        total: Number(row?.total ?? 0),
        runnable: Number(row?.runnable ?? 0),
        deferred: Number(row?.deferred ?? 0),
        exhausted: Number(row?.exhausted ?? 0),
    };
}

async function getStaleLockSnapshot(
    db: Kysely<Database>,
    staleLockMinutes: number,
): Promise<StaleLockSnapshot> {
    const result = await sql<{
        stale_locked_jobs: string;
        worker_ids: string[] | null;
    }>`
        select
            count(*)::text as stale_locked_jobs,
            array_remove(array_agg(distinct locked_by), null) as worker_ids
        from graphile_worker.jobs
        where locked_by is not null
          and locked_at is not null
          and locked_at < now() - make_interval(mins => ${staleLockMinutes})
    `.execute(db);

    const row = result.rows[0];
    return {
        staleLockedJobs: Number(row?.stale_locked_jobs ?? 0),
        workerIds: row?.worker_ids ?? [],
    };
}

async function unlockStaleWorkers(
    db: Kysely<Database>,
    workerIds: string[],
): Promise<void> {
    if (workerIds.length === 0) return;

    const workerIdsSql = sql.join(workerIds.map((workerId) => sql`${workerId}`));
    await sql`
        select graphile_worker.force_unlock_workers(array[${workerIdsSql}]::text[])
    `.execute(db);
}

async function requeueTransientTt365ScrapeFailures(
    db: Kysely<Database>,
    batchLimit: number,
): Promise<number> {
    const result = await sql<{ id: string }>`
        with candidates as (
            select j.id
            from graphile_worker._private_jobs as j
            inner join graphile_worker._private_tasks as t
                on t.id = j.task_id
            where t.identifier = 'scrapeUrlTask'
              and j.attempts >= j.max_attempts
              and coalesce(j.payload->>'platformType', '') = 'tt365'
              and j.last_error ~* ${TRANSIENT_HTTP_ERROR_PATTERN}
            order by j.updated_at asc
            limit ${batchLimit}
        )
        update graphile_worker._private_jobs as j
        set attempts = 0,
            last_error = null,
            run_at = now(),
            locked_at = null,
            locked_by = null,
            updated_at = now()
        from candidates
        where j.id = candidates.id
        returning j.id
    `.execute(db);

    return result.rows.length;
}

export async function runStartupRecovery(
    db: Kysely<Database>,
    log: (message: string) => void,
    options: StartupRecoveryOptions = {},
): Promise<StartupRecoverySummary> {
    const resolved = resolveOptions(options);
    const queueBefore = await getQueueStatus(db);

    if (!resolved.enabled) {
        const disabledSummary: StartupRecoverySummary = {
            enabled: false,
            staleLockMinutes: resolved.staleLockMinutes,
            transientRetryBatchLimit: resolved.transientRetryBatchLimit,
            queueBefore,
            queueAfter: queueBefore,
            staleWorkersUnlocked: 0,
            staleJobsUnlocked: 0,
            transientJobsRequeued: 0,
        };
        log('[startup-recovery] disabled via SCRAPE_STARTUP_RECOVERY_ENABLED=0');
        return disabledSummary;
    }

    const staleSnapshot = await getStaleLockSnapshot(db, resolved.staleLockMinutes);
    await unlockStaleWorkers(db, staleSnapshot.workerIds);

    const transientJobsRequeued = await requeueTransientTt365ScrapeFailures(
        db,
        resolved.transientRetryBatchLimit,
    );

    const queueAfter = await getQueueStatus(db);

    log(
        `[startup-recovery] stale unlock: workers=${staleSnapshot.workerIds.length}, jobs=${staleSnapshot.staleLockedJobs}, threshold=${resolved.staleLockMinutes}m`,
    );
    log(
        `[startup-recovery] transient retry reset: requeued=${transientJobsRequeued}, batch_limit=${resolved.transientRetryBatchLimit}`,
    );
    log(
        `[startup-recovery] queue: before(total=${queueBefore.total}, runnable=${queueBefore.runnable}, deferred=${queueBefore.deferred}, exhausted=${queueBefore.exhausted}) -> after(total=${queueAfter.total}, runnable=${queueAfter.runnable}, deferred=${queueAfter.deferred}, exhausted=${queueAfter.exhausted})`,
    );

    return {
        enabled: true,
        staleLockMinutes: resolved.staleLockMinutes,
        transientRetryBatchLimit: resolved.transientRetryBatchLimit,
        queueBefore,
        queueAfter,
        staleWorkersUnlocked: staleSnapshot.workerIds.length,
        staleJobsUnlocked: staleSnapshot.staleLockedJobs,
        transientJobsRequeued,
    };
}
