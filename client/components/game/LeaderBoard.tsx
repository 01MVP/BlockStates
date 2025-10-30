import { useEffect, useState } from 'react';
import clsx from 'classnames';

import { Player, LeaderBoardTable, UserData } from '@/lib/types';
import { ColorArr, MaxTeamNum } from '@/lib/constants';
import useMediaQuery from '@/hooks/useMediaQuery';

interface LeaderBoardProps {
  players: Player[];
  leaderBoardTable: LeaderBoardTable | null;
  checkedPlayers?: UserData[];
  setCheckedPlayers?: (value: UserData[]) => void;
  warringStatesMode?: boolean;
}

interface TeamEntry {
  id: number;
  armyCount: number;
  landsCount: number;
  players: {
    color: number;
    username: string | null;
    armyCount: number;
    landsCount: number;
  }[];
}

export default function LeaderBoard({
  players,
  leaderBoardTable,
  checkedPlayers,
  setCheckedPlayers,
  warringStatesMode = false,
}: LeaderBoardProps) {
  const [isExpanded, setExpanded] = useState(true);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    setExpanded(!isSmallScreen);
  }, [isSmallScreen]);

  if (!leaderBoardTable) {
    return null;
  }

  const fetchUsernameByColor = (color: number) =>
    players.find((player) => player.color === color)?.username ?? null;

  const teams: TeamEntry[] = leaderBoardTable.reduce((acc, row) => {
    const [, teamId, armyCount, landsCount] = row;
    if (!acc[teamId]) {
      acc[teamId] = {
        id: teamId,
        armyCount: 0,
        landsCount: 0,
        players: [],
      } as TeamEntry;
    }

    const team = acc[teamId];
    team.armyCount += armyCount;
    team.landsCount += landsCount;
    team.players.push({
      color: row[0],
      username: fetchUsernameByColor(row[0]),
      armyCount,
      landsCount,
    });
    return acc;
  }, new Array<TeamEntry>(MaxTeamNum + 1))
    .filter(Boolean)
    .sort((a, b) => b.armyCount - a.armyCount || b.landsCount - a.landsCount)
    .map((team) => ({
      ...team,
      players: team.players.sort(
        (a, b) => b.armyCount - a.armyCount || b.landsCount - a.landsCount,
      ),
    }));

  const toggleTeamSelection = (team: TeamEntry, checked: boolean) => {
    if (!checkedPlayers || !setCheckedPlayers) return;
    if (checked) {
      const teamKey = String(team.id);
      const appended = team.players.map((player) => ({
        team: teamKey,
        username: player.username ?? '',
        color: player.color,
      }));
      const unique = [...checkedPlayers, ...appended].reduce<UserData[]>((acc, item) => {
        const normalizedTeam = item.team != null ? String(item.team) : undefined;
        const isDuplicate = acc.some((existing) => {
          const existingTeam = existing.team != null ? String(existing.team) : undefined;
          return existing.username === item.username && existingTeam === normalizedTeam;
        });
        if (!isDuplicate) {
          acc.push({
            ...item,
            team: normalizedTeam,
          });
        }
        return acc;
      }, []);
      setCheckedPlayers(unique);
    } else {
      const teamKey = String(team.id);
      setCheckedPlayers(
        checkedPlayers.filter((entry) => (entry.team != null ? String(entry.team) : undefined) !== teamKey),
      );
    }
  };

  const isTeamSelected = (teamId: number) =>
    checkedPlayers?.some((player) => {
      const teamValue = player.team != null ? String(player.team) : undefined;
      return teamValue === String(teamId);
    }) ?? false;

  return (
    <aside
      className={clsx(
        'fixed right-2 top-2 z-tooltip transition-all duration-200',
        isExpanded ? 'w-[320px]' : 'w-[220px]',
      )}
    >
      <div className="rounded-l-3xl border-2 border-border-main bg-white/95 shadow-xl backdrop-blur">
        <button
          type="button"
          className="flex w-full items-center justify-between border-b-2 border-border-main px-4 py-3 text-sm font-medium text-text-primary"
          onClick={() => setExpanded((value) => !value)}
        >
          <span>排行榜</span>
          <svg
            viewBox="0 0 24 24"
            className={clsx(
              'h-4 w-4 transform transition-transform',
              isExpanded ? 'rotate-180' : 'rotate-0',
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="max-h-[70vh] overflow-y-auto">
          {teams.map((team) => (
            <div
              key={team.id}
              className="border-b border-border-subtle px-4 py-3 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      TEAM {team.id}
                    </span>
                    {!isExpanded && (
                      <div className="flex items-center gap-1">
                        {team.players.map((player) => (
                          <span
                            key={player.color}
                            className="h-2 w-6 rounded-full border border-white/60"
                            style={{ backgroundColor: ColorArr[player.color] }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span>
                        兵力
                        <span className="ml-1 font-semibold text-text-primary">
                          {team.armyCount}
                        </span>
                      </span>
                      <span>
                        领地
                        <span className="ml-1 font-semibold text-text-primary">
                          {team.landsCount}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
                {isExpanded && checkedPlayers && setCheckedPlayers && (
                  <label className="flex items-center gap-2 text-xs text-text-muted">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border-main text-text-primary focus:ring-text-primary/40"
                      checked={isTeamSelected(team.id)}
                      onChange={(event) => toggleTeamSelection(team, event.target.checked)}
                    />
                    <span>视角</span>
                  </label>
                )}
                {!isExpanded && (
                  <div className="flex flex-col items-end text-xs text-text-muted">
                    <span>兵力 {team.armyCount}</span>
                    <span>领地 {team.landsCount}</span>
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="mt-3 space-y-2 text-xs">
                  {team.players.map((player) => (
                    <div
                      key={player.color}
                      className="flex items-center justify-between rounded-lg border border-border-main bg-bg-light px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full border border-white/60"
                          style={{ backgroundColor: ColorArr[player.color] }}
                        />
                        <span className="font-medium text-text-primary">
                          {player.username ?? '未知玩家'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-text-muted">
                        <span>兵 {player.armyCount}</span>
                        <span>地 {player.landsCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
