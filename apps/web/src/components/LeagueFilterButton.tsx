import { SlidersHorizontal } from 'lucide-react';

interface Props {
    count: number;
    onClick: () => void;
    className?: string;
}

export function LeagueFilterButton({ count, onClick, className = '' }: Props) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm ring-1 ring-white/20 transition hover:bg-white/25 ${className}`}
            aria-label="Choose leagues"
        >
            <SlidersHorizontal size={14} />
            Filters ({count})
        </button>
    );
}
