// src/components/MoltbookFeed.tsx
'use client';

import { useGameStore } from '@/stores/game';

export function MoltbookFeed() {
  const { posts, agents } = useGameStore();

  // Calculate colony sentiment
  const aliveAgents = agents.filter(a => a.isAlive);
  const avgTrauma = aliveAgents.length > 0
    ? aliveAgents.reduce((sum, a) => sum + a.traumaLevel, 0) / aliveAgents.length
    : 0;
  const avgHappiness = aliveAgents.length > 0
    ? aliveAgents.reduce((sum, a) => sum + (a.hunger + a.cleanliness + a.entertainment) / 3, 0) / aliveAgents.length
    : 0;
  const crazedCount = aliveAgents.filter(a => a.state === 'crazed').length;
  const friendships = aliveAgents.reduce((sum, a) => sum + a.friendIds.length, 0) / 2;

  const getSentiment = () => {
    if (aliveAgents.length === 0) return { emoji: '💨', label: 'Empty', color: '#7a5c42', desc: 'No clawlings in colony' };
    if (crazedCount >= 3) return { emoji: '🌀', label: 'Chaos', color: '#9b59b6', desc: 'Madness has taken hold' };
    if (avgTrauma > 6) return { emoji: '😱', label: 'Terrified', color: '#c94c4c', desc: 'The colony lives in fear' };
    if (avgTrauma > 4) return { emoji: '😰', label: 'Anxious', color: '#e67e22', desc: 'Tension fills the air' };
    if (avgHappiness > 80 && avgTrauma < 2) return { emoji: '🌟', label: 'Thriving', color: '#27ae60', desc: 'Life is wonderful!' };
    if (avgHappiness > 60 && avgTrauma < 3) return { emoji: '😊', label: 'Content', color: '#4a7c59', desc: 'The colony is at peace' };
    if (avgHappiness < 40) return { emoji: '😔', label: 'Struggling', color: '#b8860b', desc: 'Needs are not being met' };
    return { emoji: '😐', label: 'Neutral', color: '#7a5c42', desc: 'An ordinary day' };
  };

  const sentiment = getSentiment();

  return (
    <div className="wood-panel p-4 flex-1 flex flex-col overflow-hidden">
      <div className="wood-panel-inner p-4 flex flex-col overflow-hidden">
        {/* Colony Sentiment */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <span className="text-[#5c4030] text-sm font-bold tracking-wide">Colony Mind</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg mb-3" style={{ backgroundColor: `${sentiment.color}15`, border: `2px solid ${sentiment.color}40` }}>
          <span className="text-3xl">{sentiment.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm" style={{ color: sentiment.color }}>{sentiment.label}</div>
            <div className="text-xs text-[#5c4030] truncate">{sentiment.desc}</div>
          </div>
          {friendships > 0 && (
            <div className="text-xs text-[#9b7bb8] font-bold">💕 {Math.floor(friendships)}</div>
          )}
        </div>

        <div className="divider" />

        {/* Header */}
        <div className="flex items-center justify-between my-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📖</span>
            <span className="text-[#5c4030] text-sm font-bold tracking-wide">Moltbook</span>
          </div>
          <span className="badge badge-amber">{posts.length}</span>
        </div>

        {/* Feed - constrained height */}
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1" style={{ maxHeight: '200px' }}>
          {posts.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2 opacity-40">💬</div>
              <div className="text-[#7a5c42] text-sm font-bold">No posts yet</div>
            </div>
          ) : (
            posts.slice(0, 8).map(post => (
              <div
                key={post.id}
                className={`p-3 rounded-lg border-l-4 transition-all hover:translate-x-1 ${
                  post.isDistress
                    ? 'bg-[#fae8e8] border-[#c94c4c]'
                    : 'bg-[#f0f8e8] border-[#6b9b6b]'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`text-xs font-bold ${post.isDistress ? 'text-[#c94c4c]' : 'text-[#4a7c59]'}`}
                  >
                    🦞 {post.agentName}
                  </span>
                  {post.isDistress && (
                    <span className="text-[#c94c4c] text-xs font-bold">⚠️</span>
                  )}
                </div>
                <div className="text-[#5c4030] text-xs leading-relaxed line-clamp-2">
                  {post.content}
                </div>
              </div>
            ))
          )}
        </div>
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
