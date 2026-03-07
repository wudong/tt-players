import { useEffect, useState } from 'react';
import {
  FAVOURITES_STORAGE_KEY,
  FAVOURITES_UPDATED_EVENT,
  isValidFavouritePlayer,
  type FavouritePlayer,
} from '../player-shared';

export function useFavouritePlayers() {
  const [players, setPlayers] = useState<FavouritePlayer[]>(() => {
    try {
      const raw = localStorage.getItem(FAVOURITES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidFavouritePlayer);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const raw = localStorage.getItem(FAVOURITES_STORAGE_KEY);
        if (!raw) {
          setPlayers([]);
          return;
        }
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
          setPlayers([]);
          return;
        }
        setPlayers(parsed.filter(isValidFavouritePlayer));
      } catch {
        setPlayers([]);
      }
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(FAVOURITES_UPDATED_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(FAVOURITES_UPDATED_EVENT, syncFromStorage);
    };
  }, []);

  const isFavourite = (playerId: string): boolean => {
    return players.some((player) => player.id === playerId);
  };

  const toggle = (player: FavouritePlayer): void => {
    setPlayers((previous) => {
      const exists = previous.some((item) => item.id === player.id);
      const next = exists
        ? previous.filter((item) => item.id !== player.id)
        : [player, ...previous.filter((item) => item.id !== player.id)];

      localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(FAVOURITES_UPDATED_EVENT));
      return next;
    });
  };

  const add = (player: FavouritePlayer): void => {
    if (isFavourite(player.id)) return;
    toggle(player);
  };

  const remove = (playerId: string): void => {
    const player = players.find((p) => p.id === playerId);
    if (player) toggle(player);
  };

  return {
    players,
    isFavourite,
    toggle,
    add,
    remove,
  };
}
