import { IonButton, IonIcon } from '@ionic/react';
import { optionsOutline } from 'ionicons/icons';

interface Props {
    count: number;
    onClick: () => void;
    className?: string;
}

export function LeagueFilterButton({ count, onClick, className = '' }: Props) {
    return (
        <IonButton
            fill="outline"
            size="small"
            onClick={onClick}
            className={`tt-filter-btn ${className}`}
            aria-label="Choose leagues"
        >
            <IonIcon icon={optionsOutline} slot="start" />
            Filters ({count})
        </IonButton>
    );
}
