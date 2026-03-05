import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Trophy, Swords } from 'lucide-react';
import React from 'react';

const NAV_ITEMS = [
    { label: 'Home', icon: Search, path: '/' },
    { label: 'Leagues', icon: Trophy, path: '/leagues' },
    { label: 'H2H', icon: Swords, path: '/h2h' },
] as const;

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
    <button
        onClick={onClick}
        className={`flex min-w-[78px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all duration-200 ${
            active
                ? 'bg-[#edf3ff] text-[#2869fe] ring-1 ring-[#bfd2ff]'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
        }`}
        aria-current={active ? 'page' : undefined}
    >
        <Icon size={18} strokeWidth={active ? 2.6 : 2.2} />
        <span className={`tt-kicker !text-[10px] !tracking-[0.1em] ${active ? 'text-[#2869fe]' : 'text-slate-500'}`}>{label}</span>
    </button>
);

export function BottomNav() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // Determine the active tab
    function isActive(path: string) {
        if (path === '/') return pathname === '/' || pathname.startsWith('/players/');
        if (path === '/leagues') return pathname.startsWith('/leagues') || pathname.startsWith('/teams/') || pathname.startsWith('/fixtures/');
        return pathname.startsWith(path);
    }

    return (
        <nav
            aria-label="Main navigation"
            className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white/95 to-transparent pb-6 pt-8"
        >
            <div className="mx-auto flex h-[62px] max-w-sm items-center justify-around rounded-[20px] bg-white/95 px-3 shadow-[0_8px_32px_rgba(18,25,39,0.12)] ring-1 ring-slate-200/80 backdrop-blur-md">
                {NAV_ITEMS.map(({ label, icon, path }) => (
                    <NavItem
                        key={path}
                        icon={icon}
                        label={label}
                        active={isActive(path)}
                        onClick={() => navigate(path)}
                    />
                ))}
            </div>
        </nav>
    );
}
