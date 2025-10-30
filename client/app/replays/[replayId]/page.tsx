'use client';

import { Suspense } from 'react';
import GameReplay from '@/components/game/GameReplay';
import Spinner from '@/components/ui/Spinner';

export default function ReplayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <GameReplay />
    </Suspense>
  );
}
