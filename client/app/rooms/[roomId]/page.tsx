'use client';

import { Suspense } from 'react';
import GameRoom from '@/components/GameRoom';
import { GameProvider } from '@/context/GameContext';
import Spinner from '@/components/ui/Spinner';

export default function RoomPage() {
  return (
    <GameProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <Spinner size="lg" />
          </div>
        }
      >
        <GameRoom />
      </Suspense>
    </GameProvider>
  );
}
