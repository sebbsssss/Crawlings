// src/app/play/page.tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with PixiJS
const Game = dynamic(() => import('@/components/Game').then(mod => ({ default: mod.Game })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="wood-panel p-6">
        <div className="wood-panel-inner p-8 text-center">
          <div className="text-6xl mb-4 animate-bounce-soft">🦞</div>
          <p className="text-[#5c4030] font-bold text-lg">Loading Crawlings...</p>
          <p className="text-[#9a8070] text-sm mt-2">Preparing your cozy colony</p>
        </div>
      </div>
    </div>
  ),
});

export default function PlayPage() {
  return <Game />;
}
