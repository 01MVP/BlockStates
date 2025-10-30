'use client';

import Navbar from '@/components/Navbar';
import MapEditor from '@/components/game/MapEditor';
import Spinner from '@/components/ui/Spinner';
import { Suspense } from 'react';

export default function MapCreator() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        }
      >
        <MapEditor editMode={true} />
      </Suspense>
    </>
  );
}
