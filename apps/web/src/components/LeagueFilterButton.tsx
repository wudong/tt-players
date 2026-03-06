import { SlidersHorizontal } from 'lucide-react';
import { PressButton } from '../ui/PressButton';

interface Props {
    count: number;
    onClick: () => void;
    className?: string;
}

export function LeagueFilterButton({ count, onClick, className = '' }: Props) {
    return (
        <PressButton
            onClick={onClick}
            className={`tt-soft-btn !rounded-full ${className}`}
            aria-label="Choose leagues"
        >
            <SlidersHorizontal size={14} />
            Filters ({count})
        </PressButton>
    );
}
