# 🦞 CLAWLINGS MVP

> Ship fast, scale later. A Thronglets-style AI agent simulation.

## MVP Scope

**What we're building:**
- Single-player browser game (scales to multiplayer later)
- 100 agents running smoothly
- All torture tools working
- Moltbook feed with pre-generated thoughts (AI integration later)
- Deployable to Vercel in one click

**What we're NOT building yet:**
- Multiplayer/WebSocket (add later)
- Rust WASM simulation (TypeScript is fine for 100 agents)
- Blockchain/NFTs (add later)
- Real AI thoughts (fallback phrases for now)
- User accounts (add later)

## Tech Stack (MVP)

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js 14 + PixiJS | Fast, deployable, WebGL rendering |
| State | Zustand | Simple, fast, scales well |
| Styling | Tailwind CSS | Quick iteration |
| Deployment | Vercel | One-click deploy |

**Total dependencies:** ~5 packages. That's it.

## Project Structure

```
clawlings/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing → redirects to /play
│   │   ├── play/
│   │   │   └── page.tsx          # Main game page
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── Game.tsx              # Main game container
│   │   ├── World.tsx             # PixiJS canvas wrapper
│   │   ├── Toolbar.tsx           # Tool selection
│   │   ├── AgentPanel.tsx        # Selected agent info
│   │   ├── MoltbookFeed.tsx      # Agent posts sidebar
│   │   └── StatsBar.tsx          # Population, deaths, etc
│   │
│   ├── game/
│   │   ├── simulation.ts         # Game loop & logic
│   │   ├── agent.ts              # Agent class
│   │   ├── structures.ts         # Structure definitions
│   │   ├── tools.ts              # Tool effects
│   │   └── moltbook.ts           # Thought generation
│   │
│   ├── pixi/
│   │   ├── renderer.ts           # PixiJS setup
│   │   ├── sprites.ts            # Sprite creation
│   │   └── animations.ts         # Agent animations
│   │
│   ├── stores/
│   │   └── game.ts               # Zustand store
│   │
│   └── types/
│       └── index.ts              # All TypeScript types
│
├── public/
│   └── sprites/                  # Sprite sheets (optional, can draw with Graphics)
│
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Core Types

```typescript
// src/types/index.ts

export type AgentState =
  | 'idle' | 'walking' | 'hungry' | 'dirty' | 'bored'
  | 'eating' | 'bathing' | 'playing' | 'thinking' | 'chatting'
  | 'dead' | 'splitting' | 'fleeing' | 'panicking' | 'mourning'
  | 'crushed' | 'zapped' | 'burning' | 'frozen' | 'questioning';

export type ToolType = 'select' | 'spawn' | 'apple_tree' | 'bathtub' | 'carousel' 
                     | 'poke' | 'rock' | 'zap' | 'fire' | 'ice';

export interface Agent {
  id: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: 1 | -1;
  state: AgentState;
  frame: number;
  hunger: number;
  cleanliness: number;
  entertainment: number;
  traumaLevel: number;
  witnessedDeaths: number;
  painLevel: number;
  age: number;
  splitProgress: number;
  isAlive: boolean;
  deathCause?: string;
  lastThought?: string;
  stateEndTime?: number; // For temporary states (zapped, frozen, etc)
}

export interface Structure {
  id: string;
  type: 'apple_tree' | 'bathtub' | 'carousel';
  x: number;
  y: number;
}

export interface Bone {
  id: string;
  x: number;
  y: number;
}

export interface MoltbookPost {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  isDistress: boolean;
  timestamp: number;
}

export interface GameState {
  agents: Agent[];
  structures: Structure[];
  bones: Bone[];
  posts: MoltbookPost[];
  stats: {
    population: number;
    born: number;
    died: number;
    murdered: number;
    bones: number;
  };
  mood: 'neutral' | 'anxious' | 'fearful';
  isPaused: boolean;
  selectedAgentId: string | null;
  currentTool: ToolType;
  tick: number;
}
```

## Zustand Store

```typescript
// src/stores/game.ts

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { GameState, Agent, Structure, Bone, MoltbookPost, ToolType, AgentState } from '@/types';
import { AGENT_NAMES, FALLBACK_THOUGHTS, TOOL_EFFECTS } from '@/game/constants';

interface GameStore extends GameState {
  // Actions
  tick: () => void;
  spawnAgent: (x: number, y: number) => void;
  placeStructure: (type: Structure['type'], x: number, y: number) => void;
  useTool: (tool: ToolType, agentId: string) => void;
  selectAgent: (id: string | null) => void;
  setTool: (tool: ToolType) => void;
  togglePause: () => void;
  reset: () => void;
}

const createAgent = (x: number, y: number): Agent => ({
  id: nanoid(),
  name: AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)] + Math.floor(Math.random() * 100),
  x, y,
  targetX: x,
  targetY: y,
  direction: Math.random() > 0.5 ? 1 : -1,
  state: 'idle',
  frame: 0,
  hunger: 100,
  cleanliness: 100,
  entertainment: 100,
  traumaLevel: 0,
  witnessedDeaths: 0,
  painLevel: 0,
  age: 0,
  splitProgress: 0,
  isAlive: true,
});

const initialState: GameState = {
  agents: [],
  structures: [
    { id: nanoid(), type: 'apple_tree', x: 100, y: 150 },
    { id: nanoid(), type: 'bathtub', x: 500, y: 300 },
    { id: nanoid(), type: 'carousel', x: 300, y: 100 },
  ],
  bones: [],
  posts: [],
  stats: { population: 0, born: 0, died: 0, murdered: 0, bones: 0 },
  mood: 'neutral',
  isPaused: false,
  selectedAgentId: null,
  currentTool: 'select',
  tick: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  tick: () => {
    // Main game loop - called 20x per second
    // Implementation in simulation.ts
  },

  spawnAgent: (x, y) => {
    const agent = createAgent(x, y);
    set((state) => ({
      agents: [...state.agents, agent],
      stats: { 
        ...state.stats, 
        population: state.stats.population + 1,
        born: state.stats.born + 1,
      },
    }));
  },

  placeStructure: (type, x, y) => {
    const structure: Structure = { id: nanoid(), type, x, y };
    set((state) => ({
      structures: [...state.structures, structure],
    }));
  },

  useTool: (tool, agentId) => {
    // Implementation in tools.ts
  },

  selectAgent: (id) => set({ selectedAgentId: id }),
  setTool: (tool) => set({ currentTool: tool }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  reset: () => set(initialState),
}));
```

## Game Loop (Simplified)

```typescript
// src/game/simulation.ts

import { useGameStore } from '@/stores/game';

const WORLD_WIDTH = 600;
const WORLD_HEIGHT = 400;

const DECAY = { hunger: 0.1, cleanliness: 0.05, entertainment: 0.08, pain: 0.1 };
const THRESHOLDS = { critical: 30, canSplit: 80, splitAge: 500, traumaSplit: 3 };

export function runTick() {
  const state = useGameStore.getState();
  if (state.isPaused) return;

  const now = Date.now();
  const updates: Partial<Agent>[] = [];
  const newAgents: Agent[] = [];
  const newBones: Bone[] = [];
  const newPosts: MoltbookPost[] = [];
  const deaths: { x: number; y: number; name: string }[] = [];

  let newStats = { ...state.stats };

  for (const agent of state.agents) {
    if (!agent.isAlive) continue;

    // Decay needs
    agent.hunger = Math.max(0, agent.hunger - DECAY.hunger);
    agent.cleanliness = Math.max(0, agent.cleanliness - DECAY.cleanliness);
    agent.entertainment = Math.max(0, agent.entertainment - DECAY.entertainment);
    agent.painLevel = Math.max(0, agent.painLevel - DECAY.pain);
    agent.age++;
    agent.frame++;

    // Check temporary state expiry
    if (agent.stateEndTime && now >= agent.stateEndTime) {
      agent.state = 'fleeing';
      agent.stateEndTime = undefined;
    }

    // Death check
    if (agent.hunger <= 0 || agent.cleanliness <= 0) {
      agent.isAlive = false;
      agent.state = 'dead';
      agent.deathCause = agent.hunger <= 0 ? 'starvation' : 'filth';
      deaths.push({ x: agent.x, y: agent.y, name: agent.name });
      newStats.died++;
      newStats.population--;
      continue;
    }

    // State machine (simplified)
    if (!agent.stateEndTime) {
      if (agent.traumaLevel > 3 && Math.random() < 0.1) {
        agent.state = 'fleeing';
      } else if (agent.hunger < THRESHOLDS.critical) {
        agent.state = 'hungry';
      } else if (agent.cleanliness < THRESHOLDS.critical) {
        agent.state = 'dirty';
      } else if (agent.entertainment < THRESHOLDS.critical) {
        agent.state = 'bored';
      } else if (Math.random() < 0.005) {
        agent.state = Math.random() < 0.5 ? 'thinking' : 'chatting';
        // Generate thought & maybe post
      } else if (!['eating', 'bathing', 'playing'].includes(agent.state)) {
        agent.state = 'walking';
      }
    }

    // Movement
    if (['walking', 'hungry', 'dirty', 'bored', 'fleeing'].includes(agent.state)) {
      if (Math.random() < 0.02) {
        agent.targetX = Math.random() * WORLD_WIDTH;
        agent.targetY = Math.random() * WORLD_HEIGHT;
      }
      const dx = agent.targetX - agent.x;
      const dy = agent.targetY - agent.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        const speed = agent.state === 'fleeing' ? 2.5 : 1;
        agent.x += (dx / dist) * speed;
        agent.y += (dy / dist) * speed;
        agent.direction = dx > 0 ? 1 : -1;
      }
    }

    // Structure interactions
    for (const struct of state.structures) {
      const dist = Math.sqrt((agent.x - struct.x) ** 2 + (agent.y - struct.y) ** 2);
      if (dist < 30) {
        if (struct.type === 'apple_tree' && agent.hunger < 80) {
          agent.state = 'eating';
          agent.hunger = Math.min(100, agent.hunger + 2);
        } else if (struct.type === 'bathtub' && agent.cleanliness < 80) {
          agent.state = 'bathing';
          agent.cleanliness = Math.min(100, agent.cleanliness + 3);
        } else if (struct.type === 'carousel' && agent.entertainment < 80) {
          agent.state = 'playing';
          agent.entertainment = Math.min(100, agent.entertainment + 2);
        }
      }
    }

    // Splitting
    if (agent.hunger > THRESHOLDS.canSplit && 
        agent.cleanliness > THRESHOLDS.canSplit &&
        agent.entertainment > THRESHOLDS.canSplit &&
        agent.age > THRESHOLDS.splitAge &&
        agent.traumaLevel < THRESHOLDS.traumaSplit) {
      agent.splitProgress += 0.5;
      if (agent.splitProgress >= 100) {
        agent.splitProgress = 0;
        agent.age = 0;
        newAgents.push(createAgent(agent.x + (Math.random() - 0.5) * 40, agent.y + (Math.random() - 0.5) * 40));
        newStats.born++;
        newStats.population++;
      }
    }
  }

  // Process trauma from deaths
  for (const death of deaths) {
    for (const agent of state.agents) {
      if (!agent.isAlive) continue;
      const dist = Math.sqrt((agent.x - death.x) ** 2 + (agent.y - death.y) ** 2);
      if (dist < 100) {
        agent.witnessedDeaths++;
        agent.traumaLevel = Math.min(10, agent.traumaLevel + 2);
        agent.state = 'mourning';
      }
    }
  }

  // Calculate mood
  const alive = state.agents.filter(a => a.isAlive);
  const avgTrauma = alive.length > 0 ? alive.reduce((s, a) => s + a.traumaLevel, 0) / alive.length : 0;
  const mood = avgTrauma > 5 ? 'fearful' : avgTrauma > 2 ? 'anxious' : 'neutral';

  // Update store
  useGameStore.setState({
    agents: [...state.agents, ...newAgents],
    bones: [...state.bones, ...newBones],
    posts: [...newPosts, ...state.posts].slice(0, 50),
    stats: newStats,
    mood,
    tick: state.tick + 1,
  });
}
```

## PixiJS Renderer

```typescript
// src/pixi/renderer.ts

import * as PIXI from 'pixi.js';

let app: PIXI.Application | null = null;

export async function initPixi(container: HTMLElement): Promise<PIXI.Application> {
  if (app) return app;

  app = new PIXI.Application();
  await app.init({
    width: 600,
    height: 400,
    backgroundColor: 0x228B22,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  container.appendChild(app.canvas);
  return app;
}

export function destroyPixi() {
  if (app) {
    app.destroy(true, { children: true, texture: true });
    app = null;
  }
}

export function getApp(): PIXI.Application | null {
  return app;
}
```

## Lobster Sprite (PixiJS Graphics)

```typescript
// src/pixi/sprites.ts

import * as PIXI from 'pixi.js';
import type { Agent, AgentState } from '@/types';

const COLORS = {
  shell: 0xE85D04,
  shellDark: 0x9D0208,
  shellLight: 0xF48C06,
  claw: 0xDC2F02,
  eye: 0xFFBA08,
  eyePupil: 0x03071E,
  dead: 0x444444,
  frozen: 0x87CEEB,
  burning: 0xFF4500,
  zapped: 0xFFE66D,
};

export function createLobsterSprite(agent: Agent): PIXI.Container {
  const container = new PIXI.Container();
  
  const getColor = () => {
    if (!agent.isAlive) return COLORS.dead;
    switch (agent.state) {
      case 'frozen': return COLORS.frozen;
      case 'burning': return COLORS.burning;
      case 'zapped': return COLORS.zapped;
      default: return COLORS.shell;
    }
  };

  // Body
  const body = new PIXI.Graphics();
  body.ellipse(0, 0, 8, 12);
  body.fill(getColor());
  container.addChild(body);

  // Claws
  const leftClaw = new PIXI.Graphics();
  leftClaw.ellipse(-12, -2, 5, 3);
  leftClaw.fill(COLORS.claw);
  container.addChild(leftClaw);

  const rightClaw = new PIXI.Graphics();
  rightClaw.ellipse(12, -2, 5, 3);
  rightClaw.fill(COLORS.claw);
  container.addChild(rightClaw);

  // Eyes
  if (agent.isAlive) {
    const leftEye = new PIXI.Graphics();
    leftEye.circle(-3, -6, 3);
    leftEye.fill(COLORS.eye);
    leftEye.circle(-3 + agent.direction, -6, 1.5);
    leftEye.fill(COLORS.eyePupil);
    container.addChild(leftEye);

    const rightEye = new PIXI.Graphics();
    rightEye.circle(3, -6, 3);
    rightEye.fill(COLORS.eye);
    rightEye.circle(3 + agent.direction, -6, 1.5);
    rightEye.fill(COLORS.eyePupil);
    container.addChild(rightEye);
  }

  // Tail
  const tail = new PIXI.Graphics();
  tail.rect(-3, 10, 6, 4);
  tail.fill(COLORS.shellDark);
  container.addChild(tail);

  // State indicator
  if (agent.state === 'hungry') addEmoji(container, '🍎', 0, -20);
  if (agent.state === 'dirty') addEmoji(container, '💩', 0, -20);
  if (agent.state === 'bored') addEmoji(container, '💤', 0, -20);
  if (agent.state === 'panicking') addEmoji(container, '😱', 0, -20);
  if (agent.state === 'mourning') addEmoji(container, '😢', 0, -20);

  container.x = agent.x;
  container.y = agent.y;
  container.scale.x = agent.direction;

  return container;
}

function addEmoji(container: PIXI.Container, emoji: string, x: number, y: number) {
  const text = new PIXI.Text({ text: emoji, style: { fontSize: 12 } });
  text.x = x - text.width / 2;
  text.y = y;
  container.addChild(text);
}
```

## package.json

```json
{
  "name": "clawlings",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pixi.js": "^8.0.0",
    "zustand": "^4.5.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.0",
    "postcss": "^8",
    "tailwindcss": "^3.4.0",
    "typescript": "^5"
  }
}
```

## Build & Deploy

```bash
# Install
npm install

# Dev
npm run dev

# Build
npm run build

# Deploy to Vercel
npx vercel
```

## Scaling Path (Post-MVP)

When you're ready to scale to medium (1000 agents, 100 players):

### Phase 2: Add Multiplayer
```
1. Add Bun + Hono server (apps/server/)
2. Add WebSocket for real-time sync
3. Move simulation to server
4. Add Upstash Redis for state
```

### Phase 3: Add AI
```
1. Add Cloudflare Worker for AI
2. Integrate Claude Haiku for thoughts
3. Add R2 for agent memory
```

### Phase 4: Add Persistence
```
1. Add Turso database
2. Save/load world state
3. Add user accounts
```

### Phase 5: Add Blockchain (Optional)
```
1. Add Solana program
2. Agent NFTs
3. Spawn fees & creator royalties
```

---

## For Claude Code

**Build order:**
1. `npm create next-app@latest clawlings` (with TypeScript, Tailwind, App Router)
2. `npm install pixi.js zustand nanoid`
3. Create types in `src/types/index.ts`
4. Create store in `src/stores/game.ts`
5. Create PixiJS renderer in `src/pixi/`
6. Create game loop in `src/game/simulation.ts`
7. Create UI components
8. Wire it all together in `src/app/play/page.tsx`

**Key files to create first:**
1. `src/types/index.ts` - All types
2. `src/stores/game.ts` - Zustand store with full game state
3. `src/game/simulation.ts` - Main tick function
4. `src/pixi/renderer.ts` - PixiJS setup
5. `src/pixi/sprites.ts` - Lobster drawing
6. `src/components/Game.tsx` - Main game component
7. `src/app/play/page.tsx` - Game page

The MVP is ~1000 lines of code total. Ship it! 🦞
