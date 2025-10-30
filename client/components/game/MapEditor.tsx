// cSpell:ignore uuidv block-states
import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  useReducer,
} from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Position,
  TileType,
  CustomMapTileData,
  TileType2Image,
  CustomMapData,
} from '@/lib/types';
import CustomMapTile from '@/components/game/CustomMapTile';
import { AspectRatioIcon, InfoIcon, CloseIcon } from '@/components/ui/icons';
import { snackStateReducer } from '@/context/GameReducer';
import useMap from '@/hooks/useMap';
import MapExplorer from '@/components/game/MapExplorer';
import Loading from '@/components/Loading';
import PublishMapDialog from '@/components/PublishMapDialog';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import Toast from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import clsx from 'classnames';

const name2TileType: Record<string, TileType> = {
  king: TileType.King,
  city: TileType.City,
  plain: TileType.Plain,
  mountain: TileType.Mountain,
  swamp: TileType.Swamp,
};

function getNewMapData(): CustomMapTileData[][] {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => [TileType.Plain, null, 0, false, 0])
  );
}

function MapEditor({ editMode }: { editMode: boolean }) {
  const [mapWidth, setMapWidth] = useState<number>(10);
  const [mapHeight, setMapHeight] = useState<number>(10);
  const [username, setUsername] = useState<string>('');
  const [team, setTeam] = useState<number>(0);
  const [unitsCount, setUnitCount] = useState<number>(50);
  const [priority, setPriority] = useState<number>(0);
  const [mapData, setMapData] = useState<CustomMapTileData[][]>(
    getNewMapData()
  );
  const [selectedTileType, setSelectedTileType] = useState<TileType | null>(
    TileType.Plain
  );
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [mapName, setMapName] = useState('');
  const [mapDescription, setMapDescription] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [snackState, snackStateDispatch] = useReducer(snackStateReducer, {
    open: false,
    title: '',
    message: '',
    duration: 1000,
    status: 'error',
  });

  const [loading, setLoading] = useState(false);
  const [openMapExplorer, setOpenMapExplorer] = useState(false);
  const [openPublishDialog, setOpenPublishDialog] = useState(false);
  const [publishMapId, setPublishMapId] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const mapId = searchParams.get('mapId') as string;

  const {
    tileSize,
    position,
    mapRef,
    mapPixelWidth,
    mapPixelHeight,
    zoom,
    setZoom,
  } = useMap({
    mapWidth,
    mapHeight,
  });

  const handleOpenMapExplorer = () => {
    setOpenMapExplorer(true);
  };

  const handleCloseMapExplorer = () => {
    setOpenMapExplorer(false);
  };

  useEffect(() => {
    if (!editMode) return;
    let tmp: string | null = localStorage.getItem('username');
    if (!tmp) {
      setUsername('anonymous');
    } else {
      setUsername(tmp);
    }
    const mapDraft = localStorage.getItem('mapDraft');
    if (mapDraft) {
      const customMapData: CustomMapData = JSON.parse(mapDraft);
      setMapData(customMapData.mapTilesData);
      setMapWidth(customMapData.width);
      setMapHeight(customMapData.height);
      setMapName(customMapData.name);
      setMapDescription(customMapData.description);
    }
  }, [editMode]);

  const getMapDataFromServer = useCallback((custom_mapId: string) => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_SERVER_API}/maps/${custom_mapId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        return response.json();
      })
      .then((responseData) => {
        console.log(responseData);
        const customMapData: CustomMapData = responseData;
        setMapData(customMapData.mapTilesData);
        setMapWidth(customMapData.width);
        setMapHeight(customMapData.height);
        setMapName(customMapData.name);
        setMapDescription(customMapData.description);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (editMode) return;
    getMapDataFromServer(mapId);
  }, [mapId, editMode, getMapDataFromServer]);

  const handleMapSelect = (mapId: string) => {
    getMapDataFromServer(mapId);
    setOpenMapExplorer(false);
  };

  const property2var: Record<string, any> = {
    team: team,
    unitsCount: unitsCount,
    priority: priority,
    revealed: '',
  };

  const property2min: Record<string, any> = {
    team: 0,
    unitsCount: -9999,
    priority: 0,
    revealed: '',
  };

  const property2max: Record<string, any> = {
    team: 100,
    unitsCount: 9999,
    priority: 100,
    revealed: '',
  };

  const checkSetUnitCount = (value: number) => {
    if (value < property2min.unitsCount) {
      setUnitCount(property2min.unitsCount);
    } else if (value > property2max.unitsCount) {
      setUnitCount(property2max.unitsCount);
    } else {
      setUnitCount(value);
    }
  };
  const checkSetTeam = (value: number) => {
    if (value < property2min.team) {
      setTeam(property2min.team);
    } else if (value > property2max.team) {
      setTeam(property2max.team);
    } else {
      setTeam(value);
    }
  };

  const checkSetPriority = (value: number) => {
    if (value < property2min.priority) {
      setPriority(property2min.priority);
    } else if (value > property2max.priority) {
      setPriority(property2max.priority);
    } else {
      setPriority(value);
    }
  };

  const property2setVar: Record<string, any> = {
    team: checkSetTeam,
    unitsCount: checkSetUnitCount,
    priority: checkSetPriority,
  };

  const handleMapWidthChange = (event: any) => {
    let value = Number(event.target.value);

    if (value < 2) value = 2;
    if (value > 50) value = 50;

    setMapWidth(value);
    const newMapData = [...mapData];
    if (value > mapWidth) {
      for (let i = 0; i < value - mapWidth; ++i) {
        newMapData.push(
          Array.from({ length: mapHeight }, () => [
            TileType.Plain,
            null,
            0,
            false,
            0,
          ])
        );
      }
    } else {
      newMapData.splice(value, mapWidth - value);
    }
    setMapData(newMapData);
  };

  const handleMapHeightChange = (event: any) => {
    let value = Number(event.target.value);

    if (value < 2) value = 2;
    if (value > 50) value = 50;

    setMapHeight(value);
    const newMapData = [...mapData];
    if (value > mapHeight) {
      for (let i = 0; i < mapWidth; ++i) {
        for (let j = 0; j < value - mapHeight; ++j) {
          newMapData[i].push([TileType.Plain, null, 0, false, 0]);
        }
      }
    } else {
      for (let i = 0; i < mapWidth; ++i) {
        newMapData[i].splice(value, mapHeight - value);
      }
    }
    setMapData(newMapData);
  };

  const handleTileClick = (x: number, y: number) => {
    console.log('handleTileClick', x, y, selectedTileType, selectedProperty);
    const newMapData = [...mapData];

    if (selectedTileType !== null) {
      if (newMapData[x][y][0] === selectedTileType) {
        newMapData[x][y] = [TileType.Plain, null, 0, false, 0];
      } else {
        switch (+selectedTileType) {
          case TileType.King:
            newMapData[x][y] = [selectedTileType, 1, 0, false, 0];
            break;
          case TileType.City:
            newMapData[x][y] = [selectedTileType, null, 40, false, 0];
            break;
          case TileType.Plain:
          case TileType.Mountain:
          case TileType.Swamp:
            newMapData[x][y] = [selectedTileType, null, 0, false, 0];
            break;
          default:
            console.log('Error! no match TileType', selectedTileType);
        }
      }
    }

    if (selectedProperty !== null) {
      switch (selectedProperty) {
        case 'team':
          newMapData[x][y][1] = property2var[selectedProperty] as number;
          break;
        case 'unitsCount':
          newMapData[x][y][2] = property2var[selectedProperty] as number;
          break;
        case 'revealed':
          newMapData[x][y][3] = !newMapData[x][y][3];
          break;
        case 'priority': // todo
          newMapData[x][y][4] = property2var[selectedProperty] as number;
          break;
      }
    }

    setMapData(newMapData);
  };

  const generateCustomMapData = () => {
    // make sure mapName is not empty
    if (mapName === '') {
      snackStateDispatch({
        type: 'update',
        title: 'Error',
        message: '地图名称不能为空',
        duration: null,
      });
      return;
    }

    let customMapData: CustomMapData = {
      id: uuidv4(),
      name: mapName,
      width: mapWidth,
      height: mapHeight,
      creator: username,
      description: mapDescription,
      mapTilesData: mapData,
    };
    return customMapData;
  };

  const handleSaveDraft = () => {
    // Save draft to local storage
    setDraftSaved(true);
    const customMapData = generateCustomMapData();
    if (customMapData)
      localStorage.setItem('mapDraft', JSON.stringify(customMapData));
  };

  const handlePublish = async () => {
    const customMapData = generateCustomMapData();
    if (!customMapData) return;

    snackStateDispatch({
      type: 'update',
      title: 'info',
      message: 'Map publishing... Please wait',
      status: 'info',
      duration: 5000,
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_API}/maps`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customMapData),
        }
      );

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      await response.json();

      setPublishMapId(customMapData.id);
      setOpenPublishDialog(true);
    } catch (error) {
      console.error('Error:', error);

      // Dispatch error snack
      snackStateDispatch({
        type: 'update',
        title: 'Error',
        message: 'Failed to publish map',
        duration: 5000,
      });
    }
  };

  const handleUploadMap = () => {
    // user can upload a json file contain map data
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result as string;
        try {
          const customMapData: CustomMapData = JSON.parse(result);

          setMapData(customMapData.mapTilesData);
          setMapWidth(customMapData.width);
          setMapHeight(customMapData.height);
          setMapName(customMapData.name);
          setMapDescription(customMapData.description);
        } catch (error) {
          snackStateDispatch({
            type: 'update',
            title: 'Error',
            message: '解析 JSON 文件时出错',
            duration: 5000,
          });
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  const handleDownloadMap = () => {
    // download MapData as json
    const customMapData = generateCustomMapData();
    if (!customMapData) return;
    // Create a blob from the JSON string
    const blob = new Blob([JSON.stringify(customMapData, null, 2)], {
      type: 'application/json',
    });

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `block-states_custom_map_${username}_${mapName}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Quick select different type of tiles
    switch (event.key) {
      case 'k': // king
      case 'g': // general
        setSelectedTileType(TileType.King);
        setSelectedProperty(null);
        break;
      case 'c': // city
        setSelectedTileType(TileType.City);
        setSelectedProperty(null);
        break;
      case 'p': // plain
        setSelectedTileType(TileType.Plain);
        setSelectedProperty(null);
        break;
      case 'm': // mountain
        setSelectedTileType(TileType.Mountain);
        setSelectedProperty(null);
        break;
      case 's': // swamp
        setSelectedTileType(TileType.Swamp);
        setSelectedProperty(null);
        break;
      case 'r': // revealed
        setSelectedTileType(null);
        setSelectedProperty('revealed');
        break;
      case 't': // team
        setSelectedTileType(null);
        setSelectedProperty('team');
        break;
      case 'u': // unitsCount
        setSelectedTileType(null);
        setSelectedProperty('unitsCount');
        break;
      case 'o': // priority
        setSelectedTileType(null);
        setSelectedProperty('priority');
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (!editMode) return;
    const mapNode = mapRef.current;
    if (mapNode) {
      mapNode.addEventListener('keydown', handleKeyDown);
      return () => {
        mapNode.removeEventListener('keydown', handleKeyDown);
      };
    }
    return () => { };
  }, [mapRef, editMode, handleKeyDown]);

  return (
    <div className="app-container relative overflow-hidden">
      <Toast
        open={snackState.open}
        title={snackState.title}
        message={snackState.message}
        type={snackState.status}
        duration={snackState.duration ?? undefined}
        onClose={() => snackStateDispatch({ type: 'toggle', duration: null })}
      />

      {!editMode && <Loading open={loading} title="加载地图中" />}

      <PublishMapDialog
        open={openPublishDialog}
        onClose={() => setOpenPublishDialog(false)}
        mapId={publishMapId}
      />

      <Modal
        open={openMapExplorer}
        onClose={handleCloseMapExplorer}
        title="选择地图"
        size="lg"
        footer={
          <button type="button" className="btn-secondary" onClick={handleCloseMapExplorer}>
            关闭
          </button>
        }
      >
        <div className="max-h-[70vh] overflow-hidden">
          <MapExplorer userId={username} onSelect={handleMapSelect} />
        </div>
      </Modal>

      {editMode && (
        <aside className="menu-container absolute right-0 top-[70px] bottom-[70px] flex w-72 flex-col gap-4 overflow-y-auto bg-[#394150] p-4">
          <button
            type="button"
            className="btn-secondary w-full justify-center"
            onClick={handleOpenMapExplorer}
          >
            选择自定义地图
          </button>

          <div className="space-y-3 rounded-2xl border-2 border-border-main bg-white/95 p-4 text-sm text-text-muted">
            <div className="flex items-center gap-2 text-text-primary">
              <InfoIcon className="h-5 w-5" />
              <h3 className="text-base font-semibold">基础信息</h3>
            </div>
            <label className="flex flex-col gap-1 text-xs font-medium text-text-muted">
              地图名称
              <input
                id="map-name"
                className="input w-full"
                value={mapName}
                onChange={(event) => setMapName(event.target.value)}
                maxLength={40}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-text-muted">
              地图简介
              <textarea
                id="map-desc"
                className="input w-full min-h-[96px] resize-y"
                value={mapDescription}
                onChange={(event) => setMapDescription(event.target.value)}
              />
            </label>
          </div>

          <div className="space-y-3 rounded-2xl border-2 border-border-main bg-white/95 p-4 text-sm text-text-muted">
            <div className="flex items-center gap-2 text-text-primary">
              <AspectRatioIcon className="h-5 w-5" />
              <h3 className="text-base font-semibold">地图大小</h3>
            </div>
            <label className="flex flex-col gap-1 text-xs font-medium text-text-muted">
              宽度
              <input
                id="map-width"
                type="number"
                className="input w-full"
                value={mapWidth}
                onChange={handleMapWidthChange}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-text-muted">
              高度
              <input
                id="map-height"
                type="number"
                className="input w-full"
                value={mapHeight}
                onChange={handleMapHeightChange}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <button type="button" className="btn-secondary justify-center" onClick={handleDownloadMap}>
              下载文件
            </button>
            <button type="button" className="btn-secondary justify-center" onClick={handleUploadMap}>
              上传文件
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <button type="button" className="btn-secondary justify-center" onClick={handleSaveDraft}>
              {draftSaved ? '草稿已保存' : '保存草稿'}
            </button>
            <button type="button" className="btn-primary justify-center" onClick={handlePublish}>
              发布
            </button>
          </div>
        </aside>
      )}

      {editMode && (
        <aside className="menu-container absolute left-0 top-[70px] bottom-[70px] flex w-28 flex-col overflow-y-auto bg-[#394150] p-2">
          <div className="flex flex-col gap-2">
            {Object.keys(name2TileType).map((tileName) => {
              const isActive = selectedTileType === name2TileType[tileName];
              return (
                <button
                  key={tileName}
                  type="button"
                  onClick={() => {
                    setSelectedTileType(name2TileType[tileName]);
                    setSelectedProperty(null);
                  }}
                  className={clsx(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-xs font-semibold text-white transition',
                    isActive
                      ? 'border-player-2 bg-player-2 text-white shadow'
                      : 'border-transparent bg-transparent hover:border-player-2',
                  )}
                >
                  {tileName === 'plain' ? (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded border border-black bg-gray-500" />
                  ) : (
                    <Image
                      src={TileType2Image[name2TileType[tileName]]}
                      alt={tileName}
                      width={40}
                      height={40}
                      draggable={false}
                    />
                  )}
                  <span className="text-xs">
                    {tileName === 'king'
                      ? '王'
                      : tileName === 'city'
                        ? '城池'
                        : tileName === 'plain'
                          ? '平原'
                          : tileName === 'mountain'
                            ? '山丘'
                            : tileName === 'swamp'
                              ? '沼泽'
                              : tileName}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {Object.keys(property2var).map((property) => {
              const isActive = selectedProperty === property;
              const isToggle = property === 'revealed';
              const label =
                property === 'team'
                  ? '团队'
                  : property === 'unitsCount'
                    ? '兵数'
                    : property === 'priority'
                      ? '优先级'
                      : property === 'revealed'
                        ? '全局可见'
                        : property;

              return (
                <div
                  key={property}
                  onClick={() => {
                    setSelectedProperty(property);
                    setSelectedTileType(null);
                  }}
                  className={clsx(
                    'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-3 text-xs font-semibold text-white transition',
                    isActive
                      ? 'border-player-2 bg-player-2 shadow'
                      : 'border-transparent bg-transparent hover:border-player-2',
                  )}
                >
                  {isToggle ? (
                    <span className="text-lg">💡</span>
                  ) : (
                    <input
                      id={property}
                      type="number"
                      className="w-16 rounded border border-white/40 bg-white/10 p-1 text-center text-sm text-white focus:border-white focus:outline-none"
                      value={property2var[property] ?? ''}
                      min={property2min[property]}
                      max={property2max[property]}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => property2setVar[property](+event.target.value)}
                    />
                  )}
                  <span>{label}</span>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setMapData(getNewMapData())}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-red-400 bg-red-500/30 p-3 text-xs font-semibold text-red-100 transition hover:border-red-300"
            >
              <CloseIcon className="h-5 w-5" />
              清除全部
            </button>
          </div>
        </aside>
      )}

      {!editMode && (
        <div className="menu-container absolute bottom-0 left-1/2 z-[101] w-[90vw] max-w-3xl -translate-x-1/2 rounded-t-3xl bg-[#212936]/95 p-5 text-white md:w-[55vw] lg:w-[45vw]">
          <h2 className="text-xl font-semibold">{mapName}</h2>
          <ReactMarkdown className="react_markdown mt-3">{mapDescription}</ReactMarkdown>
          <button
            type="button"
            className="btn-primary mt-4 w-full justify-center"
            onClick={handleDownloadMap}
          >
            下载文件
          </button>
        </div>
      )}

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
          backgroundColor: '#495468',
        }}
      >
        {mapData.map((tiles, x) => {
          return tiles.map((tile, y) => {
            return (
              <CustomMapTile
                key={`${x}/${y}`}
                zoom={zoom}
                size={tileSize}
                x={x}
                y={y}
                tile={tile}
                handleClick={editMode ? () => handleTileClick(x, y) : () => { }}
              />
            );
          });
        })}
      </div>
    </div >
  );
}

export default MapEditor;
