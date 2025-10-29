'use client';

import { Suspense } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/components/theme';
import Navbar from '@/components/Navbar';
import MapEditor from '@/components/game/MapEditor';

export default function MapPage() {
  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <MapEditor editMode={false} />
      </Suspense>
    </ThemeProvider>
  );
}
