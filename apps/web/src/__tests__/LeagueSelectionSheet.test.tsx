import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeagueSelectionSheet } from '../components/LeagueSelectionSheet';

const mockToggleLeague = vi.fn();
const mockSelectAllLeagues = vi.fn();
const mockClearSelectedLeagues = vi.fn();

let mockContext = {
    allLeagues: [
        {
            id: 'league-1',
            name: 'Essex League',
            platform: 'tt365',
            season_id: 'season-1',
            season: '2025/26',
            divisions: [{ id: 'division-1', name: 'Division 1', external_id: 'd1' }],
        },
    ],
    selectedLeagueIds: [] as string[],
    toggleLeague: mockToggleLeague,
    selectAllLeagues: mockSelectAllLeagues,
    clearSelectedLeagues: mockClearSelectedLeagues,
};

vi.mock('../context/LeaguePreferencesContext', () => ({
    useLeaguePreferences: () => mockContext,
}));

describe('LeagueSelectionSheet', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockContext = {
            ...mockContext,
            selectedLeagueIds: [],
            toggleLeague: mockToggleLeague,
            selectAllLeagues: mockSelectAllLeagues,
            clearSelectedLeagues: mockClearSelectedLeagues,
        };
    });

    it('does not render when closed', () => {
        render(<LeagueSelectionSheet isOpen={false} onClose={vi.fn()} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders and handles actions when open', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(<LeagueSelectionSheet isOpen onClose={onClose} />);

        await user.click(screen.getByRole('button', { name: /done/i }));
        expect(onClose).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: /select all/i }));
        expect(mockSelectAllLeagues).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: /clear all/i }));
        expect(mockClearSelectedLeagues).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: /essex league/i }));
        expect(mockToggleLeague).toHaveBeenCalledWith('league-1');
    });
});
