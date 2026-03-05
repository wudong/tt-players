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
        // Mobile-first container: max-w-md centred, slate-50 background,
        // slate-200 outside (simulates phone screen on desktop)
        <div className="relative mx-auto min-h-screen w-full max-w-md bg-slate-50 shadow-2xl">
            <Routes>
                {/* ── Home tab ─────────────────────────────────────────── */}
                <Route path="/" element={<HomeView />} />

                {/* ── Leagues tab ──────────────────────────────────────── */}
                <Route path="/leagues" element={<LeaguesHubView />} />
                <Route path="/leagues/select" element={<LeagueSelectionPage />} />

                {/* ── Player profile (overlay-style page) ──────────────── */}
                {/* /players/:playerId → reads param via useParams() inside PlayerPage */}
                <Route path="/players/:playerId" element={<PlayerPage />} />

                {/* ── Fixture details (overlay-style page) ─────────────── */}
                <Route path="/fixtures/:fixtureId" element={<FixtureDetailsView />} />

                {/* ── Team hub (overlay-style page) ────────────────────── */}
                {/* /teams/:teamId → reads param via useParams() inside TeamPage */}
                <Route path="/teams/:teamId" element={<TeamPage />} />

                {/* ── H2H tab ──────────────────────────────────────────── */}
                <Route path="/h2h" element={<H2HView />} />

                {/* Legacy redirect from old /dashboard route */}
                <Route path="/dashboard" element={<Navigate to="/" replace />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Floating bottom navigation — visible on all routes */}
            <BottomNav />
        </div>
    );
}
