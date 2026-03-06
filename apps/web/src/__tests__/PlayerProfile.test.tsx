import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PlayerStats } from '../types';
import { winPercentage } from '../types';

// ---------------------------------------------------------------------------
// Mock the hook
// ---------------------------------------------------------------------------
vi.mock('../hooks/usePlayerStats');
import * as usePlayerStatsModule from '../hooks/usePlayerStats';

import { PlayerProfile } from '../views/PlayerProfile';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const MOCK_STATS: PlayerStats = {
    player_id: 'player-uuid-1',
    player_name: 'Alice Smith',
    wins: 18,
    losses: 6,
    total: 24,
};

const PLAYER_ID = 'player-uuid-1';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function mockHook(overrides: Partial<ReturnType<typeof usePlayerStatsModule.usePlayerStats>>) {
    vi.spyOn(usePlayerStatsModule, 'usePlayerStats').mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        ...overrides,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PlayerProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- Success state --------------------------------------------------------
    describe('when data loads successfully', () => {
        it('renders the player name', () => {
            mockHook({ data: MOCK_STATS, isLoading: false, isError: false });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        });

        it('renders the correct win percentage', () => {
            mockHook({ data: MOCK_STATS, isLoading: false, isError: false });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            // 18 wins / 24 total = 75%
            const expectedPct = winPercentage(MOCK_STATS);
            expect(expectedPct).toBe(75);
            // The component should display the percentage — match flexible patterns
            expect(screen.getByText(/75%/)).toBeInTheDocument();
        });

        it('renders the wins count', () => {
            mockHook({ data: MOCK_STATS, isLoading: false, isError: false });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByTestId('stat-wins')).toHaveTextContent('18');
        });

        it('renders the losses count', () => {
            mockHook({ data: MOCK_STATS, isLoading: false, isError: false });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByTestId('stat-losses')).toHaveTextContent('6');
        });

        it('renders the total rubbers played', () => {
            mockHook({ data: MOCK_STATS, isLoading: false, isError: false });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByTestId('stat-total')).toHaveTextContent('24');
        });

        it('handles a player with zero rubbers gracefully (no division by zero)', () => {
            const zeroed: PlayerStats = {
                player_id: 'player-new',
                player_name: 'New Player',
                wins: 0,
                losses: 0,
                total: 0,
            };
            mockHook({ data: zeroed, isLoading: false, isError: false });

            // Should not throw — win % = 0%
            render(<PlayerProfile playerId="player-new" />);

            expect(screen.getByText(/0%/)).toBeInTheDocument();
        });
    });

    // --- Loading state -------------------------------------------------------
    describe('when the query is loading', () => {
        it('renders a loading indicator', () => {
            mockHook({ data: undefined, isLoading: true, isError: false });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('does NOT render the player name whilst loading', () => {
            mockHook({ data: undefined, isLoading: true, isError: false });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
        });
    });

    // --- Error state ---------------------------------------------------------
    describe('when the query fails', () => {
        it('renders an alert with an error message', () => {
            mockHook({
                data: undefined,
                isLoading: false,
                isError: true,
                error: new Error('Player not found'),
            });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByRole('alert')).toHaveTextContent(/player not found/i);
        });

        it('does NOT render stats when there is an error', () => {
            mockHook({
                data: undefined,
                isLoading: false,
                isError: true,
                error: new Error('Player not found'),
            });
            render(<PlayerProfile playerId={PLAYER_ID} />);

            expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
            expect(screen.queryByTestId('stat-wins')).not.toBeInTheDocument();
        });
    });

    // --- Hook wiring ---------------------------------------------------------
    describe('hook wiring', () => {
        it('calls usePlayerStats with the provided playerId', () => {
            const spy = vi.spyOn(usePlayerStatsModule, 'usePlayerStats').mockReturnValue({
                data: MOCK_STATS,
                isLoading: false,
                isError: false,
                error: null,
            } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

            render(<PlayerProfile playerId="some-other-id" />);

            expect(spy).toHaveBeenCalledWith('some-other-id');
        });
    });
});
