import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserData, RoomUiStatus } from '@/lib/types';
import { useGame, useGameDispatch } from '@/context/GameContext';
import Modal from '@/components/ui/Modal';

export default function OverDialog() {
  const { myPlayerId, room, dialogContent, openOverDialog } = useGame();
  const { setRoomUiStatus, setOpenOverDialog } = useGameDispatch();
  const [replayLink, setReplayLink] = React.useState('');
  const router = useRouter();

  let title: string = '';
  let subtitle: string = '';
  let [userData, game_status, replay_link] = dialogContent;

  if (game_status === 'game_surrender') {
    title = '你投降了！';
    subtitle = '';
  }
  if (userData) {
    if (game_status === 'game_over') {
      title = '游戏结束！';
      subtitle = `被击败，胜者为: ${userData[0]?.username}`;
    }
    if (game_status === 'game_ended') {
      title =
        userData.filter((x) => x?.id === myPlayerId).length > 0
          ? '你赢了！'
          : '游戏结束！';
      subtitle = `赢家: ${userData
        .map((x) => x?.username)
        .join(', ')}!`;
    }
  }

  useEffect(() => {
    let [userData, game_status, replay_link] = dialogContent;
    if (game_status === 'game_ended' && replay_link) {
      setReplayLink(replay_link);
    }
  }, [dialogContent]);

  const handleExit = () => {
    router.push('/');
    setOpenOverDialog(false);
  };

  const handleBackRoom = () => {
    if (!room.gameStarted) setRoomUiStatus(RoomUiStatus.gameSetting);
    setOpenOverDialog(false);
  };

  const handleWatchReplay = () => {
    router.push(`/replays/${replayLink}`);
    setOpenOverDialog(false);
  };

  return (
    <Modal
      open={openOverDialog}
      onClose={() => setOpenOverDialog(false)}
      title={title}
      disableBackdropClose
      size="sm"
      footer={
        <>
          <button
            type="button"
            className="btn-primary w-full justify-center"
            onClick={handleBackRoom}
          >
            {room.gameStarted ? '观战' : '再玩一次'}
          </button>
          {replayLink && (
            <button
              type="button"
              className="btn-secondary w-full justify-center"
              onClick={handleWatchReplay}
            >
              查看回放
            </button>
          )}
          <button
            type="button"
            className="btn-secondary w-full justify-center"
            onClick={handleExit}
          >
            返回大厅
          </button>
          <button
            type="button"
            className="btn-secondary w-full justify-center"
            onClick={() => setOpenOverDialog(false)}
          >
            取消
          </button>
        </>
      }
    >
      {subtitle && (
        <p className="text-sm text-text-muted">
          {subtitle}
        </p>
      )}
    </Modal>
  );
}
