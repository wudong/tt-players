import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeaguesHubView } from '../views/LeaguesHubView';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

vi.mock('../context/LeaguePreferencesContext', () => ({
    useLeaguePreferences: () => ({
        selectedLeagues: [
            {
                id: 'league-1',
                name: 'Essex League',
                platform: 'tt365',
                season: '2025/26',
                divisions: [{ id: 'division-1', name: 'Division 1', external_id: 'd1' }],
            },
        ],
        selectedLeagueIds: ['league-1'],
        isLoading: false,
    }),
}));

vi.mock('../views/LeagueTable', () => ({
    LeagueTable: () => <div data-testid="league-table">League Table</div>,
}));

const useLeadersMock = vi.fn((..._args: [unknown, unknown, unknown, unknown]) => ({
    data: {
        formula: 'Ranked by combined score.',
        data: [],
    },
    isLoading: false,
}));

vi.mock('../hooks/useLeaders', () => ({
    useLeaders: (...args: [unknown, unknown, unknown, unknown]) => useLeadersMock(...args),
}));

describe('LeaguesHubView leaders behavior', () => {
    beforeEach(() => {
        useLeadersMock.mockClear();
    });

    it('defaults leaders mode to combined and requests combined leaderboard', () => {
        render(<LeaguesHubView />);

        expect(useLeadersMock).toHaveBeenCalledWith('combined', ['league-1'], 20, 3);
    });

    it('requests top 10 entries when Best Win % mode is selected', () => {
        render(<LeaguesHubView />);

        fireEvent.click(screen.getByRole('button', { name: /leaders/i }));
        fireEvent.click(screen.getByRole('button', { name: /best win %/i }));

        const calls = useLeadersMock.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall).toEqual(['win_pct', ['league-1'], 10, 3]);
    });
});
