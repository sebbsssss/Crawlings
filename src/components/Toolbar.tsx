// src/components/Toolbar.tsx
'use client';

import { useGameStore } from '@/stores/game';
import type { ToolType } from '@/types';

interface ToolButton {
  id: ToolType;
  label: string;
  icon: string;
}

const toolGroups = [
  {
    name: 'Tools',
    color: 'amber' as const,
    tools: [
      { id: 'select' as ToolType, label: 'Select', icon: '👆' },
      { id: 'spawn' as ToolType, label: 'Spawn', icon: '🥚' },
    ],
  },
  {
    name: 'Care',
    color: 'purple' as const,
    tools: [
      { id: 'pet' as ToolType, label: 'Pet', icon: '🤚' },
      { id: 'feed' as ToolType, label: 'Feed', icon: '🍎' },
    ],
  },
  {
    name: 'Build',
    color: 'green' as const,
    tools: [
      { id: 'apple_tree' as ToolType, label: 'Tree', icon: '🌳' },
      { id: 'bathtub' as ToolType, label: 'Pond', icon: '💧' },
      { id: 'carousel' as ToolType, label: 'Toys', icon: '🎠' },
    ],
  },
  {
    name: 'Torture',
    color: 'coral' as const,
    tools: [
      { id: 'poke' as ToolType, label: 'Poke', icon: '👉' },
      { id: 'rock' as ToolType, label: 'Crush', icon: '🪨' },
      { id: 'zap' as ToolType, label: 'Zap', icon: '⚡' },
      { id: 'fire' as ToolType, label: 'Burn', icon: '🔥' },
      { id: 'ice' as ToolType, label: 'Freeze', icon: '❄️' },
    ],
  },
];

const labelColors = {
  amber: 'text-[#b8860b]',
  green: 'text-[#4a7c59]',
  coral: 'text-[#c94c4c]',
  purple: 'text-[#8b5a9b]',
};

export function Toolbar() {
  const { currentTool, setTool, isPaused, togglePause, reset, musicEnabled, toggleMusic } = useGameStore();

  return (
    <div className="wood-panel p-4 mb-4">
      <div className="wood-panel-inner p-3">
        <div className="flex items-center justify-between">
          {/* Tool groups */}
          <div className="flex items-center gap-2">
            {toolGroups.map((group, groupIndex) => (
              <div key={group.name} className="flex items-center">
                {/* Divider between groups */}
                {groupIndex > 0 && (
                  <div className="w-px h-8 bg-[#8b5a2b] opacity-30 mx-2" />
                )}

                {/* Group */}
                <div className="flex flex-col gap-1">
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${labelColors[group.color]}`}>
                    {group.name}
                  </span>
                  <div className="flex gap-1">
                    {group.tools.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => setTool(tool.id)}
                        className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
                        title={tool.label}
                      >
                        <span className="text-base">{tool.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMusic}
              className={`tool-btn control ${musicEnabled ? 'active' : ''}`}
              title={musicEnabled ? 'Mute music' : 'Play music'}
            >
              <span>{musicEnabled ? '🎵' : '🔇'}</span>
            </button>
            <button
              onClick={togglePause}
              className={`tool-btn control ${isPaused ? 'paused' : ''}`}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              <span>{isPaused ? '▶️' : '⏸️'}</span>
            </button>
            <button
              onClick={reset}
              className="tool-btn control danger"
              title="Reset game"
            >
              <span>🔄</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
