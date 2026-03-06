import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_external_players_name_trgm_active
        ON external_players USING gin (name gin_trgm_ops)
        WHERE deleted_at IS NULL
    `.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_fixtures_home_team_date_active
        ON fixtures (home_team_id, date_played DESC, id)
        WHERE deleted_at IS NULL
    `.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_fixtures_away_team_date_active
        ON fixtures (away_team_id, date_played DESC, id)
        WHERE deleted_at IS NULL
    `.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_rubbers_home_p1_fixture_singles_active
        ON rubbers (home_player_1_id, fixture_id)
        WHERE deleted_at IS NULL
          AND is_doubles = false
          AND outcome_type <> 'walkover'
          AND home_player_1_id IS NOT NULL
    `.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_rubbers_away_p1_fixture_singles_active
        ON rubbers (away_player_1_id, fixture_id)
        WHERE deleted_at IS NULL
          AND is_doubles = false
          AND outcome_type <> 'walkover'
          AND away_player_1_id IS NOT NULL
    `.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_rubbers_h2h_p1_pair_fixture_active
        ON rubbers (home_player_1_id, away_player_1_id, fixture_id)
        WHERE deleted_at IS NULL
          AND is_doubles = false
          AND home_player_1_id IS NOT NULL
          AND away_player_1_id IS NOT NULL
    `.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_rubbers_home_p2_fixture_doubles_active
        ON rubbers (home_player_2_id, fixture_id)
        WHERE deleted_at IS NULL
          AND is_doubles = true
          AND outcome_type <> 'walkover'
          AND home_player_2_id IS NOT NULL
    `.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_rubbers_away_p2_fixture_doubles_active
        ON rubbers (away_player_2_id, fixture_id)
        WHERE deleted_at IS NULL
          AND is_doubles = true
          AND outcome_type <> 'walkover'
          AND away_player_2_id IS NOT NULL
    `.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_rubbers_fixture_created_active
        ON rubbers (fixture_id, created_at)
        WHERE deleted_at IS NULL
    `.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_league_standings_team_updated_active
        ON league_standings (team_id, updated_at DESC)
        WHERE deleted_at IS NULL
    `.execute(db);

    await sql`
        CREATE INDEX IF NOT EXISTS idx_league_standings_team_created_active
        ON league_standings (team_id, created_at DESC)
        WHERE deleted_at IS NULL
    `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`DROP INDEX IF EXISTS idx_league_standings_team_created_active`.execute(db);
    await sql`DROP INDEX IF EXISTS idx_league_standings_team_updated_active`.execute(db);
    await sql`DROP INDEX IF EXISTS idx_rubbers_fixture_created_active`.execute(db);
    await sql`DROP INDEX IF EXISTS idx_rubbers_away_p2_fixture_doubles_active`.execute(db);
    await sql`DROP INDEX IF EXISTS idx_rubbers_home_p2_fixture_doubles_active`.execute(db);
    await sql`DROP INDEX IF EXISTS idx_rubbers_h2h_p1_pair_fixture_active`.execute(db);
    await sql`DROP INDEX IF EXISTS idx_rubbers_away_p1_fixture_singles_active`.execute(db);
    await sql`DROP INDEX IF EXISTS idx_rubbers_home_p1_fixture_singles_active`.execute(db);
    await sql`DROP INDEX IF EXISTS idx_fixtures_away_team_date_active`.execute(db);
    await sql`DROP INDEX IF EXISTS idx_fixtures_home_team_date_active`.execute(db);
    await sql`DROP INDEX IF EXISTS idx_external_players_name_trgm_active`.execute(db);
}
