'use client';

import { Suspense } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import Navbar from '@/components/Navbar';
import theme from '@/components/theme';
import MapEditor from '@/components/game/MapEditor';

export default function MapCreator() {
  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <MapEditor editMode={true} />
      </Suspense>
    </ThemeProvider>
  );
}
