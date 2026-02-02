// src/components/Toolbar.tsx
'use client';

import { useGameStore } from '@/stores/game';
import type { ToolType } from '@/types';

interface ToolButton {
  id: ToolType;
  icon: string;
  label: string;
  group: 'basic' | 'build' | 'torture';
  color?: string;
}

const tools: ToolButton[] = [
  { id: 'select', icon: '👆', label: 'Select', group: 'basic' },
  { id: 'spawn', icon: '🦞', label: 'Spawn', group: 'basic' },
  { id: 'apple_tree', icon: '🍎', label: 'Tree', group: 'build' },
  { id: 'bathtub', icon: '🛁', label: 'Bath', group: 'build' },
  { id: 'carousel', icon: '🎠', label: 'Fun', group: 'build' },
  { id: 'poke', icon: '👉', label: 'Poke', group: 'torture', color: '#FF6B6B' },
  { id: 'rock', icon: '🪨', label: 'Crush', group: 'torture', color: '#666666' },
  { id: 'zap', icon: '⚡', label: 'Zap', group: 'torture', color: '#FFE66D' },
  { id: 'fire', icon: '🔥', label: 'Burn', group: 'torture', color: '#FF4500' },
  { id: 'ice', icon: '🧊', label: 'Freeze', group: 'torture', color: '#87CEEB' },
];

export function Toolbar() {
  const { currentTool, setTool, isPaused, togglePause, reset } = useGameStore();

  const basicTools = tools.filter(t => t.group === 'basic');
  const buildTools = tools.filter(t => t.group === 'build');
  const tortureTools = tools.filter(t => t.group === 'torture');

  return (
    <div className="flex gap-2 mb-3 p-3 bg-white/5 rounded-lg border border-white/10 flex-wrap items-center">
      {/* Basic tools */}
      <div className="flex gap-1.5 pr-3 border-r border-white/20">
        {basicTools.map(tool => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={currentTool === tool.id}
            onClick={() => setTool(tool.id)}
          />
        ))}
      </div>

      {/* Build tools */}
      <div className="flex gap-1.5 pr-3 border-r border-white/20">
        {buildTools.map(tool => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={currentTool === tool.id}
            onClick={() => setTool(tool.id)}
            activeColor="#228B22"
            activeBorder="#4ADE80"
          />
        ))}
      </div>

      {/* Torture tools */}
      <div className="flex gap-1.5 pr-3 border-r border-white/20">
        {tortureTools.map(tool => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={currentTool === tool.id}
            onClick={() => setTool(tool.id)}
            activeColor={tool.color}
            activeBorder={tool.color}
          />
        ))}
      </div>

      {/* Control buttons */}
      <div className="flex gap-1.5 ml-auto">
        <button
          onClick={togglePause}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            isPaused
              ? 'bg-green-600 text-white'
              : 'bg-yellow-600 text-white'
          }`}
        >
          {isPaused ? '▶️ Play' : '⏸️ Pause'}
        </button>
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-900/50 text-red-300 hover:bg-red-900 transition-all"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
}

interface ToolButtonProps {
  tool: ToolButton;
  isActive: boolean;
  onClick: () => void;
  activeColor?: string;
  activeBorder?: string;
}

function ToolButton({ tool, isActive, onClick, activeColor = '#7209B7', activeBorder = '#F72585' }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all"
      style={{
        background: isActive ? activeColor : 'rgba(255,255,255,0.1)',
        border: `2px solid ${isActive ? activeBorder : 'transparent'}`,
        color: isActive && tool.group === 'torture' ? '#000' : '#F8F9FA',
      }}
    >
      <span>{tool.icon}</span>
      <span>{tool.label}</span>
    </button>
  );
}
