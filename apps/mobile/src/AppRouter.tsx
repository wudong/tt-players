import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import { PlayerInsightsPage } from './PlayerInsightsPage';
import { PlayerMatchesPage } from './PlayerMatchesPage';
import { PlayerPage } from './PlayerPage';

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/players/:playerId" element={<PlayerPage />} />
        <Route path="/players/:playerId/insights" element={<PlayerInsightsPage />} />
        <Route path="/players/:playerId/matches" element={<PlayerMatchesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
