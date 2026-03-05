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
            className={`tt-soft-btn !rounded-full ${className}`}
            aria-label="Choose leagues"
        >
            <SlidersHorizontal size={14} />
            Filters ({count})
        </button>
    );
}
