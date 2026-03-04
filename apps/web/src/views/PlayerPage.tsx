import { useParams, useNavigate } from 'react-router-dom';
import { PlayerProfile } from './PlayerProfile';

// Route wrapper: reads :playerId from the URL and passes it to the
// PlayerProfile component (which is tested in isolation via props).
export function PlayerPage() {
    const { playerId = '' } = useParams<{ playerId: string }>();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col pb-28">
            {/* Back button header */}
            <header className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-800 px-5 pb-6 pt-12 shadow-lg">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-3 flex items-center gap-1 text-sm text-emerald-100 hover:text-white"
                >
                    ← Back
                </button>
                <h1 className="text-xl font-extrabold text-white">Player Profile</h1>
            </header>

            {/* Profile stats card — reads from the live API */}
            <PlayerProfile playerId={playerId} />
        </div>
    );
}
