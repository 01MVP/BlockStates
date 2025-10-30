'use client';

import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import MapEditor from '@/components/game/MapEditor';
import Spinner from '@/components/ui/Spinner';

export default function MapPage() {
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
        <MapEditor editMode={false} />
      </Suspense>
    </>
  );
}
