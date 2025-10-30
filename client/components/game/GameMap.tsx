import { useGame, useGameDispatch } from '@/context/GameContext';
import useMap from '@/hooks/useMap';
import { Position, SelectedMapTileInfo, TileProp, TileType } from '@/lib/types';
import usePossibleNextMapPositions from '@/lib/use-possible-next-map-positions';
import { getPlayerIndex } from '@/lib/utils';
import {
  ZoomInIcon,
  ZoomOutIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  HomeIcon,
  UndoIcon,
} from '@/components/ui/icons';
import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useMediaQuery from '@/hooks/useMediaQuery';
import MapTile from './MapTile';
function GameMap() {
  const {
    attackQueueRef,
    socketRef,
    room,
    mapData,
    myPlayerId,
    mapQueueData,
    selectedMapTileInfo,
    initGameInfo,
    turnsCount,
  } = useGame();

  const isSmallScreen = useMediaQuery('(max-width:600px)');

  const touchAttacking = useRef(false);
  const lastTouchPosition = useRef({ x: -1, y: -1 });

  const touchDragging = useRef(false);
  const touchStartPosition = useRef({ x: 0, y: 0 });
  const initialDistance = useRef(0);
  const lastTouchTime = useRef(0);
  const touchHalf = useRef(false);
  const [showDirections, setShowDirections] = useState(false);

  const toggleDirections = () => {
    setShowDirections(!showDirections);
  };

  const { setSelectedMapTileInfo, halfArmy, clearQueue, popQueue, selectGeneral,

    handlePositionChange, testIfNextPossibleMove,
    handleClick,
    attackUp, attackDown, attackLeft, attackRight } = useGameDispatch();

  const {
    tileSize,
    position,
    mapRef,
    mapPixelWidth,
    mapPixelHeight,
    zoom,
    setZoom,
    handleZoomOption,
    setPosition,
  } = useMap({
    mapWidth: initGameInfo ? initGameInfo.mapWidth : 0,
    mapHeight: initGameInfo ? initGameInfo.mapHeight : 0,
    listenTouch: false, // implement touch later
  });

  const centerGeneral = useCallback(() => {
    if (initGameInfo) {
      const { king } = initGameInfo;
      const pixel_x = Math.floor(mapPixelWidth / 2 - king.x * zoom * tileSize);
      const pixel_y = Math.floor(mapPixelHeight / 2 - king.y * zoom * tileSize);
      setPosition({ x: pixel_y, y: pixel_x });
    }
  }, [
    initGameInfo,
    mapPixelHeight,
    mapPixelWidth,
    zoom,
    tileSize,
    setPosition,
  ]);

  // useEffect(() => {
  //   if (isSmallScreen) {
  //     centerGeneral();
  //   }
  // }, [isSmallScreen, centerGeneral]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      handleZoomOption(event.key);
      switch (event.key) {
        case 'z':
          halfArmy(touchHalf);
          break;
        case 'e':
          popQueue();
          break;
        case 'q':
          clearQueue();
          break;
        case 'g':
          selectGeneral();
          break;
        case 'c':
          setPosition({ x: 0, y: 0 });
          break;
        case 'h': // home
          centerGeneral();
          break;
        case 'a':
        case 'ArrowLeft': // 37 Left
          event.preventDefault();
          attackLeft(selectedMapTileInfo);
          break;
        case 'w':
        case 'ArrowUp': // 38 Up
          event.preventDefault();
          attackUp(selectedMapTileInfo);
          break;
        case 'd':
        case 'ArrowRight': // 39 Right
          event.preventDefault();
          attackRight(selectedMapTileInfo);
          break;
        case 's':
        case 'ArrowDown': // 40 Down
          event.preventDefault();
          attackDown(selectedMapTileInfo);
          break;
      }
    },
    [attackDown, attackLeft, attackRight, attackUp, centerGeneral, clearQueue, halfArmy, handleZoomOption, popQueue, selectGeneral, selectedMapTileInfo, setPosition]
  );

  const myPlayerIndex = useMemo(() => {
    return getPlayerIndex(room, myPlayerId);
  }, [room, myPlayerId]);

  const queueEmpty = mapQueueData.length === 0;

  let displayMapData = mapData.map((tiles, x) => {
    return tiles.map((tile, y) => {
      const [, color] = tile;
      const isOwned = color === room.players[myPlayerIndex].color;
      const _className = queueEmpty ? '' : mapQueueData[x][y].className;

      let tileHalf = false;

      const getIsSelected = () => {
        if (!selectedMapTileInfo) {
          return false;
        }

        if (selectedMapTileInfo.x === x && selectedMapTileInfo.y === y) {
          tileHalf = selectedMapTileInfo.half;
        } else if (mapQueueData.length !== 0 && mapQueueData[x][y].half) {
          tileHalf = true;
        } else {
          tileHalf = false;
        }
        const isSelected = x === selectedMapTileInfo.x && y === selectedMapTileInfo.y;
        return isSelected;
      }
      const isSelected = getIsSelected();

      return {
        tile,
        isOwned,
        _className,
        tileHalf,
        isSelected,
      };
    });
  });

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();

      if (event.touches.length === 1) {
        // touch drag or touch attack
        if (mapRef.current) {
          const touch = event.touches[0];
          const rect = mapRef.current.getBoundingClientRect();
          const y = Math.floor((touch.clientX - rect.left) / (tileSize * zoom));
          const x = Math.floor((touch.clientY - rect.top) / (tileSize * zoom));
          const [tileType, color] = mapData[x][y];
          const isOwned = color === room.players[myPlayerIndex].color;
          const currentTime = new Date().getTime();
          if (!isOwned) {
            touchDragging.current = true;
            touchStartPosition.current = {
              x: event.touches[0].clientX - position.x,
              y: event.touches[0].clientY - position.y,
            };
            // console.log('touch drag at ', x, y);
          } else {
            touchAttacking.current = true;
            if (
              lastTouchPosition.current.x === x &&
              lastTouchPosition.current.y === y &&
              currentTime - lastTouchTime.current <= 400 // quick double touch 400ms
            ) {
              touchHalf.current = !touchHalf.current;
            }
            setSelectedMapTileInfo({
              x,
              y,
              half: touchHalf.current,
              unitsCount: 0,
            });
            lastTouchPosition.current = { x, y };
            lastTouchTime.current = currentTime;
          }
        }
      } else if (event.touches.length === 2) {
        // zoom
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch1.clientX - touch2.clientX, 2) +
          Math.pow(touch1.clientY - touch2.clientY, 2)
        );
        initialDistance.current = distance;
      }
    },
    [mapRef, tileSize, zoom, mapData, room.players, myPlayerIndex, position.x, position.y, setSelectedMapTileInfo]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();

      if (event.touches.length === 1) {
        if (touchDragging.current) {
          const updatePosition = () => {
            setPosition({
              x: event.touches[0].clientX - touchStartPosition.current.x,
              y: event.touches[0].clientY - touchStartPosition.current.y,
            });
          };
          requestAnimationFrame(updatePosition);
        }

        if (touchAttacking.current && mapRef.current) {
          const touch = event.touches[0];
          const rect = mapRef.current.getBoundingClientRect();
          const y = Math.floor((touch.clientX - rect.left) / (tileSize * zoom));
          const x = Math.floor((touch.clientY - rect.top) / (tileSize * zoom));

          const dx = x - selectedMapTileInfo.x;
          const dy = y - selectedMapTileInfo.y;
          // check if newPosition is valid
          if (
            (dx === 0 && dy === 0) ||
            (x === lastTouchPosition.current.x &&
              y === lastTouchPosition.current.y)
          ) {
            return;
          }
          if (!mapData) return;
          if (mapData.length === 0) return;
          const [tileType, color] = mapData[x][y];
          // check tileType
          if (
            tileType === TileType.Mountain ||
            tileType === TileType.Obstacle
          ) {
            return;
          }
          // check neighbor
          let direction = '';
          if (dy === 1 && dx === 0) {
            direction = 'right';
          } else if (dy === -1 && dx === 0) {
            direction = 'left';
          } else if (dy === 0 && dx === 1) {
            direction = 'down';
          } else if (dy === 0 && dx === -1) {
            direction = 'up';
          } else {
            // not valid move
            touchAttacking.current = false;
            return;
          }
          // console.log('valid touch move attack', x, y, className);
          touchHalf.current = false;
          const newPoint = { x, y };
          handlePositionChange(selectedMapTileInfo, newPoint, `queue_${direction}`);
          lastTouchPosition.current = newPoint;
        }
      } else if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch1.clientX - touch2.clientX, 2) +
          Math.pow(touch1.clientY - touch2.clientY, 2)
        );
        const delta = distance - initialDistance.current;
        const newZoom = Math.min(Math.max(zoom + delta * 0.0002, 0.2), 4.0);
        setZoom(newZoom);
      }
    },
    [mapRef, setPosition, tileSize, zoom, selectedMapTileInfo, mapData, handlePositionChange, setZoom]
  );

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    touchAttacking.current = false;
    touchDragging.current = false;
  }, []);

  useEffect(() => {
    const mapNode = mapRef.current;
    if (mapNode) {
      mapNode.addEventListener('keydown', handleKeyDown);
      return () => {
        mapNode.removeEventListener('keydown', handleKeyDown);
      };
    }
    return () => { };
  }, [handleKeyDown, mapRef]);

  useEffect(() => {
    const mapNode = mapRef.current;
    if (mapNode) {
      mapNode.focus(); // 只在地图初始化的时候自动 focus 一次
    }
    return () => { };
  }, [mapRef]);

  useEffect(() => {
    const mapNode = mapRef.current;
    if (mapNode) {
      mapNode.addEventListener('touchstart', handleTouchStart, {
        passive: false,
      });
      mapNode.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      mapNode.addEventListener('touchend', handleTouchEnd);
      return () => {
        mapNode.removeEventListener('touchstart', handleTouchStart);
        mapNode.removeEventListener('touchmove', handleTouchMove);
        mapNode.removeEventListener('touchend', handleTouchEnd);
      };
    }
    return () => { };
  }, [mapRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div>
      <div
        ref={mapRef}
        tabIndex={0}
        onBlur={() => {
          // TODO: inifite re-render loop. 
          // when surrender or game over dialog is shown. onBlur will execute, it set SelectedMapTile so a re-render is triggered. in the next render, onBlur execute again
          // setSelectedMapTileInfo({ x: -1, y: -1, half: false, unitsCount: 0 });
        }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
          width: mapPixelHeight, // game's width and height are swapped
          height: mapPixelWidth,
        }}
      >
        {/* map key (x,y) example */}
        {/* 0,0 / 0, 1 */}
        {/* 1,0 / 1, 1 */}
        {displayMapData.map((tiles, x) => {
          return tiles.map((tile, y) => {
            return (
              <div key={`${x}/${y}`}
                onClick={() => handleClick(tile.tile, x, y, myPlayerIndex)}>
                <MapTile
                  isNextPossibleMove={testIfNextPossibleMove(tile.tile[0], x, y)}
                  zoom={zoom}
                  size={tileSize}
                  x={x}
                  y={y}
                  {...tile}
                  warringStatesMode={room.warringStatesMode} />
              </div>
            );
          });
        })}
      </div>
      {isSmallScreen && (
        <div className="menu-container absolute left-1 bottom-16 z-[1000] flex flex-col items-center gap-2 p-1 shadow-lg md:bottom-20">
          <button type="button" className="icon-btn" title="聚焦将军" onClick={centerGeneral}>
            <HomeIcon />
          </button>
          <button type="button" className="icon-btn" title="撤销移动" onClick={popQueue}>
            <UndoIcon />
          </button>
          <button type="button" className="icon-btn" title="清除队列中的移动" onClick={clearQueue}>
            <CloseIcon />
          </button>
          <button type="button" className="icon-btn" title="切换 50%" onClick={() => halfArmy(touchHalf)}>
            <span className="text-xs font-semibold text-text-primary">50%</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            title="缩小"
            onClick={() => {
              setZoom((z) => z - 0.2);
            }}
          >
            <ZoomInIcon />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="放大"
            onClick={() => {
              setZoom((z) => z + 0.2);
            }}
          >
            <ZoomOutIcon />
          </button>
          <button type="button" className="icon-btn" title="展开 WSAD" onClick={toggleDirections}>
            {showDirections ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </button>
        </div>
      )}
      {showDirections && (
        <div className="absolute right-2 bottom-16 z-[1000] flex flex-col items-center gap-2 p-1 md:bottom-20">
          <button
            type="button"
            className="attack-button text-white"
            onClick={() => attackUp(selectedMapTileInfo)}
            title="向上进攻"
          >
            <ArrowUpIcon />
          </button>
          <div className="flex w-[40vw] items-center justify-between md:w-[20vw]">
            <button
              type="button"
              className="attack-button text-white"
              onClick={() => attackLeft(selectedMapTileInfo)}
              title="向左进攻"
            >
              <ArrowLeftIcon />
            </button>
            <button
              type="button"
              className="attack-button text-white"
              onClick={() => attackRight(selectedMapTileInfo)}
              title="向右进攻"
            >
              <ArrowRightIcon />
            </button>
          </div>
          <button
            type="button"
            className="attack-button text-white"
            onClick={() => attackDown(selectedMapTileInfo)}
            title="向下进攻"
          >
            <ArrowDownIcon />
          </button>
        </div>
      )}
    </div>
  );
}

export default GameMap;
