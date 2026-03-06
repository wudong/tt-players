import { IonButton, IonFooter, IonIcon, IonLabel, IonToolbar } from '@ionic/react';
import { gitCompareOutline, homeOutline, trophyOutline } from 'ionicons/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
    { label: 'Home', icon: homeOutline, path: '/' },
    { label: 'Leagues', icon: trophyOutline, path: '/leagues' },
    { label: 'H2H', icon: gitCompareOutline, path: '/h2h' },
] as const;

export function BottomNav() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    function isActive(path: string) {
        if (path === '/') return pathname === '/' || pathname.startsWith('/players/');
        if (path === '/leagues') return pathname.startsWith('/leagues') || pathname.startsWith('/teams/') || pathname.startsWith('/fixtures/');
        return pathname.startsWith(path);
    }

    return (
        <IonFooter translucent className="tt-bottom-nav-shell">
            <IonToolbar className="tt-bottom-nav-toolbar">
                <nav aria-label="Main navigation" className="tt-bottom-nav-track">
                    {NAV_ITEMS.map(({ label, icon, path }) => {
                        const active = isActive(path);
                        return (
                            <IonButton
                                key={path}
                                fill="clear"
                                onClick={() => navigate(path)}
                                className={active ? 'tt-nav-btn tt-nav-btn-active' : 'tt-nav-btn'}
                                aria-current={active ? 'page' : undefined}
                            >
                                <IonIcon icon={icon} />
                                <IonLabel>{label}</IonLabel>
                            </IonButton>
                        );
                    })}
                </nav>
            </IonToolbar>
        </IonFooter>
    );
}
