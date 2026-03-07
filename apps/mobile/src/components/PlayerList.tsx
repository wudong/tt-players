import type { ReactNode } from 'react';
import { calcWinRate, getInitials } from '../player-shared';
import { getPlayerAvatarColor } from '../utils/avatar';
import { AppListGroup } from '../ui/appkit';
import type { PlayerListItemData } from './types';

export type { PlayerListItemData };

type PlayerListSize = 'small' | 'large';

interface PlayerListProps {
  players: PlayerListItemData[];
  onSelectPlayer: (player: PlayerListItemData) => void;
  getSubtitle?: (player: PlayerListItemData) => string;
  renderTrailing?: (player: PlayerListItemData) => ReactNode;
  listClassName?: string;
  size?: PlayerListSize;
  withFilterDataAttr?: boolean;
  coloredAvatars?: boolean;
}

function defaultSubtitle(player: PlayerListItemData): string {
  return `${calcWinRate(player.wins, player.played)}% WR • ${player.played} matches`;
}

export function PlayerList({
  players,
  onSelectPlayer,
  getSubtitle = defaultSubtitle,
  renderTrailing,
  listClassName = 'tt-player-large-list',
  size = 'large',
  withFilterDataAttr = false,
  coloredAvatars = false,
}: PlayerListProps) {
  return (
    <AppListGroup size={size} className={listClassName}>
      {players.map((player, index) => (
        <a
          key={player.id}
          href="#"
          data-filter-item={withFilterDataAttr ? true : undefined}
          className={index === players.length - 1 ? 'border-0' : undefined}
          onClick={(event) => {
            event.preventDefault();
            onSelectPlayer(player);
          }}
        >
          <i className={`tt-player-avatar ${coloredAvatars ? getPlayerAvatarColor(player.name) : 'bg-highlight'} color-white`}>
            {getInitials(player.name)}
          </i>
          <span>{player.name}</span>
          <strong>{getSubtitle(player)}</strong>
          {renderTrailing ? renderTrailing(player) : null}
          <i className="fa fa-angle-right" />
        </a>
      ))}
    </AppListGroup>
  );
}
