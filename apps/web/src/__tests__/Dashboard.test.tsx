import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { FixtureItem, FixturesResponse } from '../types';

// ---------------------------------------------------------------------------
// Mock the hook
// ---------------------------------------------------------------------------
vi.mock('../hooks/useFixtures');
import * as useFixturesModule from '../hooks/useFixtures';

import { Dashboard } from '../views/Dashboard';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const MOCK_FIXTURES: FixtureItem[] = [
    {
        id: 'fixture-1',
        competition_id: 'comp-1',
        external_id: 'ext-001',
        home_team_id: 'team-home-1',
        away_team_id: 'team-away-1',
        date_played: '2025-11-15T19:00:00.000Z',
        status: 'completed',
        round_name: 'Week 5',
        round_order: 5,
    },
    {
        id: 'fixture-2',
        competition_id: 'comp-1',
        external_id: 'ext-002',
        home_team_id: 'team-home-2',
        away_team_id: null,
        date_played: '2025-11-22T19:00:00.000Z',
        status: 'upcoming',
        round_name: 'Week 6',
        round_order: 6,
    },
];

const TEAM_ID = 'team-abc-123';

function makeFixturesResponse(data: FixtureItem[], availability: FixturesResponse['availability'] = 'available'): FixturesResponse {
    return {
        availability,
        total: data.length,
        limit: 20,
        offset: 0,
        data,
    };
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function mockHook(overrides: Partial<ReturnType<typeof useFixturesModule.useFixtures>>) {
    vi.spyOn(useFixturesModule, 'useFixtures').mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        ...overrides,
    } as ReturnType<typeof useFixturesModule.useFixtures>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- Success state --------------------------------------------------------
    describe('when data loads successfully', () => {
        it('renders a card/row for every fixture in mock data', () => {
            mockHook({ data: makeFixturesResponse(MOCK_FIXTURES), isLoading: false, isError: false });
            render(<Dashboard teamId={TEAM_ID} />);

            // Each fixture should be discoverable in the DOM — we assert by unique id attr or status text
            expect(screen.getAllByTestId('fixture-item').length).toBe(MOCK_FIXTURES.length);
        });

        it('displays the status for each fixture', () => {
            mockHook({ data: makeFixturesResponse(MOCK_FIXTURES), isLoading: false, isError: false });
            render(<Dashboard teamId={TEAM_ID} />);

            expect(screen.getByText(/completed/i)).toBeInTheDocument();
            expect(screen.getByText(/upcoming/i)).toBeInTheDocument();
        });

        it('shows a formatted date for each fixture', () => {
            mockHook({ data: makeFixturesResponse(MOCK_FIXTURES), isLoading: false, isError: false });
            render(<Dashboard teamId={TEAM_ID} />);

            // We just assert that a date element is rendered for each fixture
            const dateEls = screen.getAllByTestId('fixture-date');
            expect(dateEls.length).toBe(MOCK_FIXTURES.length);
        });

        it('renders "TBD" when away_team_id is null', () => {
            mockHook({ data: makeFixturesResponse(MOCK_FIXTURES), isLoading: false, isError: false });
            render(<Dashboard teamId={TEAM_ID} />);

            expect(screen.getByText(/tbd/i)).toBeInTheDocument();
        });

        it('shows an empty-state when fixtures list is empty', () => {
            mockHook({ data: makeFixturesResponse([], 'no_matches_yet'), isLoading: false, isError: false });
            render(<Dashboard teamId={TEAM_ID} />);

            expect(screen.getByText(/no recent matches/i)).toBeInTheDocument();
        });
    });

    // --- Loading state -------------------------------------------------------
    describe('when the query is loading', () => {
        it('renders a loading indicator', () => {
            mockHook({ data: undefined, isLoading: true, isError: false });
            render(<Dashboard teamId={TEAM_ID} />);

            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('does NOT render fixture items while loading', () => {
            mockHook({ data: undefined, isLoading: true, isError: false });
            render(<Dashboard teamId={TEAM_ID} />);

            expect(screen.queryByTestId('fixture-item')).not.toBeInTheDocument();
        });
    });

    // --- Error state ---------------------------------------------------------
    describe('when the query fails', () => {
        it('renders an alert with an error message', () => {
            mockHook({
                data: undefined,
                isLoading: false,
                isError: true,
                error: new Error('Network failed'),
            });
            render(<Dashboard teamId={TEAM_ID} />);

            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByRole('alert')).toHaveTextContent(/network failed/i);
        });

        it('does NOT render fixture items on error', () => {
            mockHook({
                data: undefined,
                isLoading: false,
                isError: true,
                error: new Error('Network failed'),
            });
            render(<Dashboard teamId={TEAM_ID} />);

            expect(screen.queryByTestId('fixture-item')).not.toBeInTheDocument();
        });
    });

    // --- Hook wiring ---------------------------------------------------------
    describe('hook wiring', () => {
        it('calls useFixtures with the provided teamId', () => {
            const spy = vi.spyOn(useFixturesModule, 'useFixtures').mockReturnValue({
                data: makeFixturesResponse(MOCK_FIXTURES),
                isLoading: false,
                isError: false,
                error: null,
            } as ReturnType<typeof useFixturesModule.useFixtures>);

            render(<Dashboard teamId="specific-team-id" />);

            expect(spy).toHaveBeenCalledWith('specific-team-id', expect.anything());
        });
    });
});
