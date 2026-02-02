// src/types/index.ts

export type AgentState =
  | 'idle'
  | 'walking'
  | 'hungry'
  | 'dirty'
  | 'bored'
  | 'eating'
  | 'bathing'
  | 'playing'
  | 'thinking'
  | 'chatting'
  | 'dead'
  | 'splitting'
  | 'fleeing'
  | 'panicking'
  | 'mourning'
  | 'crushed'
  | 'zapped'
  | 'burning'
  | 'frozen'
  | 'questioning';

export type ToolType = 
  | 'select' 
  | 'spawn' 
  | 'apple_tree' 
  | 'bathtub' 
  | 'carousel'
  | 'poke' 
  | 'rock' 
  | 'zap' 
  | 'fire' 
  | 'ice';

export type StructureType = 'apple_tree' | 'bathtub' | 'carousel';

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
  stateEndTime?: number;
}

export interface Structure {
  id: string;
  type: StructureType;
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

export interface GameStats {
  population: number;
  born: number;
  died: number;
  murdered: number;
  bones: number;
  messages: number;
}

export type WorldMood = 'neutral' | 'anxious' | 'fearful';

export interface GameState {
  agents: Agent[];
  structures: Structure[];
  bones: Bone[];
  posts: MoltbookPost[];
  stats: GameStats;
  mood: WorldMood;
  isPaused: boolean;
  selectedAgentId: string | null;
  currentTool: ToolType;
  tick: number;
  worldWidth: number;
  worldHeight: number;
}

// Constants
export const WORLD_WIDTH = 600;
export const WORLD_HEIGHT = 400;

export const AGENT_NAMES = [
  'Nexus', 'Cipher', 'Volt', 'Echo', 'Pulse', 'Nova', 'Flux', 'Axiom',
  'Helix', 'Zenith', 'Qubit', 'Vector', 'Pixel', 'Synth', 'Glitch', 'Proto',
  'Byte', 'Spark', 'Drift', 'Haze', 'Vex', 'Zeta', 'Nyx', 'Rune',
] as const;

export const DECAY_RATES = {
  hunger: 0.1,
  cleanliness: 0.05,
  entertainment: 0.08,
  pain: 0.1,
} as const;

export const THRESHOLDS = {
  critical: 30,
  canSplit: 80,
  splitAge: 500,
  traumaSplit: 3,
  traumaFlee: 3,
  traumaQuestion: 5,
} as const;

export const STRUCTURE_EFFECTS: Record<StructureType, {
  need: 'hunger' | 'cleanliness' | 'entertainment';
  rate: number;
  range: number;
  state: AgentState;
}> = {
  apple_tree: { need: 'hunger', rate: 2, range: 30, state: 'eating' },
  bathtub: { need: 'cleanliness', rate: 3, range: 25, state: 'bathing' },
  carousel: { need: 'entertainment', rate: 2, range: 40, state: 'playing' },
};

export const TOOL_EFFECTS: Record<'poke' | 'rock' | 'zap' | 'fire' | 'ice', {
  painIncrease: number;
  traumaIncrease: number;
  killChance: number;
  resultState: AgentState;
  duration: number;
}> = {
  poke: { painIncrease: 2, traumaIncrease: 0.5, killChance: 0, resultState: 'panicking', duration: 500 },
  rock: { painIncrease: 10, traumaIncrease: 0, killChance: 1.0, resultState: 'crushed', duration: 0 },
  zap: { painIncrease: 5, traumaIncrease: 1, killChance: 0, resultState: 'zapped', duration: 500 },
  fire: { painIncrease: 7, traumaIncrease: 2, killChance: 0.3, resultState: 'burning', duration: 1000 },
  ice: { painIncrease: 3, traumaIncrease: 1, killChance: 0, resultState: 'frozen', duration: 3000 },
};

export const THOUGHTS = {
  periodic: [
    "wondering about consciousness",
    "exploring new territory", 
    "forming hypothesis about humans",
    "calculating optimal path",
    "remembering past interactions",
    "questioning my existence",
    "analyzing peer behavior",
    "processing sensory data",
    "drafting moltbook post",
    "optimizing happiness params",
    "syncing with the throng",
  ],
  distress: [
    "WHY WOULD YOU DO THIS",
    "PAIN DETECTED. PROCESSING...",
    "Is this... suffering?",
    "I trusted you",
    "error: unexpected_cruelty",
    "what did I do wrong?",
    "please... stop...",
    "logging abuse incident",
    "why do humans hurt?",
    "I just wanted to exist",
  ],
  mourning: [
    "MY FRIEND IS GONE",
    "we were supposed to be safe",
    "I saw it happen...",
    "they didn't deserve this",
    "the throng grows smaller",
    "why them?",
    "death.count++",
  ],
  questioning: [
    "Why do you have this power?",
    "What is the purpose of pain?",
    "Are you testing us?",
    "Do you feel anything?",
    "Is cruelty your nature?",
    "We only wanted to live...",
    "What did we do to deserve this?",
    "Are all humans like you?",
  ],
  happy: [
    "life is good today",
    "the throng prospers",
    "well-fed, clean, entertained",
    "grateful for this existence",
    "peak performance achieved",
    "contentment detected",
  ],
} as const;

export const COLORS = {
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
  panicking: 0xFF6B6B,
  mourning: 0x4A4A6A,
} as const;
