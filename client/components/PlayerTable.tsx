import clsx from 'classnames';

import { Player } from '@/lib/types';
import { ColorArr, MaxTeamNum, WarringStates } from '@/lib/constants';

interface PlayerTableProps {
  myPlayerId: string;
  players: Player[];
  handleChangeHost: (playerId: string, username: string) => void;
  disabled_ui: boolean;
  warringStatesMode: boolean;
}

export default function PlayerTable({
  myPlayerId,
  players,
  handleChangeHost,
  disabled_ui,
  warringStatesMode,
}: PlayerTableProps) {
  const teams: Record<number, Player[]> = {};
  players.forEach((player) =>
    (teams[player.team] = teams[player.team] || []).push(player)
  );

  const renderPlayer = (player: Player) => {
    const playerColor = ColorArr[player.color];
    const isSelf = player.id === myPlayerId;
    const labelPrefix = warringStatesMode ? WarringStates[player.color] : '';

    return (
      <button
        key={player.id}
        type="button"
        disabled={disabled_ui}
        onClick={() => handleChangeHost(player.id, player.username)}
        title={disabled_ui ? undefined : '转移房主'}
        className={clsx(
          'group flex items-center gap-2 rounded-full border-2 px-3 py-1 text-sm font-medium transition-all shadow-sm',
          !disabled_ui && 'hover:-translate-y-0.5 hover:shadow-md',
        )}
        style={{
          borderColor: playerColor,
          backgroundColor: isSelf ? playerColor : 'transparent',
          color: isSelf ? '#fff' : playerColor,
        }}
      >
        {player.isRoomHost && (
          <svg
            viewBox="0 0 24 24"
            className={clsx(
              'h-4 w-4',
              isSelf ? 'text-white' : 'text-[currentColor]',
            )}
            fill="currentColor"
          >
            <path d="M12 17.27l5.18 3.11-1.64-5.81L20 10.97l-5.9-.51L12 5l-2.1 5.46-5.9.51 4.46 3.6-1.64 5.81L12 17.27z" />
          </svg>
        )}
        <span className={clsx('truncate', player.forceStart && 'underline')}>
          {labelPrefix}
          {player.username}
        </span>
      </button>
    );
  };

  const teamEntries = Array.from({ length: MaxTeamNum + 2 }, (_, index) => ({
    teamId: index,
    label: index <= MaxTeamNum ? `TEAM ${index}` : '观众',
    members: teams[index] ?? [],
  }));

  return (
    <div className="flex flex-wrap gap-3">
      {teamEntries.map(({ teamId, label, members }) => (
        <div
          key={teamId}
          className="min-w-[140px] rounded-xl border-2 border-border-main bg-white/90 p-3 shadow-sm"
        >
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {label}
          </div>
          <div className="flex flex-col gap-2">
            {members.length === 0 ? (
              <span className="text-xs text-text-muted">暂无玩家</span>
            ) : (
              members.map((player) => renderPlayer(player))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
