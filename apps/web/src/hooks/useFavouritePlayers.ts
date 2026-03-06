import { useCallback, useEffect, useState } from 'react';
import type { FavouritePlayer } from '../types';

const STORAGE_KEY = 'tt_players_favourite_players';
const UPDATED_EVENT = 'tt_players_favourite_players_updated';

function isValidFavouritePlayer(value: unknown): value is FavouritePlayer {
    if (!value || typeof value !== 'object') return false;
    const item = value as Record<string, unknown>;
    return typeof item.id === 'string'
        && typeof item.name === 'string'
        && typeof item.played === 'number'
        && typeof item.wins === 'number';
}

function parseStoredFavouritePlayers(): FavouritePlayer[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isValidFavouritePlayer);
    } catch {
        return [];
    }
}

function persistFavouritePlayers(players: FavouritePlayer[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    window.dispatchEvent(new Event(UPDATED_EVENT));
}

export function useFavouritePlayers() {
    const [favouritePlayers, setFavouritePlayers] = useState<FavouritePlayer[]>(() => parseStoredFavouritePlayers());

    useEffect(() => {
        const syncFromStorage = () => {
            setFavouritePlayers(parseStoredFavouritePlayers());
        };

        window.addEventListener('storage', syncFromStorage);
        window.addEventListener(UPDATED_EVENT, syncFromStorage);
        return () => {
            window.removeEventListener('storage', syncFromStorage);
            window.removeEventListener(UPDATED_EVENT, syncFromStorage);
        };
    }, []);

    const addFavouritePlayer = useCallback((player: FavouritePlayer) => {
        setFavouritePlayers((previous) => {
            const withoutExisting = previous.filter((item) => item.id !== player.id);
            const next = [player, ...withoutExisting];
            persistFavouritePlayers(next);
            return next;
        });
    }, []);

    const removeFavouritePlayer = useCallback((playerId: string) => {
        setFavouritePlayers((previous) => {
            const next = previous.filter((player) => player.id !== playerId);
            persistFavouritePlayers(next);
            return next;
        });
    }, []);

    const isFavouritePlayer = useCallback((playerId: string) => (
        favouritePlayers.some((player) => player.id === playerId)
    ), [favouritePlayers]);

    const toggleFavouritePlayer = useCallback((player: FavouritePlayer) => {
        if (isFavouritePlayer(player.id)) {
            removeFavouritePlayer(player.id);
            return;
        }
        addFavouritePlayer(player);
    }, [addFavouritePlayer, isFavouritePlayer, removeFavouritePlayer]);

    return {
        favouritePlayers,
        addFavouritePlayer,
        removeFavouritePlayer,
        toggleFavouritePlayer,
        isFavouritePlayer,
    };
}
