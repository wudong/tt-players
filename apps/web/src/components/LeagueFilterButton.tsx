import { IonButton, IonIcon } from '@ionic/react';
import { optionsOutline } from 'ionicons/icons';

interface Props {
    count: number;
    onClick: () => void;
}

export function LeagueFilterButton({ count, onClick }: Props) {
    return (
        <IonButton
            fill="outline"
            size="small"
            onClick={onClick}
            aria-label="Choose leagues"
        >
            <IonIcon icon={optionsOutline} slot="start" />
            Filters ({count})
        </IonButton>
    );
}
