import { useParams } from 'react-router-dom';
import { PlayerProfile } from './PlayerProfile';

export function PlayerPage() {
    const { playerId = '' } = useParams<{ playerId: string }>();

    return (
        <div>
            <PlayerProfile playerId={playerId} />
        </div>
    );
}
