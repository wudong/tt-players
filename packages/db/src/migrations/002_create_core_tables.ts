import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    // ── platforms ───────────────────────────────────────────────────────────
    await db.schema
        .createTable('platforms')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('name', 'varchar', (col) => col.notNull())
        .addColumn('base_url', 'varchar', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .execute();

    // ── leagues ─────────────────────────────────────────────────────────────
    await db.schema
        .createTable('leagues')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('platform_id', 'uuid', (col) =>
            col.notNull().references('platforms.id')
        )
        .addColumn('external_id', 'varchar', (col) => col.notNull())
        .addColumn('name', 'varchar', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('deleted_at', 'timestamp')
        .addUniqueConstraint('uq_leagues_platform_external', [
            'platform_id',
            'external_id',
        ])
        .execute();

    // ── seasons ─────────────────────────────────────────────────────────────
    await db.schema
        .createTable('seasons')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('league_id', 'uuid', (col) =>
            col.notNull().references('leagues.id')
        )
        .addColumn('external_id', 'varchar', (col) => col.notNull())
        .addColumn('name', 'varchar', (col) => col.notNull())
        .addColumn('is_active', 'boolean', (col) =>
            col.notNull().defaultTo(false)
        )
        .addColumn('created_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('deleted_at', 'timestamp')
        .addUniqueConstraint('uq_seasons_league_external', [
            'league_id',
            'external_id',
        ])
        .execute();

    // ── competitions ────────────────────────────────────────────────────────
    await db.schema
        .createTable('competitions')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('season_id', 'uuid', (col) =>
            col.notNull().references('seasons.id')
        )
        .addColumn('external_id', 'varchar', (col) => col.notNull())
        .addColumn('name', 'varchar', (col) => col.notNull())
        .addColumn('type', sql`competition_type`, (col) => col.notNull())
        .addColumn('last_scraped_at', 'timestamp')
        .addColumn('created_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('deleted_at', 'timestamp')
        .addUniqueConstraint('uq_competitions_season_external', [
            'season_id',
            'external_id',
        ])
        .execute();

    // ── teams ───────────────────────────────────────────────────────────────
    await db.schema
        .createTable('teams')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('competition_id', 'uuid', (col) =>
            col.notNull().references('competitions.id')
        )
        .addColumn('external_id', 'varchar', (col) => col.notNull())
        .addColumn('name', 'varchar', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('deleted_at', 'timestamp')
        .addUniqueConstraint('uq_teams_competition_external', [
            'competition_id',
            'external_id',
        ])
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('teams').ifExists().execute();
    await db.schema.dropTable('competitions').ifExists().execute();
    await db.schema.dropTable('seasons').ifExists().execute();
    await db.schema.dropTable('leagues').ifExists().execute();
    await db.schema.dropTable('platforms').ifExists().execute();
}
