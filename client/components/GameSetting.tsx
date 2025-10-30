import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  ChangeEvent,
  FocusEvent,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'classnames';

import SliderBox from './SliderBox';
import PlayerTable from './PlayerTable';
import MapExplorer from './game/MapExplorer';
import Modal from '@/components/ui/Modal';
import {
  ArrowLeftIcon,
  ShareIcon,
  CloseIcon,
  UsersIcon,
} from '@/components/ui/icons';
import { forceStartOK, MaxTeamNum, SpeedOptions } from '@/lib/constants';
import { useGame, useGameDispatch } from '@/context/GameContext';

const tabItems = ['团队', '游戏', '地图', '地形', '修改器'];

function SwitchControl({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-2 rounded-full border-2 border-border-main px-3 py-1 text-sm transition-all',
        checked
          ? 'border-text-primary bg-text-primary text-white shadow'
          : 'bg-white text-text-primary hover:border-text-primary hover:bg-bg-main',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span
        className={clsx(
          'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border border-border-main transition-colors',
          checked ? 'bg-player-2' : 'bg-border-subtle',
        )}
      >
        <span
          className={clsx(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-all',
            checked ? 'right-0.5' : 'left-0.5',
          )}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

const GameSetting: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [isNameFocused, setIsNamedFocused] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [forceStart, setForceStart] = useState(false);
  const [openMapExplorer, setOpenMapExplorer] = useState(false);

  const { room, socketRef, myPlayerId, myUserName, team } = useGame();
  const { roomDispatch, snackStateDispatch, setTeam } = useGameDispatch();

  const router = useRouter();

  useEffect(() => {
    setShareLink(window.location.href);
  }, []);

  const disabledUI = useMemo(() => {
    // when player is not host
    if (myPlayerId && room.players) {
      for (let i = 0; i < room.players.length; ++i) {
        if (room.players[i].id === myPlayerId) {
          return !room.players[i].isRoomHost;
        }
      }
    }
    return true;
  }, [myPlayerId, room]);

  const updateSetting = useCallback(
    (property: string, rawValue: any) => {
      const value = property === 'gameSpeed' ? Number.parseFloat(rawValue) : rawValue;

      roomDispatch({
        type: 'update_property',
        payload: {
          property,
          value,
        },
      });

      if (socketRef.current) {
        socketRef.current.emit('change_room_setting', property, value);
      }
    },
    [roomDispatch, socketRef],
  );

  const handleRoomNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    roomDispatch({
      type: 'update_property',
      payload: {
        property: 'roomName',
        value: event.target.value,
      },
    });
  };

  const handleRoomNameBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsNamedFocused(false);
    let name = event.currentTarget.value.trim();
    if (!name) {
      name = 'Untitled';
      roomDispatch({
        type: 'update_property',
        payload: {
          property: 'roomName',
          value: name,
        },
      });
    }
    if (socketRef.current) {
      socketRef.current.emit('change_room_setting', 'roomName', name);
    }
  };

  const handleTeamChange = (newTeam: number) => {
    setTeam(newTeam);
    if (socketRef.current) {
      socketRef.current.emit('set_team', newTeam);
    }
  };

  const handleOpenMapExplorer = () => {
    if (disabledUI) return;
    setOpenMapExplorer(true);
  };

  const handleCloseMapExplorer = () => {
    setOpenMapExplorer(false);
  };

  const handleMapSelect = (mapId: string) => {
    updateSetting('mapId', mapId);
    setOpenMapExplorer(false);
  };

  const clearRoomMap = () => {
    if (disabledUI) return;
    updateSetting('mapId', '');
  };

  const handleClickForceStart = () => {
    setForceStart((prev) => !prev);
    if (socketRef.current) {
      socketRef.current.emit('force_start');
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      snackStateDispatch({
        type: 'update',
        title: '',
        message: '已复制',
        status: 'success',
        duration: 2500,
      });
    } catch (error) {
      snackStateDispatch({
        type: 'update',
        title: '错误',
        message: '复制失败，请手动复制链接',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleChangeHost = (playerId: string, username: string) => {
    console.log(`change host to ${username}, id ${playerId}`);
    if (socketRef.current) {
      socketRef.current.emit('change_host', playerId);
    }
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    router.push('/');
  };

  const activePlayers = room.players.filter((player) => !player.spectating).length;
  const readyThreshold = forceStartOK[activePlayers];

  return (
    <>
      <Modal
        open={openMapExplorer}
        onClose={handleCloseMapExplorer}
        title="选择自定义地图"
        size="lg"
        footer={
          <button type="button" className="btn-secondary" onClick={handleCloseMapExplorer}>
            关闭
          </button>
        }
      >
        <div className="max-h-[70vh] overflow-hidden">
          <MapExplorer userId={myUserName} onSelect={handleMapSelect} />
        </div>
      </Modal>

      <section className="mx-auto w-full max-w-3xl space-y-6 px-2 md:px-0">
        <div className="card space-y-5 p-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLeaveRoom}
              className="icon-btn"
            >
              <ArrowLeftIcon />
            </button>

            <div className="flex-1">
              {isNameFocused && !disabledUI ? (
                <input
                  autoFocus
                  value={room.roomName}
                  onChange={handleRoomNameChange}
                  onBlur={handleRoomNameBlur}
                  maxLength={24}
                  className="w-full rounded-md border-2 border-border-main bg-white px-3 py-2 text-lg font-semibold text-text-primary shadow-sm focus:border-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/15"
                />
              ) : (
                <button
                  type="button"
                  className={clsx(
                    'w-full text-left text-xl font-semibold text-text-primary transition-colors',
                    disabledUI ? 'cursor-default text-text-muted' : 'hover:text-text-secondary',
                  )}
                  onClick={() => {
                    if (!disabledUI) setIsNamedFocused(true);
                  }}
                >
                  {room.roomName}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="icon-btn"
            >
              <ShareIcon />
            </button>
          </div>

          {disabledUI && (
            <p className="rounded-md border-2 border-border-main bg-bg-light px-3 py-2 text-sm text-text-muted">
              您不是房主，无法修改房间设置。
            </p>
          )}

          {room.mapName && (
            <div className="flex items-center justify-between gap-3 rounded-md border-2 border-border-subtle bg-bg-main px-3 py-2 text-sm">
              <Link
                href={`/maps/${room.mapId}`}
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-text-primary underline-offset-4 hover:underline"
              >
                地图：{room.mapName}
              </Link>
              {!disabledUI && (
                <button type="button" className="icon-btn" onClick={clearRoomMap}>
                  <CloseIcon />
                </button>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-2 border-b-2 border-border-subtle">
              {tabItems.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setTabIndex(index)}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium transition-all',
                    tabIndex === index
                      ? 'border-b-2 border-text-primary text-text-primary'
                      : 'border-b-2 border-transparent text-text-muted hover:text-text-primary',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5 pt-2">
            {tabIndex === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-text-muted">选择你的组队</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: MaxTeamNum }, (_, idx) => idx + 1).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleTeamChange(value)}
                      className={clsx(
                        'rounded-md border-2 px-3 py-1 text-sm font-medium transition-all',
                        team === value
                          ? 'border-text-primary bg-text-primary text-white shadow'
                          : 'border-border-main bg-white text-text-primary hover:border-text-primary hover:bg-bg-main',
                      )}
                    >
                      队伍 {value}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleTeamChange(MaxTeamNum + 1)}
                    className={clsx(
                      'rounded-md border-2 px-3 py-1 text-sm font-medium transition-all',
                      team === MaxTeamNum + 1
                        ? 'border-text-primary bg-text-primary text-white shadow'
                        : 'border-border-main bg-white text-text-primary hover:border-text-primary hover:bg-bg-main',
                    )}
                  >
                    观众
                  </button>
                </div>
              </div>
            )}

            {tabIndex === 1 && (
              <div className="space-y-4">
                <button
                  type="button"
                  className="btn-secondary w-full justify-center"
                  onClick={handleOpenMapExplorer}
                  disabled={disabledUI}
                >
                  选择自定义地图
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-text-primary">速度</span>
                  <div className="flex flex-wrap gap-2">
                    {SpeedOptions.map((value) => (
                      <button
                        key={value}
                        type="button"
                        disabled={disabledUI}
                        onClick={() => updateSetting('gameSpeed', value)}
                        className={clsx(
                          'rounded-md border-2 px-3 py-1 text-sm transition-all',
                          room.gameSpeed === value
                            ? 'border-text-primary bg-text-primary text-white shadow'
                            : 'border-border-main bg-white text-text-primary hover:border-text-primary hover:bg-bg-main',
                          disabledUI && 'cursor-not-allowed opacity-60',
                        )}
                      >
                        {value}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tabIndex === 2 && (
              <div className="space-y-4">
                <SliderBox
                  label="高度"
                  value={room.mapWidth}
                  min={10}
                  max={60}
                  step={1}
                  disabled={disabledUI}
                  handleChange={(_, value) => updateSetting('mapWidth', value)}
                />
                <SliderBox
                  label="宽度"
                  value={room.mapHeight}
                  min={10}
                  max={60}
                  step={1}
                  disabled={disabledUI}
                  handleChange={(_, value) => updateSetting('mapHeight', value)}
                />
              </div>
            )}

            {tabIndex === 3 && (
              <div className="space-y-3">
                <SliderBox
                  label="山丘"
                  value={room.mountain}
                  min={0}
                  max={100}
                  step={1}
                  icon={<span className="text-lg">🏔️</span>}
                  disabled={disabledUI}
                  handleChange={(_, value) => updateSetting('mountain', value)}
                />
                <SliderBox
                  label="城池"
                  value={room.city}
                  min={0}
                  max={100}
                  step={1}
                  icon={<span className="text-lg">🏙️</span>}
                  disabled={disabledUI}
                  handleChange={(_, value) => updateSetting('city', value)}
                />
                <SliderBox
                  label="沼泽"
                  value={room.swamp}
                  min={0}
                  max={100}
                  step={1}
                  icon={<span className="text-lg">🌊</span>}
                  disabled={disabledUI}
                  handleChange={(_, value) => updateSetting('swamp', value)}
                />
              </div>
            )}

            {tabIndex === 4 && (
              <div className="space-y-4">
                <SliderBox
                  label="玩家数量"
                  value={room.maxPlayers}
                  min={2}
                  max={12}
                  step={1}
                  marks={Array.from({ length: 11 }, (_, index) => ({
                    value: index + 2,
                    label: `${index + 2}`,
                  }))}
                  disabled={disabledUI}
                  handleChange={(_, value) => updateSetting('maxPlayers', value)}
                />
                <div className="flex flex-wrap gap-3">
                  <SwitchControl
                    label="战争迷雾"
                    checked={room.fogOfWar}
                    onChange={(value) => updateSetting('fogOfWar', value)}
                    disabled={disabledUI}
                  />
                  <SwitchControl
                    label="王位置可见"
                    checked={room.revealKing}
                    onChange={(value) => updateSetting('revealKing', value)}
                    disabled={disabledUI}
                  />
                  <SwitchControl
                    label="允许死亡观战"
                    checked={room.deathSpectator}
                    onChange={(value) => updateSetting('deathSpectator', value)}
                    disabled={disabledUI}
                  />
                  <SwitchControl
                    label="战国模式"
                    checked={room.warringStatesMode}
                    onChange={(value) => updateSetting('warringStatesMode', value)}
                    disabled={disabledUI}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <div className="flex items-center gap-2 text-text-primary">
            <UsersIcon className="h-5 w-5" />
            <h3 className="text-lg font-semibold">玩家列表</h3>
          </div>
          <PlayerTable
            myPlayerId={myPlayerId}
            players={room.players}
            handleChangeHost={handleChangeHost}
            disabled_ui={disabledUI}
            warringStatesMode={room.warringStatesMode}
          />
        </div>

        <button
          type="button"
          className={clsx(
            'flex w-full items-center justify-center gap-2 rounded-lg border-2 px-6 py-4 text-lg font-semibold transition-all',
            forceStart
              ? 'border-player-2 bg-player-2 text-white hover:bg-player-2-dark'
              : 'border-border-main bg-bg-light text-text-primary hover:border-text-primary hover:bg-bg-main',
            team === MaxTeamNum + 1 && 'cursor-not-allowed opacity-60',
          )}
          onClick={handleClickForceStart}
          disabled={team === MaxTeamNum + 1}
        >
          准备({room.forceStartNum}/{readyThreshold})
        </button>
      </section>
    </>
  );
};

export default GameSetting;
