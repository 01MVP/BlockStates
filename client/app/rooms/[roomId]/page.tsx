'use client';

import { Suspense } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/components/theme';
import GameRoom from '@/components/GameRoom';
import { GameProvider } from '@/context/GameContext';

export default function RoomPage() {
  return (
    <ThemeProvider theme={theme}>
      <GameProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <GameRoom />
        </Suspense>
      </GameProvider>
    </ThemeProvider>
  );
}
