import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

// ─── Enum Types ───────────────────────────────────────────────────────────────

export type CompetitionType = 'league' | 'team_cup' | 'individual';

export type FixtureStatus = 'upcoming' | 'completed' | 'postponed';

export type OutcomeType = 'normal' | 'walkover' | 'retired' | 'void';

export type ScrapeStatus = 'pending' | 'processed' | 'failed';

// ─── Table Types ──────────────────────────────────────────────────────────────

export interface PlatformsTable {
    id: Generated<string>;
    name: string;
    base_url: string;
    created_at: Generated<Date>;
}

export type Platform = Selectable<PlatformsTable>;
export type NewPlatform = Insertable<PlatformsTable>;
export type PlatformUpdate = Updateable<PlatformsTable>;

export interface LeaguesTable {
    id: Generated<string>;
    platform_id: string;
    external_id: string;
    name: string;
    created_at: Generated<Date>;
    deleted_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type League = Selectable<LeaguesTable>;
export type NewLeague = Insertable<LeaguesTable>;
export type LeagueUpdate = Updateable<LeaguesTable>;

export interface RegionsTable {
    id: Generated<string>;
    slug: string;
    name: string;
    created_at: Generated<Date>;
}

export type Region = Selectable<RegionsTable>;
export type NewRegion = Insertable<RegionsTable>;
export type RegionUpdate = Updateable<RegionsTable>;

export interface LeagueRegionsTable {
    id: Generated<string>;
    league_id: string;
    region_id: string;
    created_at: Generated<Date>;
}

export type LeagueRegion = Selectable<LeagueRegionsTable>;
export type NewLeagueRegion = Insertable<LeagueRegionsTable>;
export type LeagueRegionUpdate = Updateable<LeagueRegionsTable>;

export interface SeasonsTable {
    id: Generated<string>;
    league_id: string;
    external_id: string;
    name: string;
    is_active: Generated<boolean>;
    created_at: Generated<Date>;
    deleted_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type Season = Selectable<SeasonsTable>;
export type NewSeason = Insertable<SeasonsTable>;
export type SeasonUpdate = Updateable<SeasonsTable>;

export interface CompetitionsTable {
    id: Generated<string>;
    season_id: string;
    external_id: string;
    name: string;
    type: CompetitionType;
    last_scraped_at: ColumnType<Date | null, Date | null, Date | null>;
    created_at: Generated<Date>;
    deleted_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type Competition = Selectable<CompetitionsTable>;
export type NewCompetition = Insertable<CompetitionsTable>;
export type CompetitionUpdate = Updateable<CompetitionsTable>;

export interface TeamsTable {
    id: Generated<string>;
    competition_id: string;
    external_id: string;
    name: string;
    created_at: Generated<Date>;
    deleted_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type Team = Selectable<TeamsTable>;
export type NewTeam = Insertable<TeamsTable>;
export type TeamUpdate = Updateable<TeamsTable>;

export interface ExternalPlayersTable {
    id: Generated<string>;
    platform_id: string;
    external_id: string | null;
    canonical_player_id: string | null;
    name: string;
    created_at: Generated<Date>;
    updated_at: ColumnType<Date, Date | undefined, Date>;
    deleted_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type ExternalPlayer = Selectable<ExternalPlayersTable>;
export type NewExternalPlayer = Insertable<ExternalPlayersTable>;
export type ExternalPlayerUpdate = Updateable<ExternalPlayersTable>;

export interface LeagueStandingsTable {
    id: Generated<string>;
    competition_id: string;
    team_id: string;
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
    created_at: Generated<Date>;
    updated_at: ColumnType<Date, Date | undefined, Date>;
    deleted_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type LeagueStanding = Selectable<LeagueStandingsTable>;
export type NewLeagueStanding = Insertable<LeagueStandingsTable>;
export type LeagueStandingUpdate = Updateable<LeagueStandingsTable>;

export interface FixturesTable {
    id: Generated<string>;
    competition_id: string;
    external_id: string;
    home_team_id: string | null;
    away_team_id: string | null;
    date_played: ColumnType<Date | null, string | Date | null, string | Date | null>;
    status: FixtureStatus;
    round_name: string | null;
    round_order: number | null;
    created_at: Generated<Date>;
    updated_at: ColumnType<Date, Date | undefined, Date>;
    deleted_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type Fixture = Selectable<FixturesTable>;
export type NewFixture = Insertable<FixturesTable>;
export type FixtureUpdate = Updateable<FixturesTable>;

export interface RubbersTable {
    id: Generated<string>;
    fixture_id: string;
    external_id: string;
    is_doubles: Generated<boolean>;
    home_player_1_id: string | null;
    home_player_2_id: string | null;
    away_player_1_id: string | null;
    away_player_2_id: string | null;
    home_games_won: number;
    away_games_won: number;
    home_points_scored: number | null;
    away_points_scored: number | null;
    outcome_type: OutcomeType;
    created_at: Generated<Date>;
    updated_at: ColumnType<Date, Date | undefined, Date>;
    deleted_at: ColumnType<Date | null, Date | null, Date | null>;
}

export type Rubber = Selectable<RubbersTable>;
export type NewRubber = Insertable<RubbersTable>;
export type RubberUpdate = Updateable<RubbersTable>;

export interface RawScrapeLogsTable {
    id: Generated<string>;
    platform_id: string;
    endpoint_url: string;
    raw_payload: string;
    payload_hash: string;
    scraped_at: Generated<Date>;
    status: ScrapeStatus;
}

export type RawScrapeLog = Selectable<RawScrapeLogsTable>;
export type NewRawScrapeLog = Insertable<RawScrapeLogsTable>;
export type RawScrapeLogUpdate = Updateable<RawScrapeLogsTable>;

export interface CacheEntriesTable {
    id: Generated<string>;
    type: string;
    cache_key: string;
    content: unknown;
    source_version: string | null;
    expires_at: ColumnType<Date, Date | string, Date | string>;
    created_at: Generated<Date>;
    updated_at: ColumnType<Date, Date | undefined, Date>;
}

export type CacheEntry = Selectable<CacheEntriesTable>;
export type NewCacheEntry = Insertable<CacheEntriesTable>;
export type CacheEntryUpdate = Updateable<CacheEntriesTable>;

// ─── Database Interface ───────────────────────────────────────────────────────

export interface Database {
    platforms: PlatformsTable;
    leagues: LeaguesTable;
    regions: RegionsTable;
    league_regions: LeagueRegionsTable;
    seasons: SeasonsTable;
    competitions: CompetitionsTable;
    teams: TeamsTable;
    external_players: ExternalPlayersTable;
    league_standings: LeagueStandingsTable;
    fixtures: FixturesTable;
    rubbers: RubbersTable;
    raw_scrape_logs: RawScrapeLogsTable;
    cache_entries: CacheEntriesTable;
}
