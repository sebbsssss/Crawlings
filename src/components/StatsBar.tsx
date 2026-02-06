// src/components/StatsBar.tsx
'use client';

import { useGameStore } from '@/stores/game';

export function StatsBar() {
  const { stats } = useGameStore();

  const statItems = [
    { label: 'Population', value: stats.population, color: '#4a7c59', icon: '🦞' },
    { label: 'Born', value: stats.born, color: '#6b9b6b', icon: '🥚' },
    { label: 'Died', value: stats.died, color: '#7a5c42', icon: '💀' },
    { label: 'Hurt', value: stats.murdered, color: '#c94c4c', icon: '💔', danger: stats.murdered > 0 },
    { label: 'Bones', value: stats.bones, color: '#9a8070', icon: '🦴' },
  ];

  return (
    <div className="wood-panel p-4 mt-4">
      <div className="wood-panel-inner p-3">
        <div className="flex justify-around items-center">
          {statItems.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              <div className="text-center px-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl icon-bouncy">{stat.icon}</span>
                  <div
                    className={`stat-number ${stat.danger ? 'animate-wiggle' : ''}`}
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                </div>
                <div className="stat-label">
                  {stat.label}
                </div>
              </div>
              {i < statItems.length - 1 && (
                <div className="h-12 w-1 bg-gradient-to-b from-transparent via-[#8b5a2b] to-transparent opacity-30 rounded" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
