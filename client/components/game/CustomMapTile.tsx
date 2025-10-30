import React, { useMemo } from 'react';
import Image from 'next/image';
import {
  TileType,
  DisplayCustomMapTileData,
  TileType2Image,
} from '@/lib/types';
import { ColorArr } from '@/lib/constants';
import {
  defaultBgcolor,
  notRevealedFill,
  notOwnedArmyFill,
  notOwnedCityFill,
  MountainFill,
  blankFill,
} from '@/lib/constants';

interface CustomMapTileProps {
  zoom: number;
  size: number;
  tile: DisplayCustomMapTileData;
  x: number;
  y: number;
  handleClick?: any;
  imageZoom?: number;
  fontSize?: number;
}

export default React.memo(function CustomMapTile(props: CustomMapTileProps) {
  const {
    zoom,
    size,
    x,
    y,
    tile,
    imageZoom = 0.8,
    fontSize = 16,
    handleClick,
  } = props;

  const [tileType, color, unitsCount, isAlwaysRevealed, priority] = tile;
  const image = TileType2Image[tileType];

  const zoomedSize = useMemo(() => size * zoom, [size, zoom]);
  const zoomedFontSize = useMemo(() => fontSize * zoom, [fontSize, zoom]);
  const tileX = useMemo(() => zoomedSize * y, [zoomedSize, y]);
  const tileY = useMemo(() => zoomedSize * x, [zoomedSize, x]);

  const zoomedImageSize = useMemo(
    () => zoomedSize * imageZoom,
    [zoomedSize, imageZoom]
  );

  const imageXY = useMemo(
    () => (zoomedSize - zoomedImageSize) / 2,
    [zoomedSize, zoomedImageSize]
  );

  const bgcolor = useMemo(() => {
    //
    if (tileType === TileType.Fog || tileType === TileType.Obstacle) {
      return notRevealedFill;
    }

    // 山
    if (tileType === TileType.Mountain) {
      return MountainFill;
    }

    // 玩家单位
    if (color !== null) {
      return ColorArr[color];
    }
    // 中立单位
    if (color === null) {
      if (tileType === TileType.City) {
        return notOwnedCityFill;
      }
      if (unitsCount) {
        return notOwnedArmyFill;
      }
      if (tileType === TileType.Swamp) {
        return notOwnedArmyFill;
      }
    }

    // 空白单位
    return blankFill;
  }, [tileType, color, unitsCount]);

  return (
    <div
      style={{
        position: 'absolute',
        left: tileX,
        top: tileY,
        width: zoomedSize,
        height: zoomedSize,
        backgroundColor: defaultBgcolor,
      }}
      onClick={handleClick}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: zoomedSize,
          height: zoomedSize,
          backgroundColor: bgcolor,
          border: '#000 solid 1px',
        }}
      />
      {image && (
        <Image
          src={image}
          width={zoomedImageSize}
          height={zoomedImageSize}
          style={{
            position: 'absolute',
            left: imageXY,
            top: imageXY,
            opacity: 0.8,
          }}
          alt={`tile-${x}-${y}`}
          draggable={false}
        />
      )}
      {unitsCount && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: zoomedSize,
            height: zoomedSize,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: zoomedFontSize,
            color: '#fff',
            textOverflow: 'ellipsis',
            overflow: 'visible',
            textShadow: '0 0 2px #000',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          ref={(node) => {
            if (node) {
              node.style.setProperty("user-select", "none", "important");
            }
          }}
        >
          {unitsCount}
        </div>
      )}

      {isAlwaysRevealed && (
        <div
          style={{
            position: 'absolute',
            top: zoomedSize * 0.08,
            right: zoomedSize * 0.08,
            width: zoomedSize * 0.45,
            height: zoomedSize * 0.45,
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            border: '2px solid rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            style={{
              width: '70%',
              height: '70%',
              fill: '#f39c12',
            }}
          >
            <path d="M9 21h6v-1H9v1zm3-20C7.82 1 5 3.82 5 7c0 2.38 1.19 3.08 2.25 4.5.45.61.75 1.28.75 2h8c0-.72.3-1.39.75-2C17.81 10.08 19 9.38 19 7c0-3.18-2.82-6-7-6zm0 2c2.75 0 5 2.25 5 5 0 1.56-.78 2.22-1.72 3.45-.45.6-.81 1.31-.98 2.07H9.7c-.17-.76-.53-1.47-.98-2.07C7.78 10.22 7 9.56 7 8c0-2.75 2.25-5 5-5z" />
          </svg>
        </div>
      )}
    </div>
  );
});
