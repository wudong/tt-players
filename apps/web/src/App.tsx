import { IonContent, IonPage } from '@ionic/react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { FixtureDetailsView } from './views/FixtureDetailsView';
import { H2HView } from './views/H2HView';
import { HomeView } from './views/HomeView';
import { LeagueSelectionPage } from './views/LeagueSelectionPage';
import { LeaguesHubView } from './views/LeaguesHubView';
import { PlayerPage } from './views/PlayerPage';
import { TeamPage } from './views/TeamPage';

export default function App() {
    return (
        <IonPage>
            <IonContent fullscreen scrollY={false}>
                <div>
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
                </div>
            </IonContent>
            <BottomNav />
        </IonPage>
    );
}
