import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
  useReducer,
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import clsx from 'classnames';

import {
  RewindIcon,
  PlayIcon,
  PauseIcon,
  FastForwardIcon,
} from '@/components/ui/icons';
import { mapDataReducer } from '@/context/GameReducer';
import CustomMapTile from '@/components/game/CustomMapTile';
import { ReplaySpeedOptions } from '@/lib/constants';
import {
  Position,
  LeaderBoardTable,
  Message,
  UserData,
  TileProp,
  TileType,
} from '@/lib/types';
import TurnsCount from './TurnsCount';
import LeaderBoard from './LeaderBoard';
import GameLoading from '@/components/GameLoading';
import GameRecord from '@/lib/game-record';
import ChatBox from '@/components/ChatBox';
import useMap from '@/hooks/useMap';

export default function GameReplay(props: any) {
  const [gameRecord, setGameRecord] = useState<GameRecord | null>(null);
  const [mapWidth, setMapWidth] = useState(10);
  const [mapHeight, setMapHeight] = useState(10);
  const [playSpeed, setPlaySpeed] = useState(4);
  const [turnsCount, setTurnsCount] = useState(1);
  const [maxTurn, setMaxTurn] = useState(1);
  const [leaderBoardData, setLeaderBoardData] =
    useState<LeaderBoardTable | null>(null);
  const [isPlay, setIsPlay] = useState(false);
  const [mapData, mapDataDispatch] = useReducer(mapDataReducer, [[]]);
  const [limitedView, setLimitedView] = useState<TileProp[][]>([[]]);
  const [checkedPlayers, setCheckedPlayers] = useState<UserData[]>([]);
  const [notFoundError, setNotFoundError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const intervalId = useRef<any>(undefined);
  const turnsCountRef = useRef(turnsCount);

  const {
    tileSize,
    position,
    mapRef,
    mapPixelWidth,
    mapPixelHeight,
    zoom,
    setZoom,
    handleZoomOption,
  } = useMap({ mapWidth, mapHeight });

  const router = useRouter();
  const params = useParams();
  const replayId = params.replayId as string;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      handleZoomOption(event.key);
      if (event.key === ' ') {
        setIsPlay((prev) => !prev);
      }
    },
    [handleZoomOption]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    async function fetchReplayData() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_API}/get_replay/${replayId}`
        );
        if (response.status === 404) {
          throw new Error('Replay not found');
        }
        const game_record = await response.json();
        // init
        setGameRecord(game_record);
        setMapHeight(game_record.mapHeight);
        setMapWidth(game_record.mapWidth);
        setMaxTurn(game_record.gameRecordTurns.length);

        mapDataDispatch({
          type: 'init',
          mapWidth: game_record.mapWidth,
          mapHeight: game_record.mapHeight,
        });

        const { turn, data, lead } = game_record.gameRecordTurns[0];
        mapDataDispatch({ type: 'update', mapDiff: data });
        setLeaderBoardData(lead);
        turnsCountRef.current = turn ?? 1;
      } catch (error) {
        console.error(error);
        setNotFoundError('Replay not found');
      }
    }

    fetchReplayData();
  }, [replayId]);

  useEffect(() => {
    if (!gameRecord) return;

    if (!turnsCountRef.current) {
      turnsCountRef.current = 1;
    }

    const updateTurn = () => {
      const nextTurn = turnsCountRef.current ?? 1;
      if (nextTurn > gameRecord.gameRecordTurns.length) {
        clearInterval(intervalId.current);
        intervalId.current = undefined;
        turnsCountRef.current = gameRecord.gameRecordTurns.length;
        setIsPlay(false);
        return;
      }
      const { data, lead } = gameRecord.gameRecordTurns[nextTurn - 1];
      mapDataDispatch({ type: 'update', mapDiff: data });
      setLeaderBoardData(lead);
      setTurnsCount(nextTurn);
      setMessages(
        gameRecord.messagesRecord.filter((message) => {
          if (message.turn) return message.turn <= nextTurn;
          return true;
        })
      );
      turnsCountRef.current = nextTurn + 1;
    };

    clearInterval(intervalId.current);
    intervalId.current = undefined;

    if (isPlay) {
      intervalId.current = setInterval(updateTurn, 500 / playSpeed);
    }

    return () => {
      clearInterval(intervalId.current);
      intervalId.current = undefined;
    };
  }, [
    gameRecord,
    isPlay,
    playSpeed,
    mapDataDispatch,
    setLeaderBoardData,
    setTurnsCount,
    setMessages,
    setIsPlay,
  ]);

  useEffect(() => {
    if (checkedPlayers && checkedPlayers.length > 0) {
      const directions = [
        [-1, -1],
        [0, -1],
        [1, -1],
        [-1, 0],
        [0, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
      ];
      let colors = checkedPlayers.map((player) => player.color);
      let tmp = Array.from(Array(mapWidth), () =>
        Array(mapHeight).fill([TileType.Fog, null, null])
      );
      for (let i = 0; i < mapWidth; ++i) {
        for (let j = 0; j < mapHeight; ++j) {
          if (
            mapData[i][j][0] === TileType.City ||
            mapData[i][j][0] === TileType.Mountain
          ) {
            tmp[i][j] = [TileType.Obstacle, null, null];
          }
        }
      }
      for (let i = 0; i < mapWidth; ++i) {
        for (let j = 0; j < mapHeight; ++j) {
          if (mapData[i][j][1] && colors.includes(mapData[i][j][1] as number)) {
            for (let dir of directions) {
              let new_x = i + dir[0];
              let new_y = j + dir[1];
              if (new_x < 0 || new_x >= mapWidth) continue;
              if (new_y < 0 || new_y >= mapHeight) continue;
              tmp[i + dir[0]][j + dir[1]] = mapData[i + dir[0]][j + dir[1]];
            }
          }
        }
      }
      setLimitedView(tmp);
    } else {
      setLimitedView(mapData);
    }
  }, [mapData, checkedPlayers, mapWidth, mapHeight]);

  const changeTurn = (current_turn: number) => {
    if (gameRecord) {
      if (current_turn >= maxTurn) current_turn = maxTurn;

      setIsPlay(false);
      clearInterval(intervalId.current);
      intervalId.current = undefined;

      setTurnsCount(current_turn);
      turnsCountRef.current = current_turn;

      setMessages(
        gameRecord.messagesRecord.filter((message) => {
          if (message.turn) return message.turn <= current_turn;
          else return true;
        })
      );

      mapDataDispatch({
        type: 'jump-to-turn',
        gameRecordTurns: gameRecord.gameRecordTurns,
        jumpToTurn: current_turn - 1,
      });

      const { lead } = gameRecord.gameRecordTurns[current_turn - 1];
      setLeaderBoardData(lead);
    }
  };

  const handleChangeTurn = (event: any) => {
    changeTurn(Number(event.target.value));
  };

  if (notFoundError) {
    return (
      <div className="menu-container mx-auto mt-20 max-w-md p-6 text-center">
        <p className="text-xl font-semibold text-white">{notFoundError}</p>
      </div>
    );
  }

  if (!gameRecord) {
    return (
      <div className="center-layout">
        <GameLoading />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="Game">
        <div className="menu-container absolute left-1/2 bottom-5 z-[1002] flex w-[90vw] max-w-xl -translate-x-1/2 flex-col items-center gap-3 border-2 border-border-main bg-[#212936]/95 px-4 py-3 shadow-lg md:bottom-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="icon-btn"
              title="上一回合"
              disabled={turnsCount === 1}
              onClick={() => changeTurn(turnsCount > 1 ? turnsCount - 1 : 1)}
            >
              <RewindIcon />
            </button>
            <button
              type="button"
              className="icon-btn"
              title={isPlay ? '暂停' : '播放'}
              onClick={() => setIsPlay(!isPlay)}
            >
              {isPlay ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              className="icon-btn"
              title="下一回合"
              disabled={turnsCount === maxTurn}
              onClick={() => changeTurn(turnsCount < maxTurn ? turnsCount + 1 : maxTurn)}
            >
              <FastForwardIcon />
            </button>
          </div>

          <input
            type="range"
            min={1}
            max={Math.max(1, maxTurn)}
            step={1}
            value={turnsCount}
            onChange={handleChangeTurn}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border-subtle accent-text-primary"
          />

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white">
            {ReplaySpeedOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={clsx(
                  'rounded-full border-2 px-3 py-1 transition-all',
                  playSpeed === value
                    ? 'border-text-primary bg-text-primary text-white shadow'
                    : 'border-white/30 bg-white/10 text-white hover:border-white/70',
                )}
                onClick={() => {
                  setIsPlay(false);
                  setPlaySpeed(value);
                }}
              >
                {value}x
              </button>
            ))}
          </div>
        </div>

        <TurnsCount
          count={turnsCount}
          handleReturnClick={() => {
            router.push('/');
          }}
        />

        <LeaderBoard
          leaderBoardTable={leaderBoardData}
          players={gameRecord.players}
          checkedPlayers={checkedPlayers}
          setCheckedPlayers={setCheckedPlayers}
        />

        <ChatBox socket={null} messages={messages} />

        <div
          ref={mapRef}
          tabIndex={0}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
            width: mapPixelHeight,
            height: mapPixelWidth,
          }}
        >
          {limitedView.map((tiles, x) => {
            return tiles.map((tile, y) => (
              <CustomMapTile
                key={`${x}/${y}`}
                zoom={zoom}
                size={tileSize}
                x={x}
                y={y}
                tile={[...tile, false, 0]}
              />
            ));
          })}
        </div>
      </div>
    </div>
  );
}
