import { Routes, Route, Navigate } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { LeaguesHubView } from './views/LeaguesHubView';
import { PlayerPage } from './views/PlayerPage';
import { FixtureDetailsView } from './views/FixtureDetailsView';
import { TeamPage } from './views/TeamPage';
import { H2HView } from './views/H2HView';
import { LeagueSelectionPage } from './views/LeagueSelectionPage';

export default function App() {
    return (
        <div className="tt-shell">
            <Routes>
                <Route path="/" element={<HomeView />} />
                <Route path="/leagues" element={<LeaguesHubView />} />
                <Route path="/leagues/select" element={<LeagueSelectionPage />} />
                <Route path="/players/:playerId" element={<PlayerPage />} />
                <Route path="/fixtures/:fixtureId" element={<FixtureDetailsView />} />
                <Route path="/teams/:teamId" element={<TeamPage />} />
                <Route path="/h2h" element={<H2HView />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
        </div>
    );
}
