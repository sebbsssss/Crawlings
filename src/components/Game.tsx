// src/components/Game.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useGameStore } from '@/stores/game';
import { Toolbar } from './Toolbar';
import { AgentPanel } from './AgentPanel';
import { MoltbookFeed } from './MoltbookFeed';
import { StatsBar } from './StatsBar';
import { Minimap } from './Minimap';
import { MusicPlayer } from './MusicPlayer';
import type { Agent, VariantId } from '@/types';
import { WORLD_WIDTH, WORLD_HEIGHT, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, VARIANT_COLORS } from '@/types';

// Sprite URLs
const SPRITES = {
  crawlingHappy: '/sprites/crawling-happy.svg',
  crawlingSad: '/sprites/crawling-sad.svg',
  crawlingScared: '/sprites/crawling-scared.svg',
  crawlingExcited: '/sprites/crawling-excited.svg',
  crawlingEating: '/sprites/crawling-eating.svg',
  crawlingDead: '/sprites/crawling-dead.svg',
  tree: '/sprites/tree.svg',
  bathtub: '/sprites/pond.svg',
  carousel: '/sprites/toys.svg',
};

type Expression = 'happy' | 'sad' | 'scared' | 'excited' | 'eating' | 'dead';

// Get sprite key for expression
function getSpriteKey(expression: Expression): keyof typeof SPRITES {
  const map: Record<Expression, keyof typeof SPRITES> = {
    happy: 'crawlingHappy',
    sad: 'crawlingSad',
    scared: 'crawlingScared',
    excited: 'crawlingExcited',
    eating: 'crawlingEating',
    dead: 'crawlingDead',
  };
  return map[expression];
}

type NeedType = 'hunger' | 'cleanliness' | 'entertainment' | 'happy' | 'splitting' | 'trauma' | null;

// Determine what need to show in speech bubble
function getNeedToShow(agent: Agent): { need: NeedType; isUp: boolean } {
  if (!agent.isAlive) return { need: null, isUp: false };

  // Show splitting indicator
  if (agent.splitProgress > 50) {
    return { need: 'splitting', isUp: true };
  }

  // Show trauma when high
  if (agent.traumaLevel > 3) {
    return { need: 'trauma', isUp: true };
  }

  // Show needs being fulfilled (up arrows)
  if (agent.state === 'eating') {
    return { need: 'hunger', isUp: true };
  }
  if (agent.state === 'bathing') {
    return { need: 'cleanliness', isUp: true };
  }
  if (agent.state === 'playing') {
    return { need: 'entertainment', isUp: true };
  }

  // Show critical needs (down arrows)
  if (agent.hunger < 30) {
    return { need: 'hunger', isUp: false };
  }
  if (agent.cleanliness < 30) {
    return { need: 'cleanliness', isUp: false };
  }
  if (agent.entertainment < 30) {
    return { need: 'entertainment', isUp: false };
  }

  // Show happy when all needs are high
  if (agent.hunger > 80 && agent.cleanliness > 80 && agent.entertainment > 80 && agent.traumaLevel < 2) {
    return { need: 'happy', isUp: true };
  }

  return { need: null, isUp: false };
}

// Draw speech bubble with need icon
function drawSpeechBubble(g: PIXI.Graphics, need: NeedType, isUp: boolean, frame: number) {
  g.clear();
  if (!need) return;

  const bubbleY = -45;
  const bubbleWidth = 28;
  const bubbleHeight = 22;

  // Slight bounce animation
  const bounce = Math.sin(frame * 0.1) * 2;

  // Speech bubble background
  g.beginFill(0xFFF8E7);
  g.lineStyle(2, 0x5C4033);
  g.drawRoundedRect(-bubbleWidth / 2, bubbleY - bubbleHeight / 2 + bounce, bubbleWidth, bubbleHeight, 6);
  g.endFill();

  // Bubble tail
  g.beginFill(0xFFF8E7);
  g.lineStyle(0);
  g.moveTo(-4, bubbleY + bubbleHeight / 2 - 2 + bounce);
  g.lineTo(0, bubbleY + bubbleHeight / 2 + 6 + bounce);
  g.lineTo(4, bubbleY + bubbleHeight / 2 - 2 + bounce);
  g.endFill();

  // Draw border line on tail
  g.lineStyle(2, 0x5C4033);
  g.moveTo(-5, bubbleY + bubbleHeight / 2 - 1 + bounce);
  g.lineTo(0, bubbleY + bubbleHeight / 2 + 6 + bounce);
  g.lineTo(5, bubbleY + bubbleHeight / 2 - 1 + bounce);

  const iconY = bubbleY + bounce;
  const iconX = isUp ? -5 : -5;

  // Draw icon based on need
  g.lineStyle(0);
  switch (need) {
    case 'hunger':
      // Apple icon
      g.beginFill(0xE53935);
      g.drawCircle(iconX, iconY, 6);
      g.endFill();
      g.beginFill(0x5C4033);
      g.drawRect(iconX - 1, iconY - 8, 2, 4);
      g.endFill();
      g.beginFill(0x4CAF50);
      g.drawEllipse(iconX + 3, iconY - 6, 3, 2);
      g.endFill();
      break;

    case 'cleanliness':
      // Water drop icon
      g.beginFill(0x42A5F5);
      g.moveTo(iconX, iconY - 7);
      g.quadraticCurveTo(iconX + 7, iconY + 2, iconX, iconY + 7);
      g.quadraticCurveTo(iconX - 7, iconY + 2, iconX, iconY - 7);
      g.endFill();
      g.beginFill(0x90CAF9, 0.6);
      g.drawCircle(iconX - 2, iconY + 1, 2);
      g.endFill();
      break;

    case 'entertainment':
      // Star icon
      g.beginFill(0xFFD700);
      const starPoints: number[] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 72 - 90) * Math.PI / 180;
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
        starPoints.push(iconX + Math.cos(outerAngle) * 7);
        starPoints.push(iconY + Math.sin(outerAngle) * 7);
        starPoints.push(iconX + Math.cos(innerAngle) * 3);
        starPoints.push(iconY + Math.sin(innerAngle) * 3);
      }
      g.drawPolygon(starPoints);
      g.endFill();
      break;

    case 'happy':
      // Heart icon
      g.beginFill(0xE91E63);
      g.moveTo(iconX, iconY + 5);
      g.quadraticCurveTo(iconX - 7, iconY - 2, iconX, iconY - 5);
      g.quadraticCurveTo(iconX + 7, iconY - 2, iconX, iconY + 5);
      g.endFill();
      return; // No arrow for happy

    case 'splitting':
      // Baby/split icon (two circles)
      g.beginFill(0x9C27B0);
      g.drawCircle(iconX - 3, iconY, 4);
      g.drawCircle(iconX + 3, iconY, 4);
      g.endFill();
      g.beginFill(0xCE93D8, 0.6);
      g.drawCircle(iconX - 4, iconY - 1, 1.5);
      g.drawCircle(iconX + 2, iconY - 1, 1.5);
      g.endFill();
      return; // No arrow for splitting

    case 'trauma':
      // Exclamation/warning icon
      g.beginFill(0xF44336);
      g.drawRoundedRect(iconX - 2, iconY - 6, 4, 8, 1);
      g.drawCircle(iconX, iconY + 5, 2);
      g.endFill();
      return; // No arrow for trauma
  }

  // Draw arrow
  const arrowX = iconX + 10;
  const arrowColor = isUp ? 0x4CAF50 : 0xF44336;
  g.beginFill(arrowColor);

  if (isUp) {
    // Up arrow
    g.moveTo(arrowX, iconY - 5);
    g.lineTo(arrowX + 4, iconY + 1);
    g.lineTo(arrowX + 1, iconY + 1);
    g.lineTo(arrowX + 1, iconY + 5);
    g.lineTo(arrowX - 1, iconY + 5);
    g.lineTo(arrowX - 1, iconY + 1);
    g.lineTo(arrowX - 4, iconY + 1);
    g.closePath();
  } else {
    // Down arrow
    g.moveTo(arrowX, iconY + 5);
    g.lineTo(arrowX + 4, iconY - 1);
    g.lineTo(arrowX + 1, iconY - 1);
    g.lineTo(arrowX + 1, iconY - 5);
    g.lineTo(arrowX - 1, iconY - 5);
    g.lineTo(arrowX - 1, iconY - 1);
    g.lineTo(arrowX - 4, iconY - 1);
    g.closePath();
  }
  g.endFill();
}

// Get base tint color for variant
function getVariantTint(variantId: VariantId | undefined): number {
  if (!variantId || !VARIANT_COLORS[variantId]) return 0xFFFFFF;
  return VARIANT_COLORS[variantId].primary;
}

// Blend variant color with state color
function blendColors(variantColor: number, stateColor: number, variantWeight: number = 0.4): number {
  const vr = (variantColor >> 16) & 0xFF;
  const vg = (variantColor >> 8) & 0xFF;
  const vb = variantColor & 0xFF;

  const sr = (stateColor >> 16) & 0xFF;
  const sg = (stateColor >> 8) & 0xFF;
  const sb = stateColor & 0xFF;

  const r = Math.floor(vr * variantWeight + sr * (1 - variantWeight));
  const g = Math.floor(vg * variantWeight + sg * (1 - variantWeight));
  const b = Math.floor(vb * variantWeight + sb * (1 - variantWeight));

  return (r << 16) | (g << 8) | b;
}

// Determine which relationship icons to show
interface RelationshipIcons {
  showHeart: boolean;
  showAnger: boolean;
  showFamily: boolean;
}

function getRelationshipIcons(agent: Agent, allAgents: Agent[]): RelationshipIcons {
  const nearbyRadius = 60;
  const nearbyAgents = allAgents.filter(other =>
    other.id !== agent.id &&
    other.isAlive &&
    Math.hypot(other.x - agent.x, other.y - agent.y) < nearbyRadius
  );

  const nearFriend = nearbyAgents.some(a => agent.friendIds.includes(a.id));
  const nearEnemy = nearbyAgents.some(a => agent.enemyIds.includes(a.id));
  const nearFamily = nearbyAgents.some(a =>
    a.id === agent.parentId || agent.childIds.includes(a.id)
  );

  return {
    showHeart: nearFriend && !['aggressive', 'attacking', 'crazed'].includes(agent.state),
    showAnger: nearEnemy || ['aggressive', 'attacking'].includes(agent.state),
    showFamily: nearFamily && !nearEnemy && !nearFriend, // Only show if not already showing heart/anger
  };
}

// Draw relationship icons above agent
function drawRelationshipIcons(g: PIXI.Graphics, icons: RelationshipIcons, frame: number) {
  g.clear();

  const activeIcons: { type: string; color: number }[] = [];
  if (icons.showHeart) activeIcons.push({ type: 'heart', color: 0xFF69B4 });
  if (icons.showAnger) activeIcons.push({ type: 'anger', color: 0xFF4444 });
  if (icons.showFamily) activeIcons.push({ type: 'family', color: 0xFFD700 });

  if (activeIcons.length === 0) return;

  const iconSpacing = 16;
  const startX = -((activeIcons.length - 1) * iconSpacing) / 2;
  const baseY = -55;

  activeIcons.forEach((icon, index) => {
    const x = startX + index * iconSpacing;
    const y = baseY + Math.sin(frame * 0.1 + index) * 2; // Gentle bob
    const scale = 0.8 + Math.sin(frame * 0.15 + index) * 0.1; // Pulse

    g.beginFill(icon.color, 0.9);

    if (icon.type === 'heart') {
      // Draw heart
      const size = 5 * scale;
      g.moveTo(x, y + size * 0.5);
      g.bezierCurveTo(x - size, y - size * 0.3, x - size * 0.5, y - size, x, y - size * 0.3);
      g.bezierCurveTo(x + size * 0.5, y - size, x + size, y - size * 0.3, x, y + size * 0.5);
    } else if (icon.type === 'anger') {
      // Draw anger symbol (cross/X marks)
      g.lineStyle(2, icon.color, 0.9);
      g.moveTo(x - 4 * scale, y - 4 * scale);
      g.lineTo(x + 4 * scale, y + 4 * scale);
      g.moveTo(x + 4 * scale, y - 4 * scale);
      g.lineTo(x - 4 * scale, y + 4 * scale);
      g.lineStyle(0);
    } else if (icon.type === 'family') {
      // Draw family/star symbol
      const starSize = 5 * scale;
      const starPoints: number[] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 72 - 90) * Math.PI / 180;
        const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
        starPoints.push(x + Math.cos(outerAngle) * starSize);
        starPoints.push(y + Math.sin(outerAngle) * starSize);
        starPoints.push(x + Math.cos(innerAngle) * starSize * 0.4);
        starPoints.push(y + Math.sin(innerAngle) * starSize * 0.4);
      }
      g.drawPolygon(starPoints);
    }

    g.endFill();
  });
}

// Determine expression based on agent state
function getExpression(agent: Agent): Expression {
  if (!agent.isAlive) return 'dead';

  // Crazed - alternate rapidly between scared and excited
  if (agent.state === 'crazed') {
    return Math.random() < 0.5 ? 'scared' : 'excited';
  }

  // Aggressive/attacking - scared/angry look
  if (agent.state === 'aggressive' || agent.state === 'attacking') {
    return 'scared'; // Using scared as it's the most intense expression we have
  }

  // Hurt - sad
  if (agent.state === 'hurt') {
    return 'sad';
  }

  // Loved/bonding - excited (happy)
  if (agent.state === 'loved' || agent.state === 'bonding') {
    return 'excited';
  }

  // Scared states
  if (['panicking', 'fleeing', 'mourning', 'questioning'].includes(agent.state)) {
    return 'scared';
  }

  // Eating/bathing/playing - excited or eating
  if (agent.state === 'eating') return 'eating';
  if (['bathing', 'playing'].includes(agent.state)) return 'excited';

  // Sad when needs are low
  if (agent.hunger < 30 || agent.cleanliness < 30 || agent.entertainment < 30) {
    return 'sad';
  }

  // Excited when very happy
  if (agent.hunger > 80 && agent.cleanliness > 80 && agent.entertainment > 80 && agent.traumaLevel < 2) {
    return 'excited';
  }

  // Happy by default
  return 'happy';
}

export function Game() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const worldContainerRef = useRef<PIXI.Container | null>(null);
  const texturesRef = useRef<Record<string, PIXI.Texture>>({});
  const agentSpritesRef = useRef<Map<string, PIXI.Container>>(new Map());
  const structureSpritesRef = useRef<Map<string, PIXI.Sprite>>(new Map());
  const boneSpritesRef = useRef<Map<string, PIXI.Graphics>>(new Map());
  const foodSpritesRef = useRef<Map<string, PIXI.Graphics>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const animationFrameRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const lastDragPosRef = useRef({ x: 0, y: 0 });
  const keysDownRef = useRef<Set<string>>(new Set());

  const {
    agents,
    structures,
    bones,
    foods,
    mood,
    selectedAgentId,
    currentTool,
    cameraX,
    cameraY,
    runTick,
    moveCamera,
  } = useGameStore();

  // Keyboard controls for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Camera movement loop
    const CAMERA_SPEED = 8;
    const cameraLoop = setInterval(() => {
      const keys = keysDownRef.current;
      let dx = 0;
      let dy = 0;

      if (keys.has('w') || keys.has('arrowup')) dy -= CAMERA_SPEED;
      if (keys.has('s') || keys.has('arrowdown')) dy += CAMERA_SPEED;
      if (keys.has('a') || keys.has('arrowleft')) dx -= CAMERA_SPEED;
      if (keys.has('d') || keys.has('arrowright')) dx += CAMERA_SPEED;

      if (dx !== 0 || dy !== 0) {
        useGameStore.getState().moveCamera(dx, dy);
      }
    }, 16);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(cameraLoop);
    };
  }, []);

  // Initialize PixiJS and load textures
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new PIXI.Application({
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
      backgroundColor: 0x2D5A27,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    canvasRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // Create world container that will be panned
    const worldContainer = new PIXI.Container();
    worldContainerRef.current = worldContainer;
    app.stage.addChild(worldContainer);

    // Load all textures
    const loadTextures = async () => {
      try {
        for (const [name, url] of Object.entries(SPRITES)) {
          texturesRef.current[name] = await PIXI.Texture.from(url);
        }
        setIsReady(true);
      } catch (err) {
        console.error('Failed to load textures:', err);
      }
    };

    loadTextures();

    // Create grass background
    const grassGfx = new PIXI.Graphics();
    grassGfx.beginFill(0x2D5A27);
    grassGfx.drawRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    grassGfx.endFill();

    // Add some grass texture dots
    for (let x = 0; x < WORLD_WIDTH; x += 12) {
      for (let y = 0; y < WORLD_HEIGHT; y += 12) {
        const shade = Math.random() > 0.5 ? 0x1B4D1B : 0x3D7A3D;
        const alpha = 0.3 + Math.random() * 0.3;
        grassGfx.beginFill(shade, alpha);
        grassGfx.drawCircle(x + Math.random() * 8, y + Math.random() * 8, 1 + Math.random() * 2);
        grassGfx.endFill();
      }
    }
    worldContainer.addChild(grassGfx);

    // Click handler
    const canvas = app.view as HTMLCanvasElement;

    const handleMouseDown = (e: MouseEvent) => {
      // Middle mouse button or shift+click for dragging
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isDraggingRef.current = true;
        lastDragPosRef.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = lastDragPosRef.current.x - e.clientX;
        const dy = lastDragPosRef.current.y - e.clientY;
        useGameStore.getState().moveCamera(dx, dy);
        lastDragPosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        canvas.style.cursor = 'default';
      }
    };

    const clickHandler = (e: MouseEvent) => {
      // Don't process clicks while dragging
      if (isDraggingRef.current) return;
      if (e.shiftKey) return; // Shift+click is for panning

      const rect = canvas.getBoundingClientRect();
      const scaleX = VIEWPORT_WIDTH / rect.width;
      const scaleY = VIEWPORT_HEIGHT / rect.height;

      // Convert screen position to world position
      const state = useGameStore.getState();
      const worldX = (e.clientX - rect.left) * scaleX + state.cameraX;
      const worldY = (e.clientY - rect.top) * scaleY + state.cameraY;

      useGameStore.getState().handleWorldClick(worldX, worldY);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('click', clickHandler);

    // Prevent context menu on right-click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Animation loop for bobbing
    let frame = 0;
    const animate = () => {
      frame++;
      animationFrameRef.current = frame;

      // Update agent animations
      for (const [id, container] of agentSpritesRef.current) {
        const agent = useGameStore.getState().agents.find(a => a.id === id);
        if (!agent || !agent.isAlive) continue;

        // Idle bobbing animation
        const bobSpeed = agent.state === 'playing' || agent.state === 'loved' ? 0.15 : 0.08;
        const bobAmount = agent.state === 'playing' || agent.state === 'loved' ? 3 : 1.5;
        const bob = Math.sin(frame * bobSpeed + container.x * 0.1) * bobAmount;

        // Apply bobbing to the sprite container's children
        const sprites = container.children;
        for (const child of sprites) {
          if (child.name?.startsWith('sprite-')) {
            child.y = bob;
          }
        }

        // Squash and stretch for excited/playing
        if (['excited', 'playing', 'eating'].includes(agent.state)) {
          const squash = 1 + Math.sin(frame * 0.2) * 0.05;
          for (const child of sprites) {
            if (child.name?.startsWith('sprite-') && child instanceof PIXI.Sprite) {
              child.scale.y = 0.5 * squash;
            }
          }
        }

        // Update speech bubble
        const speechBubble = container.getChildByName('speech-bubble') as PIXI.Graphics;
        if (speechBubble) {
          const { need, isUp } = getNeedToShow(agent);
          drawSpeechBubble(speechBubble, need, isUp, frame);
        }
      }

      requestAnimationFrame(animate);
    };
    const animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      canvas.removeEventListener('click', clickHandler);
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
        worldContainerRef.current = null;
        agentSpritesRef.current.clear();
        structureSpritesRef.current.clear();
        boneSpritesRef.current.clear();
        foodSpritesRef.current.clear();
        texturesRef.current = {};
      }
    };
  }, []);

  // Update camera position (pan the world container)
  useEffect(() => {
    if (worldContainerRef.current) {
      worldContainerRef.current.x = -cameraX;
      worldContainerRef.current.y = -cameraY;
    }
  }, [cameraX, cameraY]);

  // Update cursor based on tool
  useEffect(() => {
    if (!appRef.current) return;
    const canvas = appRef.current.view as HTMLCanvasElement;

    if (['poke', 'rock', 'zap', 'fire', 'ice'].includes(currentTool)) {
      canvas.style.cursor = 'crosshair';
    } else if (['spawn', 'apple_tree', 'bathtub', 'carousel', 'feed'].includes(currentTool)) {
      canvas.style.cursor = 'cell';
    } else if (currentTool === 'pet') {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
    }
  }, [currentTool]);

  // Game loop
  useEffect(() => {
    const interval = setInterval(runTick, 50);
    return () => clearInterval(interval);
  }, [runTick]);

  // Render loop
  useEffect(() => {
    const worldContainer = worldContainerRef.current;
    if (!worldContainer || !isReady) return;

    // Update structures
    const existingStructureIds = new Set(structures.map(s => s.id));

    for (const [id, sprite] of structureSpritesRef.current) {
      if (!existingStructureIds.has(id)) {
        worldContainer.removeChild(sprite);
        structureSpritesRef.current.delete(id);
      }
    }

    for (const structure of structures) {
      let sprite = structureSpritesRef.current.get(structure.id);
      if (!sprite) {
        const textureName = structure.type === 'apple_tree' ? 'tree' : structure.type;
        const texture = texturesRef.current[textureName];
        if (texture) {
          sprite = new PIXI.Sprite(texture);
          sprite.anchor.set(0.5, 0.9);
          sprite.scale.set(0.7); // Make structures smaller
          worldContainer.addChild(sprite);
          structureSpritesRef.current.set(structure.id, sprite);
        }
      }
      if (sprite) {
        sprite.x = structure.x;
        sprite.y = structure.y;
      }
    }

    // Update bones
    const existingBoneIds = new Set(bones.map(b => b.id));

    for (const [id, sprite] of boneSpritesRef.current) {
      if (!existingBoneIds.has(id)) {
        worldContainer.removeChild(sprite);
        boneSpritesRef.current.delete(id);
      }
    }

    for (const bone of bones) {
      let sprite = boneSpritesRef.current.get(bone.id);
      if (!sprite) {
        sprite = new PIXI.Graphics();
        sprite.beginFill(0xF5F5DC);
        sprite.drawEllipse(0, 0, 8, 3);
        sprite.drawCircle(-7, -2, 3);
        sprite.drawCircle(-7, 2, 3);
        sprite.drawCircle(7, -2, 3);
        sprite.drawCircle(7, 2, 3);
        sprite.endFill();
        worldContainer.addChild(sprite);
        boneSpritesRef.current.set(bone.id, sprite);
      }
      sprite.x = bone.x;
      sprite.y = bone.y;
    }

    // Update foods (dropped apples)
    const existingFoodIds = new Set(foods.map(f => f.id));

    for (const [id, sprite] of foodSpritesRef.current) {
      if (!existingFoodIds.has(id)) {
        worldContainer.removeChild(sprite);
        foodSpritesRef.current.delete(id);
      }
    }

    for (const food of foods) {
      let sprite = foodSpritesRef.current.get(food.id);
      if (!sprite) {
        sprite = new PIXI.Graphics();
        // Draw apple
        sprite.beginFill(0xE53935); // Red apple
        sprite.drawCircle(0, 0, 8);
        sprite.endFill();
        // Stem
        sprite.beginFill(0x5C4033);
        sprite.drawRect(-1, -11, 2, 4);
        sprite.endFill();
        // Leaf
        sprite.beginFill(0x4CAF50);
        sprite.drawEllipse(4, -9, 4, 2);
        sprite.endFill();
        // Highlight
        sprite.beginFill(0xFFFFFF, 0.3);
        sprite.drawCircle(-3, -3, 2);
        sprite.endFill();
        worldContainer.addChild(sprite);
        foodSpritesRef.current.set(food.id, sprite);
      }
      sprite.x = food.x;
      sprite.y = food.y;
    }

    // Update agents
    const existingAgentIds = new Set(agents.map(a => a.id));

    for (const [id, container] of agentSpritesRef.current) {
      if (!existingAgentIds.has(id)) {
        worldContainer.removeChild(container);
        agentSpritesRef.current.delete(id);
      }
    }

    for (const agent of agents) {
      let container = agentSpritesRef.current.get(agent.id);
      const expression = getExpression(agent);
      const spriteKey = getSpriteKey(expression);

      if (!container) {
        container = new PIXI.Container();

        // Shadow (drawn first, at bottom)
        const shadow = new PIXI.Graphics();
        shadow.name = 'shadow';
        shadow.beginFill(0x000000, 0.25);
        shadow.drawEllipse(0, 12, 14, 5);
        shadow.endFill();
        container.addChild(shadow);

        // Selection ring (behind sprite)
        const selectionRing = new PIXI.Graphics();
        selectionRing.name = 'selection';
        selectionRing.visible = false;
        container.addChild(selectionRing);

        // Create all expression sprites
        for (const [key, texture] of Object.entries(texturesRef.current)) {
          if (key.startsWith('crawling')) {
            const sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5, 0.5);
            sprite.scale.set(0.5);
            sprite.name = `sprite-${key}`;
            sprite.visible = false;
            container.addChild(sprite);
          }
        }

        // Effect overlay
        const effectOverlay = new PIXI.Graphics();
        effectOverlay.name = 'effect';
        container.addChild(effectOverlay);

        // Relationship icons (above everything)
        const relationshipIcons = new PIXI.Graphics();
        relationshipIcons.name = 'relationship-icons';
        container.addChild(relationshipIcons);

        // Speech bubble for needs
        const speechBubble = new PIXI.Graphics();
        speechBubble.name = 'speech-bubble';
        container.addChild(speechBubble);

        worldContainer.addChild(container);
        agentSpritesRef.current.set(agent.id, container);
      }

      // Update container position
      container.x = agent.x;
      container.y = agent.y;

      // Shake effect for panicking/zapped
      if (['panicking', 'zapped'].includes(agent.state)) {
        container.x += Math.sin(agent.frame * 0.5) * 3;
      }

      // Crazed crawlings shake violently and erratically
      if (agent.state === 'crazed') {
        container.x += Math.sin(agent.frame * 0.8) * 4 + (Math.random() - 0.5) * 3;
        container.y += Math.cos(agent.frame * 0.6) * 2 + (Math.random() - 0.5) * 2;
        container.rotation = Math.sin(agent.frame * 0.3) * 0.15;
      } else if (agent.state === 'aggressive' || agent.state === 'attacking') {
        // Aggressive crawlings shake with anger
        container.x += Math.sin(agent.frame * 0.5) * 2;
        container.rotation = Math.sin(agent.frame * 0.2) * 0.08;
      } else if (agent.state === 'hurt') {
        // Hurt crawlings recoil
        container.y -= 3;
        container.rotation = Math.sin(agent.frame * 0.3) * 0.1;
      } else if (agent.state === 'loved') {
        // Loved crawlings float up slightly
        container.y -= Math.sin(agent.frame * 0.2) * 2;
      } else {
        container.rotation = 0;
      }

      // Get variant base tint
      const variantTint = getVariantTint(agent.variantId);

      // Show correct expression sprite
      for (const child of container.children) {
        if (child.name?.startsWith('sprite-')) {
          const isCurrentExpression = child.name === `sprite-${spriteKey}`;
          child.visible = isCurrentExpression;

          if (isCurrentExpression && child instanceof PIXI.Sprite) {
            // Apply direction
            child.scale.x = 0.5 * agent.direction;

            // Apply tint: blend variant color with state color
            if (agent.state === 'frozen') {
              child.tint = blendColors(variantTint, 0xADD8E6, 0.3);
            } else if (agent.state === 'burning') {
              child.tint = blendColors(variantTint, 0xFFAA66, 0.3);
            } else if (agent.state === 'zapped') {
              child.tint = blendColors(variantTint, 0xFFFFAA, 0.3);
            } else if (agent.state === 'crazed') {
              // Pulsing purple/magenta tint for crazed
              const pulse = Math.sin(animationFrameRef.current * 0.1) * 0.3 + 0.7;
              const r = Math.floor(255 * pulse);
              const g = Math.floor(100 * (1 - pulse * 0.5));
              const b = Math.floor(200 + 55 * pulse);
              const crazedColor = (r << 16) | (g << 8) | b;
              child.tint = blendColors(variantTint, crazedColor, 0.25);
            } else if (agent.state === 'loved') {
              // Pink tint when being petted
              child.tint = blendColors(variantTint, 0xFFB6C1, 0.4);
            } else if (agent.state === 'aggressive' || agent.state === 'attacking') {
              // Red tint when aggressive
              const pulse = Math.sin(animationFrameRef.current * 0.15) * 0.2 + 0.8;
              const aggressiveColor = (Math.floor(255 * pulse) << 16) | (Math.floor(100 * (1 - pulse * 0.3)) << 8) | Math.floor(100 * (1 - pulse * 0.3));
              child.tint = blendColors(variantTint, aggressiveColor, 0.3);
            } else if (agent.state === 'hurt') {
              // Flash white/red when hurt
              const flash = Math.sin(animationFrameRef.current * 0.3) > 0;
              child.tint = flash ? blendColors(variantTint, 0xFF6666, 0.4) : variantTint;
            } else if (agent.state === 'bonding') {
              // Warm yellow tint when bonding
              child.tint = blendColors(variantTint, 0xFFE4B5, 0.4);
            } else {
              // Normal state: use variant tint
              child.tint = variantTint;
            }
          }
        }
      }

      // Update relationship icons
      const relationshipIcons = container.getChildByName('relationship-icons') as PIXI.Graphics;
      if (relationshipIcons && agent.isAlive) {
        const icons = getRelationshipIcons(agent, agents);
        drawRelationshipIcons(relationshipIcons, icons, animationFrameRef.current);
      }

      // Update selection ring
      const selectionRing = container.getChildByName('selection') as PIXI.Graphics;
      const isSelected = agent.id === selectedAgentId;
      selectionRing.visible = isSelected;
      if (isSelected) {
        selectionRing.clear();
        selectionRing.lineStyle(3, 0x00f0ff, 0.8);
        selectionRing.drawCircle(0, 0, 22);
      }

      // Update effects
      const effectOverlay = container.getChildByName('effect') as PIXI.Graphics;
      effectOverlay.clear();

      if (agent.state === 'burning' && agent.isAlive) {
        effectOverlay.beginFill(0xFF6B00, 0.8);
        for (let i = 0; i < 4; i++) {
          const flicker = Math.sin(animationFrameRef.current * 0.3 + i) * 3;
          effectOverlay.drawEllipse(-6 + i * 4, -22 - i * 2 + flicker, 4, 8);
        }
        effectOverlay.endFill();
      }

      if (agent.state === 'frozen' && agent.isAlive) {
        effectOverlay.beginFill(0x87CEEB, 0.3);
        effectOverlay.drawRoundedRect(-20, -22, 40, 44, 6);
        effectOverlay.endFill();
        effectOverlay.lineStyle(2, 0xADD8E6, 0.6);
        effectOverlay.drawRoundedRect(-20, -22, 40, 44, 6);
      }

      if (agent.state === 'zapped' && agent.isAlive) {
        effectOverlay.lineStyle(3, 0xFFE66D);
        effectOverlay.moveTo(0, -28);
        effectOverlay.lineTo(5, -14);
        effectOverlay.lineTo(-3, -10);
        effectOverlay.lineTo(8, 5);
      }

      // Bathing bubbles effect
      if (agent.state === 'bathing' && agent.isAlive) {
        const bubbleTime = animationFrameRef.current * 0.05 + agent.x * 0.1;
        effectOverlay.lineStyle(1, 0x87CEEB, 0.6);

        // Draw several small bubbles floating up
        for (let i = 0; i < 5; i++) {
          const bubbleOffset = (bubbleTime + i * 1.3) % 3;
          const bubbleX = Math.sin(bubbleTime * 0.8 + i * 2) * 8;
          const bubbleY = -5 - bubbleOffset * 12;
          const bubbleSize = 2 + Math.sin(i * 1.5) * 1;
          const bubbleAlpha = 0.8 - bubbleOffset * 0.25;

          effectOverlay.beginFill(0xaaeeff, bubbleAlpha);
          effectOverlay.drawCircle(bubbleX, bubbleY, bubbleSize);
          effectOverlay.endFill();

          // Bubble highlight
          effectOverlay.beginFill(0xffffff, bubbleAlpha * 0.5);
          effectOverlay.drawCircle(bubbleX - bubbleSize * 0.3, bubbleY - bubbleSize * 0.3, bubbleSize * 0.3);
          effectOverlay.endFill();
        }
      }

      // Crazed effect - chaotic swirls and spirals
      if (agent.state === 'crazed' && agent.isAlive) {
        const chaosTime = animationFrameRef.current * 0.1;

        // Swirling chaos particles
        for (let i = 0; i < 6; i++) {
          const angle = chaosTime + i * (Math.PI / 3);
          const radius = 15 + Math.sin(chaosTime * 2 + i) * 5;
          const particleX = Math.cos(angle) * radius;
          const particleY = Math.sin(angle) * radius - 5;

          // Alternating purple and magenta particles
          const color = i % 2 === 0 ? 0xff00ff : 0x9900ff;
          const alpha = 0.6 + Math.sin(chaosTime + i) * 0.3;

          effectOverlay.beginFill(color, alpha);
          effectOverlay.drawCircle(particleX, particleY, 3);
          effectOverlay.endFill();
        }

        // Spiral trail
        effectOverlay.lineStyle(2, 0xff66ff, 0.4);
        for (let t = 0; t < Math.PI * 2; t += 0.2) {
          const spiralRadius = 8 + t * 3;
          const spiralX = Math.cos(t + chaosTime) * spiralRadius;
          const spiralY = Math.sin(t + chaosTime) * spiralRadius * 0.5 - 5;
          if (t === 0) {
            effectOverlay.moveTo(spiralX, spiralY);
          } else {
            effectOverlay.lineTo(spiralX, spiralY);
          }
        }

        // Question marks and exclamation marks floating
        effectOverlay.lineStyle(2, 0xffff00, 0.8);
        const symbolY = -35 + Math.sin(chaosTime * 3) * 3;
        effectOverlay.moveTo(-8, symbolY - 5);
        effectOverlay.lineTo(-8, symbolY + 2);
        effectOverlay.moveTo(-8, symbolY + 5);
        effectOverlay.lineTo(-8, symbolY + 6);

        effectOverlay.moveTo(8, symbolY - 5);
        effectOverlay.bezierCurveTo(12, symbolY - 5, 12, symbolY, 8, symbolY);
        effectOverlay.bezierCurveTo(4, symbolY, 4, symbolY + 3, 8, symbolY + 3);
        effectOverlay.moveTo(8, symbolY + 5);
        effectOverlay.lineTo(8, symbolY + 6);
      }

      // Loved effect - floating hearts
      if (agent.state === 'loved' && agent.isAlive) {
        const loveTime = animationFrameRef.current * 0.08;

        for (let i = 0; i < 4; i++) {
          const heartY = -25 - ((loveTime + i * 0.8) % 2) * 15;
          const heartX = Math.sin(loveTime * 2 + i * 1.5) * 10;
          const heartAlpha = 1 - ((loveTime + i * 0.8) % 2) * 0.5;
          const heartScale = 0.6 + Math.sin(loveTime + i) * 0.2;

          effectOverlay.beginFill(0xFF69B4, heartAlpha);
          // Draw heart shape
          const hx = heartX;
          const hy = heartY;
          const size = 4 * heartScale;
          effectOverlay.moveTo(hx, hy + size * 0.5);
          effectOverlay.bezierCurveTo(hx - size, hy - size * 0.3, hx - size * 0.5, hy - size, hx, hy - size * 0.3);
          effectOverlay.bezierCurveTo(hx + size * 0.5, hy - size, hx + size, hy - size * 0.3, hx, hy + size * 0.5);
          effectOverlay.endFill();
        }
      }

      // Aggressive effect - anger marks
      if (agent.state === 'aggressive' && agent.isAlive) {
        const angerTime = animationFrameRef.current * 0.15;

        // Anger veins/marks
        effectOverlay.lineStyle(2, 0xFF0000, 0.8);
        const markX = 8 + Math.sin(angerTime) * 2;
        const markY = -25;

        // Cross mark (anger symbol)
        effectOverlay.moveTo(markX - 4, markY - 4);
        effectOverlay.lineTo(markX + 4, markY + 4);
        effectOverlay.moveTo(markX + 4, markY - 4);
        effectOverlay.lineTo(markX - 4, markY + 4);

        // Second mark
        effectOverlay.moveTo(-markX - 4, markY - 2);
        effectOverlay.lineTo(-markX + 4, markY + 6);
        effectOverlay.moveTo(-markX + 4, markY - 2);
        effectOverlay.lineTo(-markX - 4, markY + 6);
      }

      // Attacking effect - impact lines
      if (agent.state === 'attacking' && agent.isAlive) {
        const attackTime = animationFrameRef.current * 0.2;

        effectOverlay.lineStyle(3, 0xFF0000, 0.9);

        // Radiating impact lines
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + attackTime;
          const innerR = 15;
          const outerR = 25 + Math.sin(attackTime * 3 + i) * 5;

          effectOverlay.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
          effectOverlay.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
        }

        // Exclamation mark
        effectOverlay.lineStyle(0);
        effectOverlay.beginFill(0xFF0000);
        effectOverlay.drawRect(-2, -40, 4, 12);
        effectOverlay.drawCircle(0, -24, 2);
        effectOverlay.endFill();
      }

      // Hurt effect - pain stars
      if (agent.state === 'hurt' && agent.isAlive) {
        const hurtTime = animationFrameRef.current * 0.2;

        // Pain stars circling head
        for (let i = 0; i < 3; i++) {
          const angle = hurtTime + i * (Math.PI * 2 / 3);
          const starX = Math.cos(angle) * 15;
          const starY = -28 + Math.sin(angle) * 5;

          effectOverlay.beginFill(0xFFFF00, 0.9);
          // Draw small star
          const starPoints: number[] = [];
          for (let j = 0; j < 5; j++) {
            const outerAngle = (j * 72 - 90) * Math.PI / 180;
            const innerAngle = ((j * 72) + 36 - 90) * Math.PI / 180;
            starPoints.push(starX + Math.cos(outerAngle) * 4);
            starPoints.push(starY + Math.sin(outerAngle) * 4);
            starPoints.push(starX + Math.cos(innerAngle) * 2);
            starPoints.push(starY + Math.sin(innerAngle) * 2);
          }
          effectOverlay.drawPolygon(starPoints);
          effectOverlay.endFill();
        }
      }

      // Bonding effect - connection sparkles
      if (agent.state === 'bonding' && agent.isAlive) {
        const bondTime = animationFrameRef.current * 0.1;

        // Sparkles
        for (let i = 0; i < 5; i++) {
          const sparkleY = -20 - ((bondTime + i * 0.5) % 1.5) * 20;
          const sparkleX = Math.sin(bondTime * 3 + i * 1.2) * 12;
          const sparkleAlpha = 1 - ((bondTime + i * 0.5) % 1.5) * 0.6;

          effectOverlay.beginFill(0xFFD700, sparkleAlpha);
          // Draw sparkle (4-pointed star)
          effectOverlay.moveTo(sparkleX, sparkleY - 3);
          effectOverlay.lineTo(sparkleX + 1, sparkleY - 1);
          effectOverlay.lineTo(sparkleX + 3, sparkleY);
          effectOverlay.lineTo(sparkleX + 1, sparkleY + 1);
          effectOverlay.lineTo(sparkleX, sparkleY + 3);
          effectOverlay.lineTo(sparkleX - 1, sparkleY + 1);
          effectOverlay.lineTo(sparkleX - 3, sparkleY);
          effectOverlay.lineTo(sparkleX - 1, sparkleY - 1);
          effectOverlay.closePath();
          effectOverlay.endFill();
        }

        // Warm glow
        effectOverlay.beginFill(0xFFE4B5, 0.2);
        effectOverlay.drawCircle(0, 0, 20);
        effectOverlay.endFill();
      }
    }

    // Depth sorting - sort all children by Y position
    // Objects with lower Y appear behind, higher Y appears in front
    worldContainer.children.sort((a, b) => {
      // Keep grass background always at back
      if (a.name === 'grass' || !a.y) return -1;
      if (b.name === 'grass' || !b.y) return 1;
      return a.y - b.y;
    });

  }, [agents, structures, bones, foods, selectedAgentId, isReady]);

  // Update background based on mood
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    const colors: Record<string, number> = {
      neutral: 0x2D5A27,
      anxious: 0x3D4A27,
      fearful: 0x4D2A27,
    };

    app.renderer.background.color = colors[mood] || colors.neutral;
  }, [mood]);

  const moodConfig: Record<string, { text: string; color: string; bgAccent: string }> = {
    neutral: { text: 'A peaceful day in the colony', color: '#00f0ff', bgAccent: 'rgba(0, 240, 255, 0.03)' },
    anxious: { text: 'The colony is getting anxious...', color: '#ffaa00', bgAccent: 'rgba(255, 170, 0, 0.03)' },
    fearful: { text: 'The colony is terrified!', color: '#ff00aa', bgAccent: 'rgba(255, 0, 170, 0.05)' },
    chaotic: { text: 'Chaos reigns!', color: '#ff00ff', bgAccent: 'rgba(255, 0, 255, 0.05)' },
  };

  const currentMood = moodConfig[mood] || moodConfig.neutral;

  return (
    <div className="min-h-screen bg-animated noise-overlay">
      {/* Background music player */}
      <MusicPlayer />

      {/* Gradient overlay based on mood */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${currentMood.bgAccent} 0%, transparent 70%)` }}
      />

      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <header className="mb-6 max-w-[1280px] mx-auto">
          <div className="wood-panel p-3">
            <div className="wood-panel-inner py-3 px-6 flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="text-4xl">🦞</div>
                <div>
                  <h1 className="font-title text-4xl text-[#5d3a1a]" style={{ textShadow: '2px 2px 0 rgba(255,255,255,0.3), -1px -1px 0 rgba(0,0,0,0.1)' }}>
                    CLAWLINGS
                  </h1>
                  <p className="text-xs text-[#8b6914] font-bold tracking-widest uppercase">
                    A cozy creature colony
                  </p>
                </div>
              </div>

              {/* Mood indicator */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: `${currentMood.color}15`, border: `2px solid ${currentMood.color}30` }}>
                <span className="text-2xl">{mood === 'fearful' ? '😰' : mood === 'anxious' ? '😟' : '😊'}</span>
                <div>
                  <div className="text-xs font-bold tracking-wide uppercase" style={{ color: currentMood.color }}>
                    {mood === 'fearful' ? 'Terrified' : mood === 'anxious' ? 'Anxious' : 'Peaceful'}
                  </div>
                  <div className="text-[10px] text-[#7a5c42]">{currentMood.text}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex gap-6 max-w-[1280px] mx-auto">
          {/* Main game area */}
          <div className="flex-1">
            <Toolbar />

            {/* Game canvas with modern frame */}
            <div className="game-frame relative">
              <div
                ref={canvasRef}
                className="game-screen overflow-hidden"
                style={{
                  width: VIEWPORT_WIDTH,
                  height: VIEWPORT_HEIGHT,
                }}
              />
              {/* Minimap overlay */}
              <Minimap />

              {/* Pan controls hint */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-[#4a4460] font-medium tracking-wide">
                <span className="px-2 py-1 rounded bg-[#14111f] border border-[#242035]">WASD</span>
                <span>or</span>
                <span className="px-2 py-1 rounded bg-[#14111f] border border-[#242035]">Shift+Drag</span>
                <span>to pan</span>
              </div>
            </div>

            <StatsBar />
          </div>

          {/* Side panel */}
          <div className="w-[320px] flex flex-col gap-4">
            <AgentPanel />
            <MoltbookFeed />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8">
          <p
            className={`text-sm font-medium tracking-wide ${
              useGameStore.getState().stats.murdered > 5 ? 'text-glow-pink animate-pulse-glow' : 'text-[#4a4460]'
            }`}
          >
            {useGameStore.getState().stats.murdered > 10 ? '💀 You monster...' :
              useGameStore.getState().stats.murdered > 5 ? '⚠ The clawlings are starting to fear you.' :
              '✨ Take care of your clawlings!'}
          </p>
        </footer>
      </div>
    </div>
  );
}
