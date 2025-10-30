import { useEffect, useCallback, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'classnames';

import {
  StarSolidIcon,
  StarIcon,
  EyeIcon,
  AspectRatioIcon,
  SearchIcon,
} from '@/components/ui/icons';
import { CustomMapInfo } from '@/lib/types';

interface ListItemProps {
  map: CustomMapInfo;
  handleStarClick: any;
  onSelect: any;
  starred: boolean;
}

const ListItem = memo<ListItemProps>(function MemoItems(props) {
  const { map, handleStarClick, onSelect, starred } = props;
  const router = useRouter();
  return (
    <article className="rounded-xl border-2 border-border-main bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{map.name}</h3>
          <p className="text-xs text-text-muted">
            创建者 {map.creator} · {new Date(map.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleStarClick(map.id)}
          className={clsx(
            'inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-sm font-medium transition-all',
            starred
              ? 'border-player-4 bg-player-4 text-white'
              : 'border-border-main bg-bg-light text-text-primary hover:border-player-4 hover:text-player-4',
          )}
        >
          {starred ? <StarSolidIcon className="h-5 w-5" /> : <StarIcon className="h-5 w-5" />}
          <span>{map.starCount}</span>
        </button>
      </header>

      <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
        <span className="inline-flex items-center gap-1">
          <EyeIcon className="h-4 w-4" />
          {map.views}
        </span>
        <span className="inline-flex items-center gap-1">
          <AspectRatioIcon className="h-4 w-4" />
          {map.width} × {map.height}
        </span>
      </div>

      <p
        className="mt-3 text-sm text-text-muted"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {map.description}
      </p>

      <div className="mt-4 flex flex-col gap-2 md:flex-row">
        <button
          type="button"
          className="btn-secondary flex-1 justify-center"
          onClick={() => router.push(`/maps/${map.id}`)}
        >
          查看地图
        </button>
        {onSelect && (
          <button
            type="button"
            className="btn-primary flex-1 justify-center"
            onClick={() => onSelect(map.id)}
          >
            选择地图
          </button>
        )}
      </div>
    </article>
  );
});

interface MapExplorerProps {
  userId: string;
  onSelect?: (mapId: string) => void;
}

const tabLabels = ['最新', '最热', '最佳', '搜索'];
const endpoints = ['new', 'hot', 'best', 'search'];

export default function MapExplorer({ userId, onSelect }: MapExplorerProps) {
  const [tabIndex, setTabIndex] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [maps, setMaps] = useState<CustomMapInfo[] | undefined>(undefined);
  const [starredMaps, setStarredMaps] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    if (!userId) return;
    const fetchStarredMaps = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_API}/starredMaps?userId=${userId}`
      );
      const data: string[] = await response.json();

      const starredMaps = data.reduce(
        (acc: { [key: string]: boolean }, mapId: string) => {
          acc[mapId] = true;
          return acc;
        },
        {}
      );
      setStarredMaps(starredMaps);
    };

    fetchStarredMaps();
  }, [userId]);

  useEffect(() => {
    const fetchMaps = async () => {
      const endpoint = endpoints[tabIndex];
      const query = tabIndex === 3 && searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : '';
      const url = `${process.env.NEXT_PUBLIC_SERVER_API}/${endpoint}${query}`;
      const response = await fetch(url);
      const data = await response.json();
      setMaps(data);
    };
    fetchMaps();
  }, [tabIndex, searchTerm]);

  const handleStarClick = useCallback(
    async (mapId: string) => {
      try {
        const isStarred = starredMaps[mapId];
        const action = isStarred ? 'decrease' : 'increase';

        // Optimistically update the UI
        setMaps(
          (prevMaps) =>
            prevMaps?.map((map) =>
              map.id === mapId
                ? {
                    ...map,
                    starCount: isStarred
                      ? map.starCount - 1
                      : map.starCount + 1,
                  }
                : map
            )
        );
        setStarredMaps((prevStarredMaps) => ({
          ...prevStarredMaps,
          [mapId]: !isStarred,
        }));

        // Send the request to update the star count on the server
        await fetch(`${process.env.NEXT_PUBLIC_SERVER_API}/toggleStar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            mapId,
            action,
          }),
        });
      } catch (error) {
        console.log('star error', error);
      }
    },
    [starredMaps, setMaps, setStarredMaps, userId]
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b-2 border-border-subtle">
        {tabLabels.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setTabIndex(index)}
            className={clsx(
              'px-3 py-2 text-sm font-medium transition-all',
              tabIndex === index
                ? 'border-b-2 border-text-primary text-text-primary'
                : 'border-b-2 border-transparent text-text-muted hover:text-text-primary',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tabIndex === 3 && (
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜索地图..."
            className="w-full rounded-md border-2 border-border-main bg-white px-9 py-2 text-sm text-text-primary focus:border-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/15"
          />
        </div>
      )}

      <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
        {maps?.map((map) => (
          <ListItem
            key={map.id}
            map={map}
            handleStarClick={handleStarClick}
            onSelect={onSelect}
            starred={Boolean(starredMaps[map.id])}
          />
        ))}
        {!maps && (
          <div className="rounded-lg border-2 border-border-main bg-bg-light px-4 py-6 text-center text-sm text-text-muted">
            正在加载地图...
          </div>
        )}
        {maps && maps.length === 0 && (
          <div className="rounded-lg border-2 border-border-main bg-bg-light px-4 py-6 text-center text-sm text-text-muted">
            暂无地图结果
          </div>
        )}
      </div>
    </div>
  );
}
