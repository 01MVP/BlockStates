import { useState } from 'react';
import PingTest from '@/components/PingTest';

interface TurnsCountProps {
  count: number;
  handleReturnClick: any;
}

function TurnsCount(props: TurnsCountProps) {
  const { count, handleReturnClick } = props;
  const [showPingTest, setShowPingTest] = useState(false);

  const displayTurnsCount = Math.floor(count / 2);

  const handleDoubleClick = () => {
    setShowPingTest(!showPingTest);
  };

  return (
    <div
      className="fixed left-2 top-2 z-tooltip flex flex-col items-start gap-2"
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="flex items-center gap-3 rounded-r-3xl border-2 border-border-main bg-white/90 px-4 py-2 shadow-lg backdrop-blur"
      >
        <button
          type="button"
          onClick={handleReturnClick}
          className="icon-btn border-none bg-transparent p-1 text-text-primary hover:bg-bg-main"
          aria-label="返回房间"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 fill-none stroke-current"
            strokeWidth={1.8}
          >
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="text-sm font-medium text-text-primary">
          回合: {displayTurnsCount}
        </div>
      </div>
      {showPingTest && <PingTest />}
    </div>
  );
}

export default TurnsCount;
