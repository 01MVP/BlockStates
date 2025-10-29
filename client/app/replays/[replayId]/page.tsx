'use client';

import { Suspense } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/components/theme';
import GameReplay from '@/components/game/GameReplay';

export default function ReplayPage() {
  return (
    <ThemeProvider theme={theme}>
      <Suspense fallback={<div>Loading...</div>}>
        <GameReplay />
      </Suspense>
    </ThemeProvider>
  );
}
