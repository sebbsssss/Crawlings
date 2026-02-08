// src/components/AgentPanel.tsx
'use client';

import { useGameStore } from '@/stores/game';
import { VARIANT_COLORS, type VariantId } from '@/types';

// Get diamond color based on need value
function getDiamondColor(value: number): { bg: string; border: string; glow: string } {
  if (value >= 70) return { bg: '#4CAF50', border: '#2E7D32', glow: 'rgba(76, 175, 80, 0.4)' };
  if (value >= 50) return { bg: '#FFC107', border: '#FFA000', glow: 'rgba(255, 193, 7, 0.4)' };
  if (value >= 30) return { bg: '#FF9800', border: '#F57C00', glow: 'rgba(255, 152, 0, 0.4)' };
  return { bg: '#F44336', border: '#D32F2F', glow: 'rgba(244, 67, 54, 0.5)' };
}

// Calculate overall mood diamond color
function getMoodDiamondColor(hunger: number, clean: number, fun: number, trauma: number): { bg: string; border: string } {
  const min = Math.min(hunger, clean, fun);
  const avg = (hunger + clean + fun) / 3;

  if (trauma > 5) return { bg: '#9C27B0', border: '#7B1FA2' }; // Purple for traumatized
  if (min < 15) return { bg: '#F44336', border: '#D32F2F' }; // Red critical
  if (min < 30) return { bg: '#FF9800', border: '#F57C00' }; // Orange warning
  if (avg < 70) return { bg: '#FFC107', border: '#FFA000' }; // Yellow okay
  return { bg: '#4CAF50', border: '#2E7D32' }; // Green happy
}

// Get variant display info
function getVariantInfo(variantId: VariantId | undefined) {
  if (!variantId || !VARIANT_COLORS[variantId]) {
    return { name: 'Classic', color: '#E85D04' };
  }
  const variant = VARIANT_COLORS[variantId];
  return { name: variant.name, color: `#${variant.primary.toString(16).padStart(6, '0')}` };
}

// Diamond component
function NeedDiamond({ value, size = 'normal' }: { value: number; size?: 'normal' | 'large' }) {
  const colors = getDiamondColor(value);
  const diamondSize = size === 'large' ? 32 : 20;
  const fillHeight = (value / 100) * diamondSize;

  return (
    <div
      className="relative"
      style={{
        width: diamondSize,
        height: diamondSize,
        transform: 'rotate(45deg)',
      }}
    >
      {/* Border */}
      <div
        className="absolute inset-0 rounded-sm"
        style={{
          border: `2px solid ${colors.border}`,
          boxShadow: `0 0 8px ${colors.glow}`,
        }}
      />
      {/* Fill from bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-sm transition-all duration-300"
        style={{
          height: `${fillHeight}px`,
          backgroundColor: colors.bg,
          opacity: 0.9,
        }}
      />
    </div>
  );
}

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
            <p className="text-[#7a5c42] text-lg font-bold">No clawling selected</p>
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
  const variantInfo = getVariantInfo(selectedAgent.variantId);
  const moodColors = getMoodDiamondColor(
    selectedAgent.hunger,
    selectedAgent.cleanliness,
    selectedAgent.entertainment,
    selectedAgent.traumaLevel
  );

  // Status moodlets
  const moodlets = [];
  if (selectedAgent.hunger < 30) moodlets.push({ icon: '🍎', label: 'Hungry', color: '#F44336' });
  if (selectedAgent.cleanliness < 30) moodlets.push({ icon: '💧', label: 'Dirty', color: '#F44336' });
  if (selectedAgent.entertainment < 30) moodlets.push({ icon: '😴', label: 'Bored', color: '#F44336' });
  if (selectedAgent.traumaLevel > 5) moodlets.push({ icon: '😱', label: 'Trauma', color: '#9C27B0' });
  if (selectedAgent.state === 'loved') moodlets.push({ icon: '💕', label: 'Loved', color: '#E91E63' });
  if (selectedAgent.state === 'eating') moodlets.push({ icon: '🍽️', label: 'Eating', color: '#4CAF50' });
  if (selectedAgent.state === 'bathing') moodlets.push({ icon: '🛁', label: 'Bathing', color: '#2196F3' });
  if (selectedAgent.state === 'playing') moodlets.push({ icon: '🎠', label: 'Playing', color: '#9C27B0' });
  if (isCrazed) moodlets.push({ icon: '🌀', label: 'Crazed', color: '#FF00FF' });

  return (
    <div className="wood-panel p-4">
      <div className="wood-panel-inner p-4">
        {/* Portrait Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Portrait with variant color background */}
          <div
            className="relative w-16 h-16 rounded-lg flex items-center justify-center pixel-border"
            style={{
              background: `linear-gradient(135deg, ${variantInfo.color}40 0%, ${variantInfo.color}20 100%)`,
              borderColor: variantInfo.color,
            }}
          >
            <span className="text-3xl">{isDead ? '💀' : isCrazed ? '🤪' : isTraumatized ? '😰' : '🦞'}</span>
            {/* Mood diamond overlay */}
            <div
              className="absolute -bottom-2 -right-2 w-6 h-6 rounded-sm shadow-lg"
              style={{
                transform: 'rotate(45deg)',
                background: moodColors.bg,
                border: `2px solid ${moodColors.border}`,
              }}
            />
          </div>

          {/* Name and variant */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl text-[#5d3a1a] truncate">
              {selectedAgent.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: variantInfo.color }}
              />
              <span className="text-xs text-[#7a5c42] font-bold">{variantInfo.name} Variant</span>
            </div>
            {isDead && <span className="badge badge-coral mt-1">Deceased</span>}
            {isCrazed && !isDead && <span className="badge badge-purple mt-1 animate-wiggle">INSANE!</span>}
          </div>
        </div>

        <div className="divider" />

        {/* Need Diamonds Grid */}
        <div className="grid grid-cols-3 gap-4 my-4">
          {/* Hunger */}
          <div className="flex flex-col items-center gap-2">
            <NeedDiamond value={selectedAgent.hunger} />
            <div className="flex flex-col items-center -rotate-0">
              <span className="text-xs font-bold text-[#5c4030]">🍎</span>
              <span className="text-[10px] text-[#7a5c42]">{Math.round(selectedAgent.hunger)}%</span>
            </div>
          </div>

          {/* Cleanliness */}
          <div className="flex flex-col items-center gap-2">
            <NeedDiamond value={selectedAgent.cleanliness} />
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[#5c4030]">💧</span>
              <span className="text-[10px] text-[#7a5c42]">{Math.round(selectedAgent.cleanliness)}%</span>
            </div>
          </div>

          {/* Entertainment */}
          <div className="flex flex-col items-center gap-2">
            <NeedDiamond value={selectedAgent.entertainment} />
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-[#5c4030]">⭐</span>
              <span className="text-[10px] text-[#7a5c42]">{Math.round(selectedAgent.entertainment)}%</span>
            </div>
          </div>
        </div>

        {/* Trauma indicator (if any) */}
        {selectedAgent.traumaLevel > 0 && (
          <div className="flex items-center gap-3 p-2 rounded-lg mb-3" style={{ backgroundColor: '#9C27B020', border: '2px solid #9C27B040' }}>
            <NeedDiamond value={selectedAgent.traumaLevel * 10} />
            <div className="flex-1">
              <span className="text-xs font-bold text-[#7B1FA2]">😱 Trauma</span>
              <div className="text-[10px] text-[#9C27B0]">{Math.round(selectedAgent.traumaLevel * 10)}% - {selectedAgent.witnessedDeaths} deaths witnessed</div>
            </div>
          </div>
        )}

        <div className="divider" />

        {/* Moodlets Row */}
        {moodlets.length > 0 && (
          <div className="flex flex-wrap gap-2 my-3">
            {moodlets.slice(0, 6).map((moodlet, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold"
                style={{
                  backgroundColor: `${moodlet.color}20`,
                  border: `2px solid ${moodlet.color}40`,
                  color: moodlet.color,
                }}
              >
                <span>{moodlet.icon}</span>
                <span>{moodlet.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Death cause */}
        {isDead && selectedAgent.deathCause && (
          <div className="bg-[#fae8e8] border-3 border-[#c94c4c] rounded-lg p-3 my-3">
            <div className="text-xs text-[#c94c4c] mb-1 font-bold tracking-wide">💀 Cause of Death</div>
            <div className="text-[#8b3030] font-bold capitalize">{selectedAgent.deathCause}</div>
          </div>
        )}

        {/* Last thought */}
        {selectedAgent.lastThought && (
          <div className="bg-[#f0f0fa] border-2 border-[#9b7bb8] rounded-lg p-3 my-3">
            <div className="text-[10px] text-[#6a4a88] mb-1 font-bold tracking-wide">💭 THINKING</div>
            <div className="text-[#5c4030] text-xs italic leading-relaxed">"{selectedAgent.lastThought}"</div>
          </div>
        )}

        <div className="divider" />

        {/* Relationships */}
        <div className="flex flex-wrap gap-2 my-3">
          {selectedAgent.friendIds.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#4CAF5020] border-2 border-[#4CAF5040]">
              <span className="text-sm">💕</span>
              <span className="text-xs font-bold text-[#2E7D32]">{selectedAgent.friendIds.length} friend{selectedAgent.friendIds.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {selectedAgent.childIds.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#9C27B020] border-2 border-[#9C27B040]">
              <span className="text-sm">👶</span>
              <span className="text-xs font-bold text-[#7B1FA2]">{selectedAgent.childIds.length} child{selectedAgent.childIds.length > 1 ? 'ren' : ''}</span>
            </div>
          )}
          {selectedAgent.enemyIds.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#F4433620] border-2 border-[#F4433640]">
              <span className="text-sm">💢</span>
              <span className="text-xs font-bold text-[#D32F2F]">{selectedAgent.enemyIds.length} enem{selectedAgent.enemyIds.length > 1 ? 'ies' : 'y'}</span>
            </div>
          )}
          {selectedAgent.parentId && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#FF980020] border-2 border-[#FF980040]">
              <span className="text-sm">👪</span>
              <span className="text-xs font-bold text-[#F57C00]">Has Parent</span>
            </div>
          )}
        </div>

        {/* Stats footer */}
        <div className="flex justify-between text-xs text-[#7a5c42] mt-3 font-bold">
          <span className="flex items-center gap-1">
            <span>⏱️</span> Age: {selectedAgent.age}
          </span>
          <span className="flex items-center gap-1">
            <span>🥚</span> Split: {Math.round(selectedAgent.splitProgress)}%
          </span>
          <span className="badge badge-green text-[10px]">
            {selectedAgent.state.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}
