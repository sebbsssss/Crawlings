// src/components/Minimap.tsx
'use client';

import { useGameStore } from '@/stores/game';
import { WORLD_WIDTH, WORLD_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '@/types';

const MINIMAP_WIDTH = 140;
const MINIMAP_HEIGHT = 93;
const SCALE_X = MINIMAP_WIDTH / WORLD_WIDTH;
const SCALE_Y = MINIMAP_HEIGHT / WORLD_HEIGHT;

export function Minimap() {
  const {
    agents,
    structures,
    bones,
    cameraX,
    cameraY,
    setCameraPosition,
  } = useGameStore();

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap position to world position (centering viewport)
    const worldX = (clickX / SCALE_X) - (VIEWPORT_WIDTH / 2);
    const worldY = (clickY / SCALE_Y) - (VIEWPORT_HEIGHT / 2);

    setCameraPosition(worldX, worldY);
  };

  // Calculate viewport rectangle on minimap
  const viewportX = cameraX * SCALE_X;
  const viewportY = cameraY * SCALE_Y;
  const viewportW = VIEWPORT_WIDTH * SCALE_X;
  const viewportH = VIEWPORT_HEIGHT * SCALE_Y;

  return (
    <div
      className="absolute top-3 right-3 cursor-pointer group"
      style={{
        width: MINIMAP_WIDTH + 16,
        height: MINIMAP_HEIGHT + 16,
      }}
      onClick={handleMinimapClick}
    >
      {/* Wooden frame */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: 'linear-gradient(180deg, #d4a574 0%, #b8865c 50%, #8b5a2b 100%)',
          border: '4px solid #5d3a1a',
          boxShadow: '0 4px 12px rgba(61, 41, 20, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Inner map area */}
        <div
          className="absolute rounded"
          style={{
            top: 6,
            left: 6,
            right: 6,
            bottom: 6,
            background: 'linear-gradient(180deg, #7cb342 0%, #558b2f 100%)',
            border: '2px solid #3d5a2a',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Structures */}
          {structures.map(structure => {
            const color = structure.type === 'apple_tree' ? '#4a7c59' :
                          structure.type === 'bathtub' ? '#5b9bd5' : '#e8a838';
            return (
              <div
                key={structure.id}
                style={{
                  position: 'absolute',
                  left: structure.x * SCALE_X + 2 - 3,
                  top: structure.y * SCALE_Y + 2 - 3,
                  width: 6,
                  height: 6,
                  backgroundColor: color,
                  borderRadius: structure.type === 'carousel' ? '50%' : 2,
                  border: '1px solid rgba(0,0,0,0.3)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              />
            );
          })}

          {/* Bones */}
          {bones.map(bone => (
            <div
              key={bone.id}
              style={{
                position: 'absolute',
                left: bone.x * SCALE_X + 2 - 1.5,
                top: bone.y * SCALE_Y + 2 - 1.5,
                width: 3,
                height: 3,
                backgroundColor: '#e8dcc4',
                borderRadius: '50%',
                opacity: 0.7,
              }}
            />
          ))}

          {/* Agents */}
          {agents.filter(a => a.isAlive).map(agent => (
            <div
              key={agent.id}
              style={{
                position: 'absolute',
                left: agent.x * SCALE_X + 2 - 2,
                top: agent.y * SCALE_Y + 2 - 2,
                width: 4,
                height: 4,
                backgroundColor: agent.traumaLevel > 3 ? '#c94c4c' : '#e07b67',
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.3)',
              }}
            />
          ))}

          {/* Viewport rectangle */}
          <div
            style={{
              position: 'absolute',
              left: viewportX + 2,
              top: viewportY + 2,
              width: viewportW,
              height: viewportH,
              border: '2px solid #faf3e0',
              backgroundColor: 'rgba(250, 243, 224, 0.15)',
              borderRadius: 2,
              boxShadow: '0 0 4px rgba(250, 243, 224, 0.5)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Corner bolts */}
        <div
          className="absolute"
          style={{
            top: 2,
            left: 2,
            width: 8,
            height: 8,
            background: 'radial-gradient(circle, #8b7355 0%, #5d4e3a 60%, #3d3020 100%)',
            borderRadius: '50%',
            border: '1px solid #3d2914',
            boxShadow: 'inset 0 -1px 2px rgba(0, 0, 0, 0.4)',
          }}
        />
        <div
          className="absolute"
          style={{
            top: 2,
            right: 2,
            width: 8,
            height: 8,
            background: 'radial-gradient(circle, #8b7355 0%, #5d4e3a 60%, #3d3020 100%)',
            borderRadius: '50%',
            border: '1px solid #3d2914',
            boxShadow: 'inset 0 -1px 2px rgba(0, 0, 0, 0.4)',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: 2,
            left: 2,
            width: 8,
            height: 8,
            background: 'radial-gradient(circle, #8b7355 0%, #5d4e3a 60%, #3d3020 100%)',
            borderRadius: '50%',
            border: '1px solid #3d2914',
            boxShadow: 'inset 0 -1px 2px rgba(0, 0, 0, 0.4)',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: 2,
            right: 2,
            width: 8,
            height: 8,
            background: 'radial-gradient(circle, #8b7355 0%, #5d4e3a 60%, #3d3020 100%)',
            borderRadius: '50%',
            border: '1px solid #3d2914',
            boxShadow: 'inset 0 -1px 2px rgba(0, 0, 0, 0.4)',
          }}
        />
      </div>

      {/* Label */}
      <div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-[#5d3a1a] font-bold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}
      >
        Map
      </div>
    </div>
  );
}
