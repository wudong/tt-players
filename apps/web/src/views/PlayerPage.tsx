import { useParams } from 'react-router-dom';
import { PlayerProfile } from './PlayerProfile';

// Route wrapper: reads :playerId from the URL and passes it to the
// PlayerProfile component (which is tested in isolation via props).
export function PlayerPage() {
    const { playerId = '' } = useParams<{ playerId: string }>();

    return (
        <div className="flex min-h-screen flex-col bg-transparent pb-28">
            <PlayerProfile playerId={playerId} />
        </div>
    );
}
