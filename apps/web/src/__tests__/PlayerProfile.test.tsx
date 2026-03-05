import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ExtendedPlayerStats, PlayerCurrentSeasonAffiliationsResponse, RubbersResponse } from '../types';
import { winPercentage } from '../types';

vi.mock('../hooks/usePlayerExtendedStats');
vi.mock('../hooks/usePlayerRubbers');
vi.mock('../hooks/usePlayerCurrentSeasonAffiliations');

import * as usePlayerExtendedStatsModule from '../hooks/usePlayerExtendedStats';
import * as usePlayerRubbersModule from '../hooks/usePlayerRubbers';
import * as usePlayerCurrentSeasonAffiliationsModule from '../hooks/usePlayerCurrentSeasonAffiliations';
import { PlayerProfile } from '../views/PlayerProfile';

const MOCK_STATS: ExtendedPlayerStats = {
    player_id: 'player-uuid-1',
    player_name: 'Alice Smith',
    wins: 18,
    losses: 6,
    total: 24,
    nemesis_id: 'opp-1',
    nemesis: 'Bob Jones (0W-2L)',
    duo: 'Jane Roe (80% WR)',
    streak: 'W5',
    most_played_opponents: [{
        opponent_id: 'opp-1',
        opponent_name: 'Bob Jones',
        played: 6,
        wins: 2,
        losses: 4,
        win_rate: 33,
    }],
};

const MOCK_RUBBERS: RubbersResponse = {
    total: 1,
    limit: 20,
    offset: 0,
    data: [{
        id: 'rubber-1',
        fixture_id: 'fix-1',
        date: '2025-01-12',
        league: 'Chelmsford League',
        opponent: 'Bob Jones',
        opponent_id: 'opp-1',
        result: 'Won 3-1',
        isWin: true,
    }],
};

const MOCK_AFFILIATIONS: PlayerCurrentSeasonAffiliationsResponse = {
    data: [{
        team_id: 'team-1',
        team_name: 'Basildon A',
        league_id: 'league-1',
        league_name: 'Basildon TTL',
        season_id: 'season-1',
        season_name: 'Winter 2025-26',
        competition_name: 'Division 1',
    }],
};

const PLAYER_ID = 'player-uuid-1';

function mockHooks(options?: {
    stats?: Partial<ReturnType<typeof usePlayerExtendedStatsModule.usePlayerExtendedStats>>;
    rubbers?: Partial<ReturnType<typeof usePlayerRubbersModule.usePlayerRubbers>>;
    affiliations?: Partial<ReturnType<typeof usePlayerCurrentSeasonAffiliationsModule.usePlayerCurrentSeasonAffiliations>>;
}) {
    vi.spyOn(usePlayerExtendedStatsModule, 'usePlayerExtendedStats').mockReturnValue({
        data: MOCK_STATS,
        isLoading: false,
        isError: false,
        error: null,
        ...options?.stats,
    } as ReturnType<typeof usePlayerExtendedStatsModule.usePlayerExtendedStats>);

    vi.spyOn(usePlayerRubbersModule, 'usePlayerRubbers').mockReturnValue({
        data: MOCK_RUBBERS,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        ...options?.rubbers,
    } as ReturnType<typeof usePlayerRubbersModule.usePlayerRubbers>);

    vi.spyOn(usePlayerCurrentSeasonAffiliationsModule, 'usePlayerCurrentSeasonAffiliations').mockReturnValue({
        data: MOCK_AFFILIATIONS,
        isLoading: false,
        isError: false,
        error: null,
        ...options?.affiliations,
    } as ReturnType<typeof usePlayerCurrentSeasonAffiliationsModule.usePlayerCurrentSeasonAffiliations>);
}

describe('PlayerProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when data loads successfully', () => {
        it('renders the player name', () => {
            mockHooks();
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        it('renders the correct win percentage', () => {
            mockHooks();
            render(<PlayerProfile playerId={PLAYER_ID} />);

            const expectedPct = winPercentage(MOCK_STATS);
            expect(expectedPct).toBe(75);
            expect(screen.getByText(/75%/)).toBeInTheDocument();
        });

        it('renders the wins count', () => {
            mockHooks();
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByTestId('stat-wins')).toHaveTextContent('18');
        });

        it('renders the losses count', () => {
            mockHooks();
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByTestId('stat-losses')).toHaveTextContent('6');
        });

        it('renders the total rubbers played', () => {
            mockHooks();
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByTestId('stat-total')).toHaveTextContent('24');
        });

        it('handles a player with zero rubbers gracefully (no division by zero)', () => {
            const zeroed: ExtendedPlayerStats = {
                ...MOCK_STATS,
                player_id: 'player-new',
                player_name: 'New Player',
                wins: 0,
                losses: 0,
                total: 0,
            };
            mockHooks({
                stats: { data: zeroed },
            });
            render(<PlayerProfile playerId="player-new" />);

            expect(
                screen.getAllByText(/0%/).some((node) => node.textContent?.trim() === '0%'),
            ).toBe(true);
        });
    });

    describe('when the query is loading', () => {
        it('renders a loading indicator', () => {
            mockHooks({
                stats: { data: undefined, isLoading: true },
            });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('does NOT render the player name whilst loading', () => {
            mockHooks({
                stats: { data: undefined, isLoading: true },
            });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
        });
    });

    describe('when the query fails', () => {
        it('renders an alert with an error message', () => {
            mockHooks({
                stats: { data: undefined, isError: true, isLoading: false },
            });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByRole('alert')).toHaveTextContent(/failed to load player profile/i);
        });

        it('does NOT render stats when there is an error', () => {
            mockHooks({
                stats: { data: undefined, isError: true, isLoading: false },
            });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
            expect(screen.queryByTestId('stat-wins')).not.toBeInTheDocument();
        });
    });

    describe('hook wiring', () => {
        it('calls usePlayerExtendedStats with the provided playerId', () => {
            mockHooks();
            render(<PlayerProfile playerId="some-other-id" />);

            expect(usePlayerExtendedStatsModule.usePlayerExtendedStats).toHaveBeenCalledWith('some-other-id');
        });
    });
});
