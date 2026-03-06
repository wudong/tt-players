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
        className={`flex w-16 flex-col items-center justify-center space-y-1 rounded-2xl py-2 transition-all duration-300 ${active ? 'bg-emerald-50 text-emerald-600 scale-110 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
        aria-current={active ? 'page' : undefined}
    >
        <Icon size={22} strokeWidth={active ? 2.5 : 2} className={`transition-all duration-300 ${active ? 'mb-0.5' : ''}`} />
        {active && <span className="text-[10px] font-bold tracking-wide animate-in fade-in zoom-in duration-200">{label}</span>}
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white to-transparent pb-6 pt-10"
        >
            <div className="mx-auto flex h-16 max-w-sm items-center justify-around rounded-3xl bg-white px-4 shadow-2xl shadow-slate-200 ring-1 ring-slate-100">
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
