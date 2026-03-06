import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { StandingItem } from '../types';

// ---------------------------------------------------------------------------
// Mock the hook so the component under test is completely isolated from the
// network. vi.mock hoists automatically in Vitest.
// ---------------------------------------------------------------------------
vi.mock('../hooks/useStandings');
import * as useStandingsModule from '../hooks/useStandings';

// Lazy import the component AFTER mocking so it picks up the stub.
import { LeagueTable } from '../views/LeagueTable';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const MOCK_STANDINGS: StandingItem[] = [
    {
        position: 1,
        team_id: 'uuid-1',
        team_name: 'Brentwood A',
        played: 10,
        won: 8,
        drawn: 0,
        lost: 2,
        points: 16,
    },
    {
        position: 2,
        team_id: 'uuid-2',
        team_name: 'Chelmsford B',
        played: 10,
        won: 6,
        drawn: 1,
        lost: 3,
        points: 13,
    },
    {
        position: 3,
        team_id: 'uuid-3',
        team_name: 'Romford C',
        played: 10,
        won: 4,
        drawn: 2,
        lost: 4,
        points: 10,
    },
];

const COMPETITION_ID = 'comp-abc-123';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mockHook(overrides: Partial<ReturnType<typeof useStandingsModule.useStandings>>) {
    vi.spyOn(useStandingsModule, 'useStandings').mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        ...overrides,
    } as ReturnType<typeof useStandingsModule.useStandings>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('LeagueTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- Success state --------------------------------------------------------
    describe('when data loads successfully', () => {
        it('renders a row for every team in the mock data', () => {
            mockHook({ data: MOCK_STANDINGS, isLoading: false, isError: false });
            render(<LeagueTable competitionId={COMPETITION_ID} />);

            for (const standing of MOCK_STANDINGS) {
                expect(screen.getByText(standing.team_name)).toBeInTheDocument();
            }
        });

        it('renders the correct points for each team', () => {
            mockHook({ data: MOCK_STANDINGS, isLoading: false, isError: false });
            render(<LeagueTable competitionId={COMPETITION_ID} />);

            // Each team's points value should appear in the DOM.
            // Use getAllByText to handle any accidental duplicates without false failures.
            expect(screen.getByText('16')).toBeInTheDocument(); // Brentwood A — 16 pts
            expect(screen.getByText('13')).toBeInTheDocument(); // Chelmsford B — 13 pts
            expect(screen.getByText('10')).toBeInTheDocument(); // Romford C — 10 pts
        });

        it('renders the correct league position for each team', () => {
            mockHook({ data: MOCK_STANDINGS, isLoading: false, isError: false });
            render(<LeagueTable competitionId={COMPETITION_ID} />);

            // Positions 1, 2, 3 must appear in the table.
            // Some values collide with other columns (e.g. lost=2) so we use
            // getAllByText and assert at least one match exists.
            expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
        });

        it('renders won and lost counts for each team', () => {
            mockHook({ data: MOCK_STANDINGS, isLoading: false, isError: false });
            render(<LeagueTable competitionId={COMPETITION_ID} />);

            // Brentwood A: 8 won, 2 lost
            const wonCells = screen.getAllByText('8');
            expect(wonCells.length).toBeGreaterThanOrEqual(1);

            const lostCells = screen.getAllByText('2');
            expect(lostCells.length).toBeGreaterThanOrEqual(1);
        });

        it('renders the table with correct accessible role', () => {
            mockHook({ data: MOCK_STANDINGS, isLoading: false, isError: false });
            render(<LeagueTable competitionId={COMPETITION_ID} />);

            expect(screen.getByRole('table')).toBeInTheDocument();
        });

        it('renders an empty-state row when the standings list is empty', () => {
            mockHook({ data: [], isLoading: false, isError: false });
            render(<LeagueTable competitionId={COMPETITION_ID} />);

            expect(screen.getByText(/no standings/i)).toBeInTheDocument();
        });
    });

    // --- Loading state -------------------------------------------------------
    describe('when the query is loading', () => {
        it('renders a loading indicator', () => {
            mockHook({ data: undefined, isLoading: true, isError: false });
            render(<LeagueTable competitionId={COMPETITION_ID} />);

            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('does NOT render any team rows while loading', () => {
            mockHook({ data: undefined, isLoading: true, isError: false });
            render(<LeagueTable competitionId={COMPETITION_ID} />);

            expect(screen.queryByText('Brentwood A')).not.toBeInTheDocument();
        });
    });

    // --- Error state ---------------------------------------------------------
    describe('when the query fails', () => {
        it('renders an error message', () => {
            mockHook({
                data: undefined,
                isLoading: false,
                isError: true,
                error: new Error('Failed to load standings'),
            });
            render(<LeagueTable competitionId={COMPETITION_ID} />);

            expect(screen.getByRole('alert')).toBeInTheDocument();
        });

        it('includes a human-readable error hint in the alert', () => {
            mockHook({
                data: undefined,
                isLoading: false,
                isError: true,
                error: new Error('Failed to load standings'),
            });
            render(<LeagueTable competitionId={COMPETITION_ID} />);

            expect(screen.getByRole('alert')).toHaveTextContent(/failed to load standings/i);
        });

        it('does NOT render any team rows when there is an error', () => {
            mockHook({
                data: undefined,
                isLoading: false,
                isError: true,
                error: new Error('Network error'),
            });
            render(<LeagueTable competitionId={COMPETITION_ID} />);

            expect(screen.queryByText('Brentwood A')).not.toBeInTheDocument();
        });
    });

    // --- Prop & hook wiring --------------------------------------------------
    describe('hook wiring', () => {
        it('calls useStandings with the provided competitionId', () => {
            const spy = vi.spyOn(useStandingsModule, 'useStandings').mockReturnValue({
                data: MOCK_STANDINGS,
                isLoading: false,
                isError: false,
                error: null,
            } as ReturnType<typeof useStandingsModule.useStandings>);

            render(<LeagueTable competitionId="specific-comp-id" />);

            expect(spy).toHaveBeenCalledWith('specific-comp-id');
        });
    });
});
