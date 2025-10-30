import React, { useCallback, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { useRouter } from 'next/navigation';
import { RoomUiStatus } from '@/lib/types';
import { MaxTeamNum } from '@/lib/constants';
import Modal from '@/components/ui/Modal';

export default function SurrenderDialog({
  isOpen,
  setOpen,
  handleSurrender,
}: {
  isOpen: boolean;
  setOpen: (value: boolean) => void;
  handleSurrender: () => void;
}) {
  const { openOverDialog, isSurrendered, team, roomUiStatus } = useGame();
  const router = useRouter();

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isOpen && !openOverDialog) {
        setOpen(true);
      }
    },
    [isOpen, openOverDialog, setOpen]
  );

  const showExitTitle =
    isSurrendered ||
    team === MaxTeamNum + 1 ||
    roomUiStatus === RoomUiStatus.gameOverConfirm;

  const handleCloseSurrender = useCallback(() => {
    setOpen(false);
    handleSurrender();
  }, [handleSurrender, setOpen]);

  const handleExit = useCallback(() => {
    setOpen(false);
    router.push('/');
  }, [router, setOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [handleKeydown]);

  const title = showExitTitle ? '你确定要退出？' : '你确定要投降？';
  const description = showExitTitle
    ? '退出后将返回大厅。'
    : '投降后你在本局的所有领地将被清空，确定继续吗？';

  return (
    <Modal
      open={isOpen}
      onClose={() => setOpen(false)}
      title={title}
      description={description}
      size="sm"
      disableBackdropClose
      footer={
        <>
          {showExitTitle ? (
            <button
              type="button"
              className="btn-primary w-full justify-center"
              onClick={handleExit}
            >
              退出
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary w-full justify-center"
              onClick={handleCloseSurrender}
            >
              投降
            </button>
          )}
          <button
            type="button"
            className="btn-secondary w-full justify-center"
            onClick={() => setOpen(false)}
          >
            取消
          </button>
        </>
      }
    >
      <p className="text-sm text-text-muted">
        {showExitTitle
          ? '本局已经结束或你已成为观战者，随时可以重新加入新的战斗。'
          : '你仍可以继续战斗，或选择投降返回房间。'}
      </p>
    </Modal>
  );
}
