// src/components/Game.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useGameStore } from '@/stores/game';
import { Toolbar } from './Toolbar';
import { AgentPanel } from './AgentPanel';
import { MoltbookFeed } from './MoltbookFeed';
import { StatsBar } from './StatsBar';
import type { Agent, AgentState } from '@/types';
import { COLORS, WORLD_WIDTH, WORLD_HEIGHT } from '@/types';

// Get color based on agent state
function getAgentColor(agent: Agent): number {
  if (!agent.isAlive) return COLORS.dead;
  switch (agent.state) {
    case 'frozen': return COLORS.frozen;
    case 'burning': return COLORS.burning;
    case 'zapped': return COLORS.zapped;
    case 'panicking':
    case 'fleeing': return COLORS.panicking;
    case 'mourning':
    case 'questioning': return COLORS.mourning;
    default: return COLORS.shell;
  }
}

// Draw a lobster sprite
function drawLobster(g: PIXI.Graphics, agent: Agent, isSelected: boolean) {
  g.clear();
  
  const color = getAgentColor(agent);
  const scaleY = agent.state === 'crushed' ? 0.3 : 1;
  const shake = ['panicking', 'zapped'].includes(agent.state) ? Math.sin(agent.frame * 0.5) * 2 : 0;
  
  // Shadow
  g.ellipse(0, 14 * scaleY, 8, 3);
  g.fill({ color: 0x000000, alpha: 0.3 });
  
  // Blood pool for dead
  if (['dead', 'crushed'].includes(agent.state)) {
    g.ellipse(0, 12, 12, 5);
    g.fill({ color: 0x8B0000, alpha: 0.6 });
  }
  
  // Selection ring
  if (isSelected) {
    g.circle(0, 0, 18);
    g.stroke({ color: 0x00F5D4, width: 2, alpha: 0.8 });
  }
  
  // Body
  g.ellipse(shake, 0, 8 * 1, 12 * scaleY);
  g.fill(color);
  
  // Shell highlight
  g.ellipse(shake, -3 * scaleY, 6, 8 * scaleY);
  g.fill({ color: COLORS.shellLight, alpha: 0.4 });
  
  if (agent.state !== 'crushed') {
    // Claws
    g.ellipse(-14 + shake, -2, 6, 4);
    g.fill(COLORS.claw);
    g.ellipse(14 + shake, -2, 6, 4);
    g.fill(COLORS.claw);
    
    // Tail
    g.rect(-4 + shake, 10, 8, 5);
    g.fill(COLORS.shellDark);
    
    // Eyes
    if (agent.isAlive) {
      // Left eye
      g.circle(-4 + shake, -8, 3);
      g.fill(COLORS.eye);
      g.circle(-4 + agent.direction + shake, -8, 1.5);
      g.fill(COLORS.eyePupil);
      
      // Right eye
      g.circle(4 + shake, -8, 3);
      g.fill(COLORS.eye);
      g.circle(4 + agent.direction + shake, -8, 1.5);
      g.fill(COLORS.eyePupil);
    } else {
      // X eyes for dead
      g.circle(-4, -8, 3);
      g.fill(0x666666);
      g.circle(4, -8, 3);
      g.fill(0x666666);
    }
    
    // Antennae
    g.moveTo(-3 + shake, -12);
    g.lineTo(-6, -18);
    g.stroke({ color: 0x370617, width: 1 });
    g.moveTo(3 + shake, -12);
    g.lineTo(6, -18);
    g.stroke({ color: 0x370617, width: 1 });
  }
  
  // Effects
  if (agent.state === 'burning') {
    for (let i = 0; i < 3; i++) {
      g.ellipse(-4 + i * 4, -15 - i * 3, 3, 6);
      g.fill({ color: 0xFF6B00, alpha: 0.7 });
    }
  }
  
  if (agent.state === 'frozen') {
    g.rect(-12, -15, 24, 30);
    g.fill({ color: 0x87CEEB, alpha: 0.4 });
  }
  
  if (agent.state === 'zapped') {
    g.moveTo(0, -20);
    g.lineTo(3, -5);
    g.lineTo(-2, -3);
    g.lineTo(5, 15);
    g.stroke({ color: 0xFFE66D, width: 2 });
  }
}

// Draw structures
function drawStructure(g: PIXI.Graphics, type: string) {
  g.clear();
  
  switch (type) {
    case 'apple_tree':
      // Trunk
      g.rect(-5, 0, 10, 25);
      g.fill(0x5C4033);
      // Foliage
      g.circle(0, -10, 20);
      g.fill(0x228B22);
      g.circle(-10, -5, 14);
      g.fill(0x2D5A27);
      g.circle(10, -5, 14);
      g.fill(0x2D5A27);
      // Apples
      g.circle(-6, -8, 4);
      g.fill(0xE63946);
      g.circle(6, -14, 4);
      g.fill(0xE63946);
      g.circle(-2, -20, 4);
      g.fill(0xE63946);
      break;
      
    case 'bathtub':
      // Tub
      g.ellipse(0, 0, 24, 14);
      g.fill(0xE9ECEF);
      // Water
      g.ellipse(0, -2, 20, 10);
      g.fill(0x74C0FC);
      g.ellipse(0, -4, 16, 7);
      g.fill({ color: 0xA5D8FF, alpha: 0.5 });
      // Bubbles
      g.circle(-8, -5, 3);
      g.fill({ color: 0xFFFFFF, alpha: 0.7 });
      g.circle(5, -7, 2);
      g.fill({ color: 0xFFFFFF, alpha: 0.7 });
      g.circle(10, -4, 3);
      g.fill({ color: 0xFFFFFF, alpha: 0.7 });
      break;
      
    case 'carousel':
      // Pole
      g.rect(-3, -35, 6, 35);
      g.fill(0x666666);
      // Ring
      g.circle(0, -38, 28);
      g.stroke({ color: 0xF72585, width: 4 });
      // Center
      g.circle(0, -38, 22);
      g.fill({ color: 0x7B2CBF, alpha: 0.3 });
      // Seats
      const seatColors = [0xF72585, 0x7209B7, 0x3A0CA3, 0x4361EE, 0x4CC9F0];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 72) * Math.PI / 180;
        g.circle(Math.cos(angle) * 24, -38 + Math.sin(angle) * 24, 6);
        g.fill(seatColors[i]);
      }
      break;
  }
}

// Draw bone
function drawBone(g: PIXI.Graphics) {
  g.clear();
  g.ellipse(0, 0, 8, 3);
  g.fill(0xF5F5DC);
  g.circle(-7, -2, 3);
  g.fill(0xF5F5DC);
  g.circle(-7, 2, 3);
  g.fill(0xF5F5DC);
  g.circle(7, -2, 3);
  g.fill(0xF5F5DC);
  g.circle(7, 2, 3);
  g.fill(0xF5F5DC);
}

export function Game() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const agentSpritesRef = useRef<Map<string, PIXI.Graphics>>(new Map());
  const structureSpritesRef = useRef<Map<string, PIXI.Graphics>>(new Map());
  const boneSpritesRef = useRef<Map<string, PIXI.Graphics>>(new Map());
  
  const { 
    agents, 
    structures, 
    bones,
    mood,
    selectedAgentId,
    currentTool,
    runTick,
    handleWorldClick,
  } = useGameStore();

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        backgroundColor: 0x228B22,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      canvasRef.current?.appendChild(app.canvas);
      appRef.current = app;

      // Create grass texture pattern
      const grassTexture = new PIXI.Graphics();
      for (let x = 0; x < WORLD_WIDTH; x += 20) {
        for (let y = 0; y < WORLD_HEIGHT; y += 20) {
          grassTexture.circle(x + 5, y + 5, 1);
          grassTexture.fill({ color: 0x1A472A, alpha: 0.3 });
          grassTexture.circle(x + 15, y + 12, 1);
          grassTexture.fill({ color: 0x2D5A27, alpha: 0.4 });
        }
      }
      app.stage.addChild(grassTexture);

      // Click handler
      app.canvas.addEventListener('click', (e) => {
        const rect = app.canvas.getBoundingClientRect();
        const scaleX = WORLD_WIDTH / rect.width;
        const scaleY = WORLD_HEIGHT / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        handleWorldClick(x, y);
      });

      // Update cursor based on tool
      app.canvas.style.cursor = 'default';
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [handleWorldClick]);

  // Update cursor based on tool
  useEffect(() => {
    if (!appRef.current) return;
    const canvas = appRef.current.canvas;
    
    if (['poke', 'rock', 'zap', 'fire', 'ice'].includes(currentTool)) {
      canvas.style.cursor = 'crosshair';
    } else if (['spawn', 'apple_tree', 'bathtub', 'carousel'].includes(currentTool)) {
      canvas.style.cursor = 'cell';
    } else {
      canvas.style.cursor = 'default';
    }
  }, [currentTool]);

  // Game loop
  useEffect(() => {
    const interval = setInterval(runTick, 50); // 20 TPS
    return () => clearInterval(interval);
  }, [runTick]);

  // Render loop
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    // Update structures
    const existingStructureIds = new Set(structures.map(s => s.id));
    
    // Remove old structures
    for (const [id, sprite] of structureSpritesRef.current) {
      if (!existingStructureIds.has(id)) {
        app.stage.removeChild(sprite);
        structureSpritesRef.current.delete(id);
      }
    }
    
    // Add/update structures
    for (const structure of structures) {
      let sprite = structureSpritesRef.current.get(structure.id);
      if (!sprite) {
        sprite = new PIXI.Graphics();
        drawStructure(sprite, structure.type);
        app.stage.addChild(sprite);
        structureSpritesRef.current.set(structure.id, sprite);
      }
      sprite.x = structure.x;
      sprite.y = structure.y;
    }

    // Update bones
    const existingBoneIds = new Set(bones.map(b => b.id));
    
    for (const [id, sprite] of boneSpritesRef.current) {
      if (!existingBoneIds.has(id)) {
        app.stage.removeChild(sprite);
        boneSpritesRef.current.delete(id);
      }
    }
    
    for (const bone of bones) {
      let sprite = boneSpritesRef.current.get(bone.id);
      if (!sprite) {
        sprite = new PIXI.Graphics();
        drawBone(sprite);
        app.stage.addChild(sprite);
        boneSpritesRef.current.set(bone.id, sprite);
      }
      sprite.x = bone.x;
      sprite.y = bone.y;
    }

    // Update agents
    const existingAgentIds = new Set(agents.map(a => a.id));
    
    // Remove old agents
    for (const [id, sprite] of agentSpritesRef.current) {
      if (!existingAgentIds.has(id)) {
        app.stage.removeChild(sprite);
        agentSpritesRef.current.delete(id);
      }
    }
    
    // Add/update agents
    for (const agent of agents) {
      let sprite = agentSpritesRef.current.get(agent.id);
      if (!sprite) {
        sprite = new PIXI.Graphics();
        app.stage.addChild(sprite);
        agentSpritesRef.current.set(agent.id, sprite);
      }
      
      drawLobster(sprite, agent, agent.id === selectedAgentId);
      sprite.x = agent.x;
      sprite.y = agent.y;
      sprite.scale.x = agent.direction;
    }

  }, [agents, structures, bones, selectedAgentId]);

  // Update background based on mood
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;
    
    const colors: Record<string, number> = {
      neutral: 0x228B22,
      anxious: 0x2D4A27,
      fearful: 0x3D2A27,
    };
    
    app.renderer.background.color = colors[mood] || colors.neutral;
  }, [mood]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#03071E] via-[#370617] to-[#03071E] p-5 font-mono text-gray-100">
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="text-5xl font-black bg-gradient-to-r from-[#F72585] via-[#7209B7] via-[#3A0CA3] via-[#4361EE] to-[#4CC9F0] bg-clip-text text-transparent tracking-tighter">
          🦞 CLAWLINGS 🦞
        </h1>
        <p className="text-gray-400 mt-2 text-sm">
          {mood === 'fearful' ? '⚠️ THE THRONG IS TERRIFIED ⚠️' :
           mood === 'anxious' ? '😰 The throng grows anxious...' :
           'Autonomous AI agents • What kind of god will you be?'}
        </p>
      </div>

      <div className="flex gap-5 max-w-[1200px] mx-auto">
        {/* Main game area */}
        <div className="flex-1">
          <Toolbar />
          
          {/* Canvas container */}
          <div 
            ref={canvasRef}
            className={`rounded-xl overflow-hidden border-[3px] ${
              mood === 'fearful' ? 'border-red-900 shadow-[0_0_40px_rgba(139,0,0,0.5)]' :
              'border-[#03071E] shadow-[0_0_40px_rgba(114,9,183,0.3)]'
            }`}
            style={{ width: WORLD_WIDTH, height: WORLD_HEIGHT }}
          />
          
          <StatsBar />
        </div>

        {/* Side panel */}
        <div className="w-[280px] flex flex-col gap-4">
          <AgentPanel />
          <MoltbookFeed />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-gray-500 text-xs">
        <p>{useGameStore.getState().stats.murdered > 10 ? '💀 You monster.' : 
            useGameStore.getState().stats.murdered > 5 ? '😰 They\'re starting to fear you...' : 
            'Feed them. Clean them. Watch them think. 🦞'}</p>
        <p className="opacity-60 mt-1">
          They remember what you do. They tell each other. They will judge you.
        </p>
      </div>
    </div>
  );
}
