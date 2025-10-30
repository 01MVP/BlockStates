import Spinner from '@/components/ui/Spinner';

const GameLoading: React.FC = () => {
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex items-center gap-4 rounded-lg border-2 border-border-main bg-white/95 px-6 py-4 shadow-xl">
        <Spinner size="md" />
        <span className="text-sm font-medium text-text-primary">
          游戏加载中...
        </span>
      </div>
    </div>
  );
};

export default GameLoading;
