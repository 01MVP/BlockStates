import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';

interface PublishMapDialogProps {
  open: boolean;
  onClose: () => void;
  mapId: string;
}

export default function PublishMapDialog({
  open,
  onClose,
  mapId,
}: PublishMapDialogProps) {
  const router = useRouter();
  const [copySuccess, setCopySuccess] = useState(false);
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    setMapUrl(window.location.origin + '/maps/' + mapId);
  }, [mapId]);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(mapUrl);
    setCopySuccess(true);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="自定义地图已发布"
      size="sm"
      footer={
        <>
          <button
            type="button"
            className="btn-primary w-full justify-center"
            onClick={() => router.push(`/maps/${mapId}`)}
          >
            查看地图
          </button>
          <button
            type="button"
            className="btn-secondary w-full justify-center"
            onClick={onClose}
          >
            关闭
          </button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-text-muted">
        <p>地图链接已生成，复制后即可分享给其他玩家。</p>
        <div className="flex flex-col gap-3 rounded-lg border-2 border-border-main bg-bg-light px-3 py-2">
          <code className="break-all text-xs text-text-primary">{mapUrl}</code>
          <button
            type="button"
            className="btn-secondary w-full justify-center"
            onClick={handleCopyClick}
          >
            {copySuccess ? '已复制' : '复制链接'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
