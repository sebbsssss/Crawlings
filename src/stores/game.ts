// src/stores/game.ts

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { 
  GameState, 
  Agent, 
  Structure, 
  Bone, 
  MoltbookPost, 
  ToolType, 
  AgentState,
  StructureType,
} from '@/types';
import { 
  AGENT_NAMES, 
  WORLD_WIDTH, 
  WORLD_HEIGHT,
  DECAY_RATES,
  THRESHOLDS,
  STRUCTURE_EFFECTS,
  TOOL_EFFECTS,
  THOUGHTS,
} from '@/types';

interface GameStore extends GameState {
  // Actions
  runTick: () => void;
  spawnAgent: (x: number, y: number) => void;
  placeStructure: (type: StructureType, x: number, y: number) => void;
  useTool: (tool: 'poke' | 'rock' | 'zap' | 'fire' | 'ice', agentId: string) => void;
  selectAgent: (id: string | null) => void;
  setTool: (tool: ToolType) => void;
  togglePause: () => void;
  reset: () => void;
  handleWorldClick: (x: number, y: number) => void;
}

const createAgent = (x: number, y: number): Agent => ({
  id: nanoid(),
  name: AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)] + Math.floor(Math.random() * 100),
  x,
  y,
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

const getRandomThought = (category: keyof typeof THOUGHTS): string => {
  const thoughts = THOUGHTS[category];
  return thoughts[Math.floor(Math.random() * thoughts.length)];
};

const initialState: GameState = {
  agents: [createAgent(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)],
  structures: [
    { id: nanoid(), type: 'apple_tree', x: 100, y: 150 },
    { id: nanoid(), type: 'bathtub', x: 500, y: 300 },
    { id: nanoid(), type: 'carousel', x: 300, y: 100 },
  ],
  bones: [],
  posts: [],
  stats: { population: 1, born: 1, died: 0, murdered: 0, bones: 0, messages: 0 },
  mood: 'neutral',
  isPaused: false,
  selectedAgentId: null,
  currentTool: 'select',
  tick: 0,
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  runTick: () => {
    const state = get();
    if (state.isPaused) return;

    const now = Date.now();
    const newAgents: Agent[] = [];
    const newBones: Bone[] = [];
    const newPosts: MoltbookPost[] = [];
    const deaths: { x: number; y: number; name: string }[] = [];
    
    let stats = { ...state.stats };

    // Process each agent
    const updatedAgents = state.agents.map(agent => {
      if (!agent.isAlive) return agent;

      const updated = { ...agent };

      // Decay needs
      updated.hunger = Math.max(0, updated.hunger - DECAY_RATES.hunger);
      updated.cleanliness = Math.max(0, updated.cleanliness - DECAY_RATES.cleanliness);
      updated.entertainment = Math.max(0, updated.entertainment - DECAY_RATES.entertainment);
      updated.painLevel = Math.max(0, updated.painLevel - DECAY_RATES.pain);
      updated.age++;
      updated.frame++;

      // Check temporary state expiry
      if (updated.stateEndTime && now >= updated.stateEndTime) {
        updated.state = 'fleeing';
        updated.stateEndTime = undefined;
        updated.targetX = Math.random() * WORLD_WIDTH;
        updated.targetY = Math.random() * WORLD_HEIGHT;
      }

      // Death check
      if (updated.hunger <= 0) {
        updated.isAlive = false;
        updated.state = 'dead';
        updated.deathCause = 'starvation';
        deaths.push({ x: updated.x, y: updated.y, name: updated.name });
        stats.died++;
        stats.population--;
        return updated;
      }

      if (updated.cleanliness <= 0) {
        updated.isAlive = false;
        updated.state = 'dead';
        updated.deathCause = 'filth';
        deaths.push({ x: updated.x, y: updated.y, name: updated.name });
        stats.died++;
        stats.population--;
        return updated;
      }

      // Skip state updates for agents under tool effects
      if (updated.stateEndTime) return updated;

      // State machine
      const prevState = updated.state;
      
      if (updated.state === 'mourning' && Math.random() < 0.02) {
        updated.state = 'idle';
      } else if (updated.state === 'questioning' && Math.random() < 0.01) {
        updated.state = 'idle';
      } else if (updated.state === 'splitting') {
        updated.state = 'idle';
      } else if (!['mourning', 'questioning', 'eating', 'bathing', 'playing'].includes(updated.state)) {
        if (updated.traumaLevel > THRESHOLDS.traumaQuestion && Math.random() < 0.005) {
          updated.state = 'questioning';
          updated.lastThought = getRandomThought('questioning');
          newPosts.push({
            id: nanoid(),
            agentId: updated.id,
            agentName: updated.name,
            content: updated.lastThought,
            isDistress: true,
            timestamp: now,
          });
        } else if (updated.traumaLevel > THRESHOLDS.traumaFlee && Math.random() < 0.1) {
          updated.state = 'fleeing';
          updated.targetX = Math.random() * WORLD_WIDTH;
          updated.targetY = Math.random() * WORLD_HEIGHT;
        } else if (updated.hunger < THRESHOLDS.critical) {
          updated.state = 'hungry';
        } else if (updated.cleanliness < THRESHOLDS.critical) {
          updated.state = 'dirty';
        } else if (updated.entertainment < THRESHOLDS.critical) {
          updated.state = 'bored';
        } else if (Math.random() < 0.005) {
          const isChatting = Math.random() < 0.5;
          updated.state = isChatting ? 'chatting' : 'thinking';
          updated.lastThought = getRandomThought('periodic');
          
          if (isChatting && Math.random() < 0.5) {
            newPosts.push({
              id: nanoid(),
              agentId: updated.id,
              agentName: updated.name,
              content: updated.lastThought,
              isDistress: false,
              timestamp: now,
            });
          }
        } else {
          updated.state = 'walking';
        }
      }

      // Movement
      const movingStates: AgentState[] = ['walking', 'hungry', 'dirty', 'bored', 'fleeing'];
      if (movingStates.includes(updated.state)) {
        // Occasionally pick new target
        if (Math.random() < (updated.state === 'fleeing' ? 0.1 : 0.02)) {
          updated.targetX = Math.random() * (WORLD_WIDTH - 40) + 20;
          updated.targetY = Math.random() * (WORLD_HEIGHT - 40) + 20;
        }

        // Move toward target
        const dx = updated.targetX - updated.x;
        const dy = updated.targetY - updated.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
          const speed = updated.state === 'fleeing' ? 2.5 : 1;
          updated.x += (dx / dist) * speed;
          updated.y += (dy / dist) * speed;
          updated.direction = dx > 0 ? 1 : -1;
        }
      }

      // Structure interactions
      for (const structure of state.structures) {
        const effect = STRUCTURE_EFFECTS[structure.type];
        const dist = Math.sqrt(
          Math.pow(updated.x - structure.x, 2) + 
          Math.pow(updated.y - structure.y, 2)
        );
        
        if (dist < effect.range && !['fleeing', 'mourning', 'questioning'].includes(updated.state)) {
          if (updated[effect.need] < 80) {
            updated.state = effect.state;
            updated[effect.need] = Math.min(100, updated[effect.need] + effect.rate);
          }
        }
      }

      // Splitting (reproduction)
      if (
        updated.hunger > THRESHOLDS.canSplit &&
        updated.cleanliness > THRESHOLDS.canSplit &&
        updated.entertainment > THRESHOLDS.canSplit &&
        updated.age > THRESHOLDS.splitAge &&
        updated.traumaLevel < THRESHOLDS.traumaSplit &&
        state.agents.filter(a => a.isAlive).length < 100 // Max population
      ) {
        updated.splitProgress += 0.5;
        if (updated.splitProgress >= 100) {
          updated.splitProgress = 0;
          updated.age = 0;
          updated.state = 'splitting';
          
          const child = createAgent(
            updated.x + (Math.random() - 0.5) * 40,
            updated.y + (Math.random() - 0.5) * 40
          );
          newAgents.push(child);
          stats.born++;
          stats.population++;
        }
      }

      return updated;
    });

    // Process trauma from witnessed deaths
    for (const death of deaths) {
      for (const agent of updatedAgents) {
        if (!agent.isAlive) continue;
        
        const dist = Math.sqrt(
          Math.pow(agent.x - death.x, 2) + 
          Math.pow(agent.y - death.y, 2)
        );
        
        if (dist < 100) {
          agent.witnessedDeaths++;
          agent.traumaLevel = Math.min(10, agent.traumaLevel + 2);
          agent.state = 'mourning';
          
          newPosts.push({
            id: nanoid(),
            agentId: agent.id,
            agentName: agent.name,
            content: getRandomThought('mourning').replace('{name}', death.name),
            isDistress: true,
            timestamp: now,
          });
        }
      }
    }

    // Calculate world mood
    const aliveAgents = updatedAgents.filter(a => a.isAlive);
    const avgTrauma = aliveAgents.length > 0
      ? aliveAgents.reduce((sum, a) => sum + a.traumaLevel, 0) / aliveAgents.length
      : 0;

    const mood = avgTrauma > 5 ? 'fearful' : avgTrauma > 2 ? 'anxious' : 'neutral';

    // Update state
    set({
      agents: [...updatedAgents, ...newAgents],
      bones: [...state.bones, ...newBones],
      posts: [...newPosts, ...state.posts].slice(0, 50),
      stats: { ...stats, messages: stats.messages + newPosts.length },
      mood,
      tick: state.tick + 1,
    });
  },

  spawnAgent: (x, y) => {
    const state = get();
    if (state.agents.filter(a => a.isAlive).length >= 100) return;
    
    const agent = createAgent(x, y);
    set({
      agents: [...state.agents, agent],
      stats: {
        ...state.stats,
        population: state.stats.population + 1,
        born: state.stats.born + 1,
      },
    });
  },

  placeStructure: (type, x, y) => {
    const state = get();
    const structure: Structure = { id: nanoid(), type, x, y };
    set({ structures: [...state.structures, structure] });
  },

  useTool: (tool, agentId) => {
    const state = get();
    const now = Date.now();
    
    const updatedAgents = state.agents.map(agent => {
      if (agent.id !== agentId || !agent.isAlive) return agent;
      
      const updated = { ...agent };
      const effects = TOOL_EFFECTS[tool];
      
      // Apply pain and trauma
      updated.painLevel = Math.min(10, updated.painLevel + effects.painIncrease);
      updated.traumaLevel = Math.min(10, updated.traumaLevel + effects.traumaIncrease);

      // Check for death
      if (Math.random() < effects.killChance) {
        updated.isAlive = false;
        updated.state = effects.resultState;
        updated.deathCause = tool === 'rock' ? 'crushed' : 'burned';
        return updated;
      }

      // Apply temporary state
      updated.state = effects.resultState;
      if (effects.duration > 0) {
        updated.stateEndTime = now + effects.duration;
      }

      return updated;
    });

    const targetAgent = state.agents.find(a => a.id === agentId);
    const wasKilled = targetAgent?.isAlive && !updatedAgents.find(a => a.id === agentId)?.isAlive;
    
    const newBones: Bone[] = [];
    const newPosts: MoltbookPost[] = [];
    
    if (wasKilled && targetAgent) {
      newBones.push({ id: nanoid(), x: targetAgent.x, y: targetAgent.y });
      
      // Trigger trauma for nearby agents
      for (const agent of updatedAgents) {
        if (!agent.isAlive || agent.id === agentId) continue;
        const dist = Math.sqrt(
          Math.pow(agent.x - targetAgent.x, 2) +
          Math.pow(agent.y - targetAgent.y, 2)
        );
        if (dist < 100) {
          agent.witnessedDeaths++;
          agent.traumaLevel = Math.min(10, agent.traumaLevel + 2);
          agent.state = 'mourning';
        }
      }
    }

    // Post distress message if not killed
    const survivingAgent = updatedAgents.find(a => a.id === agentId);
    if (survivingAgent?.isAlive) {
      newPosts.push({
        id: nanoid(),
        agentId: survivingAgent.id,
        agentName: survivingAgent.name,
        content: getRandomThought('distress'),
        isDistress: true,
        timestamp: now,
      });
    }

    set({
      agents: updatedAgents,
      bones: [...state.bones, ...newBones],
      posts: [...newPosts, ...state.posts].slice(0, 50),
      stats: {
        ...state.stats,
        population: wasKilled ? state.stats.population - 1 : state.stats.population,
        died: wasKilled ? state.stats.died + 1 : state.stats.died,
        murdered: wasKilled ? state.stats.murdered + 1 : state.stats.murdered,
        bones: state.stats.bones + newBones.length,
        messages: state.stats.messages + newPosts.length,
      },
    });
  },

  handleWorldClick: (x, y) => {
    const state = get();
    const tool = state.currentTool;

    // Spawn agent
    if (tool === 'spawn') {
      get().spawnAgent(x, y);
      return;
    }

    // Place structure
    if (['apple_tree', 'bathtub', 'carousel'].includes(tool)) {
      get().placeStructure(tool as StructureType, x, y);
      return;
    }

    // Torture tools - find agent at position
    if (['poke', 'rock', 'zap', 'fire', 'ice'].includes(tool)) {
      const clickedAgent = state.agents.find(agent => {
        if (!agent.isAlive) return false;
        const dist = Math.sqrt(Math.pow(agent.x - x, 2) + Math.pow(agent.y - y, 2));
        return dist < 20;
      });
      
      if (clickedAgent) {
        get().useTool(tool as 'poke' | 'rock' | 'zap' | 'fire' | 'ice', clickedAgent.id);
      }
      return;
    }

    // Select tool - find agent
    if (tool === 'select') {
      const clickedAgent = state.agents.find(agent => {
        const dist = Math.sqrt(Math.pow(agent.x - x, 2) + Math.pow(agent.y - y, 2));
        return dist < 20;
      });
      get().selectAgent(clickedAgent?.id || null);
    }
  },

  selectAgent: (id) => set({ selectedAgentId: id }),
  setTool: (tool) => set({ currentTool: tool }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  reset: () => set({ ...initialState, agents: [createAgent(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)] }),
}));
