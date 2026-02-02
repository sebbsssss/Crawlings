// src/components/AgentPanel.tsx
'use client';

import { useGameStore } from '@/stores/game';

export function AgentPanel() {
  const { agents, selectedAgentId } = useGameStore();
  
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  
  if (!selectedAgent) {
    return (
      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-gray-500 text-sm text-center">
          Click on an agent to select it
        </p>
      </div>
    );
  }

  const bars = [
    { label: 'Hunger', value: selectedAgent.hunger, color: selectedAgent.hunger < 30 ? '#F87171' : '#4ADE80' },
    { label: 'Cleanliness', value: selectedAgent.cleanliness, color: selectedAgent.cleanliness < 30 ? '#F87171' : '#60A5FA' },
    { label: 'Entertainment', value: selectedAgent.entertainment, color: selectedAgent.entertainment < 30 ? '#F87171' : '#A78BFA' },
  ];

  return (
    <div 
      className="p-4 bg-white/5 rounded-xl"
      style={{ 
        border: selectedAgent.traumaLevel > 3 
          ? '1px solid #8B0000' 
          : '1px solid #7209B7' 
      }}
    >
      <h3 
        className="mb-3 text-base font-bold flex items-center gap-2"
        style={{ color: selectedAgent.traumaLevel > 3 ? '#FF6B6B' : '#F72585' }}
      >
        🦞 {selectedAgent.name}
        {selectedAgent.traumaLevel > 5 && ' 😰'}
        {!selectedAgent.isAlive && ' 💀'}
      </h3>
      
      <div className="text-sm flex flex-col gap-2">
        {/* Need bars */}
        {bars.map(bar => (
          <div key={bar.label}>
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-gray-400">{bar.label}</span>
              <span>{Math.round(bar.value)}%</span>
            </div>
            <div className="bg-[#1A1A2E] rounded h-2 overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${bar.value}%`,
                  backgroundColor: bar.color,
                }}
              />
            </div>
          </div>
        ))}
        
        {/* Trauma bar (if any) */}
        {selectedAgent.traumaLevel > 0 && (
          <div>
            <div className="flex justify-between mb-1 text-xs">
              <span className="text-red-400">Trauma</span>
              <span className="text-red-400">{Math.round(selectedAgent.traumaLevel * 10)}%</span>
            </div>
            <div className="bg-[#1A1A2E] rounded h-2 overflow-hidden">
              <div 
                className="h-full transition-all duration-300 bg-[#8B0000]"
                style={{ width: `${selectedAgent.traumaLevel * 10}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Status */}
        <div className="mt-2 p-2 bg-black/30 rounded-md">
          <div className="text-[10px] text-gray-500 mb-1 uppercase">Status</div>
          <div className="text-gray-100 capitalize">{selectedAgent.state.replace('_', ' ')}</div>
        </div>
        
        {/* Death cause */}
        {!selectedAgent.isAlive && selectedAgent.deathCause && (
          <div className="p-2 bg-red-900/20 rounded-md border border-red-900">
            <div className="text-[10px] text-red-400 mb-1 uppercase">Cause of Death</div>
            <div className="text-red-300 capitalize">{selectedAgent.deathCause}</div>
          </div>
        )}
        
        {/* Witnessed deaths */}
        {selectedAgent.witnessedDeaths > 0 && (
          <div className="p-2 bg-red-900/20 rounded-md border border-red-900">
            <div className="text-[10px] text-red-400">
              WITNESSED DEATHS: {selectedAgent.witnessedDeaths}
            </div>
          </div>
        )}
        
        {/* Last thought */}
        {selectedAgent.lastThought && (
          <div className="p-2 bg-purple-900/20 rounded-md border border-purple-700">
            <div className="text-[10px] text-purple-400 mb-1 uppercase">Thinking</div>
            <div className="text-gray-100 text-xs italic">"{selectedAgent.lastThought}"</div>
          </div>
        )}
        
        {/* Stats */}
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-gray-500">
          <div>Age: {selectedAgent.age}</div>
          <div>Split: {Math.round(selectedAgent.splitProgress)}%</div>
        </div>
      </div>
    </div>
  );
}
