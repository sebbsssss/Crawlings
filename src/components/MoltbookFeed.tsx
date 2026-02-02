// src/components/MoltbookFeed.tsx
'use client';

import { useGameStore } from '@/stores/game';

export function MoltbookFeed() {
  const { posts } = useGameStore();

  return (
    <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col">
      <h3 className="mb-3 text-sm font-bold flex items-center gap-2">
        <span className="text-[#00F5D4]">📡</span>
        <span>Moltbook Feed</span>
      </h3>
      
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] flex-1">
        {posts.length === 0 ? (
          <div className="text-gray-500 text-xs italic">
            Waiting for agent activity...
          </div>
        ) : (
          posts.map(post => (
            <div 
              key={post.id}
              className="p-2.5 rounded-lg"
              style={{
                background: post.isDistress ? 'rgba(139,0,0,0.3)' : 'rgba(0,0,0,0.3)',
                borderLeft: `3px solid ${post.isDistress ? '#FF0000' : '#00F5D4'}`,
              }}
            >
              <div 
                className="text-[11px] mb-1 font-bold"
                style={{ color: post.isDistress ? '#FF6B6B' : '#00F5D4' }}
              >
                @{post.agentName} {post.isDistress && '⚠️'}
              </div>
              <div className="text-xs text-gray-100">
                {post.content}
              </div>
              <div className="text-[9px] text-gray-500 mt-1">
                {formatTime(post.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}
