import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    // ── external_players ────────────────────────────────────────────────────
    await db.schema
        .createTable('external_players')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('platform_id', 'uuid', (col) =>
            col.notNull().references('platforms.id')
        )
        .addColumn('external_id', 'varchar') // nullable for unregistered reserves
        .addColumn('name', 'varchar', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('updated_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('deleted_at', 'timestamp')
        .execute();

    // Partial unique index: only constrain rows where external_id IS NOT NULL
    await sql`
    CREATE UNIQUE INDEX uq_external_players_platform_external
    ON external_players (platform_id, external_id)
    WHERE external_id IS NOT NULL
  `.execute(db);

    // ── fixtures ────────────────────────────────────────────────────────────
    await db.schema
        .createTable('fixtures')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('competition_id', 'uuid', (col) =>
            col.notNull().references('competitions.id')
        )
        .addColumn('external_id', 'varchar', (col) => col.notNull())
        .addColumn('home_team_id', 'uuid', (col) => col.references('teams.id'))
        .addColumn('away_team_id', 'uuid', (col) => col.references('teams.id'))
        .addColumn('date_played', 'date')
        .addColumn('status', sql`fixture_status`, (col) => col.notNull())
        .addColumn('round_name', 'varchar')
        .addColumn('round_order', 'integer')
        .addColumn('created_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('updated_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('deleted_at', 'timestamp')
        .addUniqueConstraint('uq_fixtures_competition_external', [
            'competition_id',
            'external_id',
        ])
        .execute();

    // ── rubbers ─────────────────────────────────────────────────────────────
    await db.schema
        .createTable('rubbers')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('fixture_id', 'uuid', (col) =>
            col.notNull().references('fixtures.id')
        )
        .addColumn('external_id', 'varchar', (col) => col.notNull())
        .addColumn('is_doubles', 'boolean', (col) =>
            col.notNull().defaultTo(false)
        )
        .addColumn('home_player_1_id', 'uuid', (col) =>
            col.notNull().references('external_players.id')
        )
        .addColumn('home_player_2_id', 'uuid', (col) =>
            col.references('external_players.id')
        )
        .addColumn('away_player_1_id', 'uuid', (col) =>
            col.notNull().references('external_players.id')
        )
        .addColumn('away_player_2_id', 'uuid', (col) =>
            col.references('external_players.id')
        )
        .addColumn('home_games_won', 'integer', (col) => col.notNull())
        .addColumn('away_games_won', 'integer', (col) => col.notNull())
        .addColumn('home_points_scored', 'integer')
        .addColumn('away_points_scored', 'integer')
        .addColumn('outcome_type', sql`outcome_type`, (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('updated_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('deleted_at', 'timestamp')
        .addUniqueConstraint('uq_rubbers_fixture_external', [
            'fixture_id',
            'external_id',
        ])
        .execute();

    // ── league_standings ────────────────────────────────────────────────────
    await db.schema
        .createTable('league_standings')
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('competition_id', 'uuid', (col) =>
            col.notNull().references('competitions.id')
        )
        .addColumn('team_id', 'uuid', (col) =>
            col.notNull().references('teams.id')
        )
        .addColumn('position', 'integer', (col) => col.notNull())
        .addColumn('played', 'integer', (col) => col.notNull())
        .addColumn('won', 'integer', (col) => col.notNull())
        .addColumn('drawn', 'integer', (col) => col.notNull())
        .addColumn('lost', 'integer', (col) => col.notNull())
        .addColumn('points', 'integer', (col) => col.notNull())
        .addColumn('created_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('updated_at', 'timestamp', (col) =>
            col.notNull().defaultTo(sql`now()`)
        )
        .addColumn('deleted_at', 'timestamp')
        .addUniqueConstraint('uq_league_standings_competition_team', [
            'competition_id',
            'team_id',
        ])
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('league_standings').ifExists().execute();
    await db.schema.dropTable('rubbers').ifExists().execute();
    await db.schema.dropTable('fixtures').ifExists().execute();
    // Drop index before table
    await sql`DROP INDEX IF EXISTS uq_external_players_platform_external`.execute(db);
    await db.schema.dropTable('external_players').ifExists().execute();
}
