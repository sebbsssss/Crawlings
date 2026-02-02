// src/components/StatsBar.tsx
'use client';

import { useGameStore } from '@/stores/game';

export function StatsBar() {
  const { stats } = useGameStore();

  const statItems = [
    { label: 'Population', value: stats.population, color: '#4CC9F0' },
    { label: 'Born', value: stats.born, color: '#4ADE80' },
    { label: 'Died', value: stats.died, color: '#F87171' },
    { label: 'Murdered', value: stats.murdered, color: '#8B0000' },
    { label: 'Bones', value: stats.bones, color: '#F5F5DC' },
  ];

  return (
    <div className="flex justify-around mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
      {statItems.map(stat => (
        <div key={stat.label} className="text-center">
          <div 
            className="text-xl font-bold"
            style={{ color: stat.color }}
          >
            {stat.value}
          </div>
          <div className="text-[10px] text-gray-500 uppercase">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
