// src/app/play/page.tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with PixiJS
const Game = dynamic(() => import('@/components/Game').then(mod => ({ default: mod.Game })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-[#03071E] via-[#370617] to-[#03071E] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🦞</div>
        <p className="text-gray-400 font-mono">Loading Clawlings...</p>
      </div>
    </div>
  ),
});

export default function PlayPage() {
  return <Game />;
}
