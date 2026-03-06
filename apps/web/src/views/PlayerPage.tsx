import { useParams } from 'react-router-dom';
import { PlayerProfile } from './PlayerProfile';

export function PlayerPage() {
    const { playerId = '' } = useParams<{ playerId: string }>();

    return (
        <div className="tt-route-scroll">
            <PlayerProfile playerId={playerId} />
        </div>
    );
}
