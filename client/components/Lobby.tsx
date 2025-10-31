import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Room, RoomPool } from '@/lib/types';
import Spinner from '@/components/ui/Spinner';
import Toast from '@/components/ui/Toast';
import clsx from 'classnames';

function Lobby() {
  const [rooms, setRooms] = useState<RoomPool>({});
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [username, setUsername] = useState('');
  const [serverStatus, setServerStatus] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('fetching rooms from: ', process.env.NEXT_PUBLIC_SERVER_API);
    const fetchRooms = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_API}/get_rooms`
        );

        const rooms = await res.json();
        setRooms(rooms);
        setLoading(false);
        setServerStatus(true);
      } catch (err: any) {
        setLoading(false);
        setSnackOpen(true);
        setSnackMessage(err.message);
        setServerStatus(false);
      }
    };
    fetchRooms();
    let fetchInterval = setInterval(fetchRooms, 2000);
    return () => {
      clearInterval(fetchInterval);
    };
  }, []);

  useEffect(() => {
    let tmp: string | null = localStorage.getItem('username');
    if (!tmp) {
      router.push('/');
    } else {
      setUsername(tmp);
    }
  }, [setUsername, router]);

  const handleRoomClick = (roomName: string) => {
    setJoinLoading(true);
    router.push(`/rooms/${roomName}`);
  };

  const handleCreateRoomClick = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_API}/create_room`
      );
      let data = await res.json();
      if (res.status === 200) {
        router.push(`/rooms/${data.roomId}`);
      } else {
        setSnackOpen(true);
        setSnackMessage(data.message);
        setServerStatus(true);
      }
    } catch (err: any) {
      setSnackOpen(true);
      setSnackMessage(err.message);
      setServerStatus(false);
    }
  };

  return (
    <>
      <Toast
        open={snackOpen}
        message={snackMessage}
        type={serverStatus ? 'info' : 'error'}
        onClose={() => setSnackOpen(false)}
      />

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-16 pt-10">
        <div className="w-full space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h1 className="text-3xl font-semibold text-text-primary">
              欢迎你，{username}
            </h1>
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-border-main bg-white px-4 py-2 text-sm text-text-muted shadow-sm">
              <span className="font-medium text-text-primary">
                实时刷新中
              </span>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-player-2 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-player-2" />
              </span>
            </div>
          </div>

          <div className="card w-full">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  方块战国后端服务器
                </p>
                <p className="text-xs text-text-muted">
                  {process.env.NEXT_PUBLIC_SERVER_API}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    'inline-flex h-3 w-3 rounded-full',
                    serverStatus ? 'bg-player-3' : 'bg-player-1',
                  )}
                />
                <span className="text-sm font-medium text-text-primary">
                  {serverStatus ? '在线' : '离线'}
                </span>
              </div>
            </div>
          </div>

          <div className="card w-full overflow-hidden p-0">
            <div className="flex items-center justify-between border-b-2 border-border-main bg-bg-main px-6 py-4">
              <h2 className="text-lg font-medium text-text-primary">房间列表</h2>
              <span className="text-sm text-text-muted">
                {loading
                  ? '加载中…'
                  : `共 ${Object.keys(rooms).length} 个房间`}
              </span>
            </div>
            <div className="max-h-[55vh] overflow-y-auto">
              <table className="min-w-full divide-y-2 divide-border-subtle text-left">
                <thead className="bg-bg-main text-xs uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-6 py-3 font-medium">房间名</th>
                    <th className="px-6 py-3 text-center font-medium">
                      速度
                    </th>
                    <th className="px-6 py-3 text-center font-medium">
                      玩家
                    </th>
                    <th className="px-6 py-3 text-center font-medium">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle bg-white text-sm">
                  {joinLoading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center">
                        <div className="flex flex-col items-center gap-3 text-sm text-text-muted">
                          <Spinner size="md" />
                          <span className="font-medium text-text-primary">
                            加入房间中...
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-center">
                        <Spinner size="lg" />
                      </td>
                    </tr>
                  ) : Object.keys(rooms).length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-6 text-center text-text-muted"
                      >
                        暂无房间，快来创建第一个房间吧！
                      </td>
                    </tr>
                  ) : (
                    Object.values(rooms).map((room: Room) => (
                      <tr
                        key={room.id}
                        onClick={() => handleRoomClick(room.id)}
                        className="cursor-pointer transition hover:bg-bg-main/60"
                      >
                        <td className="max-w-[200px] truncate px-6 py-4 font-medium text-text-primary">
                          {room.roomName}
                        </td>
                        <td className="px-6 py-4 text-center text-text-secondary">
                          {room.gameSpeed}
                        </td>
                        <td className="px-6 py-4 text-center text-text-secondary">
                          {`${room.players.length}/${room.maxPlayers}`}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={clsx(
                              'game-status',
                              room.gameStarted ? 'playing' : 'waiting',
                            )}
                          >
                            {room.gameStarted ? '已开始' : '等待中'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid w-full gap-4 md:grid-cols-2">
            <button
              type="button"
              className="btn-primary flex w-full items-center justify-center gap-2"
              onClick={handleCreateRoomClick}
            >
              创建房间
            </button>
            <button
              type="button"
              className="btn-secondary flex w-full items-center justify-center gap-2"
              onClick={() => router.push('/mapcreator')}
            >
              创建地图（PC）
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default Lobby;
