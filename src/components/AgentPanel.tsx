// src/components/AgentPanel.tsx
'use client';

import { useGameStore } from '@/stores/game';

export function AgentPanel() {
  const { agents, selectedAgentId } = useGameStore();

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  if (!selectedAgent) {
    return (
      <div className="wood-panel p-4">
        <div className="wood-panel-inner p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🦞</span>
            <span className="text-[#5c4030] text-sm font-bold tracking-wide">Clawling Info</span>
          </div>
          <div className="divider" />
          <div className="text-center py-8">
            <div className="text-5xl mb-4 opacity-40">🔍</div>
            <p className="text-[#7a5c42] text-lg font-bold">No crawling selected</p>
            <p className="text-[#9a8070] text-sm mt-2">
              Click on a clawling to inspect
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isTraumatized = selectedAgent.traumaLevel > 3;
  const isDead = !selectedAgent.isAlive;
  const isCrazed = selectedAgent.state === 'crazed';

  const bars = [
    {
      label: 'Hunger',
      value: selectedAgent.hunger,
      low: selectedAgent.hunger < 30,
      colorClass: selectedAgent.hunger < 30 ? 'progress-coral' : 'progress-amber',
      icon: '🍎'
    },
    {
      label: 'Clean',
      value: selectedAgent.cleanliness,
      low: selectedAgent.cleanliness < 30,
      colorClass: selectedAgent.cleanliness < 30 ? 'progress-coral' : 'progress-blue',
      icon: '💧'
    },
    {
      label: 'Fun',
      value: selectedAgent.entertainment,
      low: selectedAgent.entertainment < 30,
      colorClass: selectedAgent.entertainment < 30 ? 'progress-coral' : 'progress-purple',
      icon: '⭐'
    },
  ];

  return (
    <div className="wood-panel p-4">
      <div className="wood-panel-inner p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isDead ? '💀' : isCrazed ? '🤪' : isTraumatized ? '😰' : '🦞'}</span>
            <span className="text-[#5c4030] text-sm font-bold tracking-wide">Clawling Info</span>
          </div>
          {isDead && <span className="badge badge-coral">Deceased</span>}
          {isCrazed && !isDead && <span className="badge badge-purple animate-wiggle">INSANE!</span>}
          {isTraumatized && !isDead && !isCrazed && <span className="badge badge-coral animate-wiggle">Stressed!</span>}
        </div>
        <div className="divider" />

        {/* Name */}
        <h3 className="font-display text-2xl text-[#5d3a1a] mt-4 mb-4 drop-shadow-sm">
          {selectedAgent.name}
        </h3>

        {/* Need bars */}
        <div className="flex flex-col gap-4 mb-5">
          {bars.map(bar => (
            <div key={bar.label}>
              <div className="flex justify-between mb-2 text-sm">
                <span className="flex items-center gap-2 text-[#5c4030]">
                  <span className="icon-bouncy">{bar.icon}</span>
                  <span className="font-bold">{bar.label}</span>
                </span>
                <span className={`font-bold ${bar.low ? 'text-[#c94c4c]' : 'text-[#5c4030]'}`}>
                  {Math.round(bar.value)}%
                </span>
              </div>
              <div className={`progress-bar ${bar.colorClass}`}>
                <div
                  className="progress-fill"
                  style={{ width: `${bar.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Trauma bar */}
        {selectedAgent.traumaLevel > 0 && (
          <div className="mb-5">
            <div className="flex justify-between mb-2 text-sm">
              <span className="flex items-center gap-2 text-[#c94c4c]">
                <span>😱</span>
                <span className="font-bold">Trauma</span>
              </span>
              <span className="font-bold text-[#c94c4c]">
                {Math.round(selectedAgent.traumaLevel * 10)}%
              </span>
            </div>
            <div className="progress-bar progress-coral">
              <div
                className="progress-fill"
                style={{ width: `${selectedAgent.traumaLevel * 10}%` }}
              />
            </div>
          </div>
        )}

        <div className="divider" />

        {/* Status */}
        <div className="flex justify-between items-center py-3">
          <span className="text-[#7a5c42] text-sm font-bold">Status</span>
          <span className="badge badge-green">
            {selectedAgent.state.replace('_', ' ')}
          </span>
        </div>

        {/* Death cause */}
        {isDead && selectedAgent.deathCause && (
          <div className="bg-[#fae8e8] border-3 border-[#c94c4c] rounded-lg p-4 mt-3">
            <div className="text-xs text-[#c94c4c] mb-1 font-bold tracking-wide">Cause of Death</div>
            <div className="text-[#8b3030] text-lg font-bold capitalize">{selectedAgent.deathCause}</div>
          </div>
        )}

        {/* Witnessed deaths */}
        {selectedAgent.witnessedDeaths > 0 && (
          <div className="bg-[#faf0e0] border-3 border-[#b8860b] rounded-lg p-3 mt-3">
            <div className="text-sm text-[#8b6914] font-bold">
              👁️ Witnessed {selectedAgent.witnessedDeaths} death{selectedAgent.witnessedDeaths > 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Last thought */}
        {selectedAgent.lastThought && (
          <div className="bg-[#f0f0fa] border-3 border-[#9b7bb8] rounded-lg p-4 mt-3">
            <div className="text-xs text-[#6a4a88] mb-2 font-bold tracking-wide">💭 Thinking</div>
            <div className="text-[#5c4030] text-sm italic">"{selectedAgent.lastThought}"</div>
          </div>
        )}

        <div className="divider mt-4" />

        {/* Relationships */}
        {(selectedAgent.friendIds.length > 0 || selectedAgent.enemyIds.length > 0 || selectedAgent.childIds.length > 0) && (
          <div className="flex gap-3 mt-3 text-xs font-bold">
            {selectedAgent.friendIds.length > 0 && (
              <span className="flex items-center gap-1 text-[#4a7c59]">
                💕 {selectedAgent.friendIds.length} friend{selectedAgent.friendIds.length > 1 ? 's' : ''}
              </span>
            )}
            {selectedAgent.childIds.length > 0 && (
              <span className="flex items-center gap-1 text-[#9b7bb8]">
                👶 {selectedAgent.childIds.length} child{selectedAgent.childIds.length > 1 ? 'ren' : ''}
              </span>
            )}
            {selectedAgent.enemyIds.length > 0 && (
              <span className="flex items-center gap-1 text-[#c94c4c]">
                💢 {selectedAgent.enemyIds.length} enem{selectedAgent.enemyIds.length > 1 ? 'ies' : 'y'}
              </span>
            )}
          </div>
        )}

        <div className="divider mt-3" />

        {/* Stats footer */}
        <div className="flex justify-between text-sm text-[#7a5c42] mt-3 font-bold">
          <span className="flex items-center gap-1">
            <span className="text-[#5b9bd5]">⏱️</span> Age: {selectedAgent.age}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[#6b9b6b]">🥚</span> Split: {Math.round(selectedAgent.splitProgress)}%
          </span>
        </div>
      </div>
    </div>
  );
}
