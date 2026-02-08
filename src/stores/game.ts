// src/stores/game.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  GameState,
  Agent,
  Structure,
  Bone,
  Food,
  MoltbookPost,
  ToolType,
  AgentState,
  StructureType,
  Achievement,
  AchievementId,
} from '@/types';
import {
  AGENT_NAMES,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  DECAY_RATES,
  THRESHOLDS,
  STRUCTURE_EFFECTS,
  TOOL_EFFECTS,
  THOUGHTS,
  ACHIEVEMENTS_DEF,
  VARIANT_IDS,
  VARIANT_WEIGHTS,
  type VariantId,
} from '@/types';

interface GameStore extends GameState {
  // Actions
  runTick: () => void;
  spawnAgent: (x: number, y: number) => void;
  placeStructure: (type: StructureType, x: number, y: number) => void;
  useTool: (tool: 'poke' | 'rock' | 'zap' | 'fire' | 'ice', agentId: string) => void;
  petAgent: (agentId: string) => void;
  dropFood: (x: number, y: number) => void;
  selectAgent: (id: string | null) => void;
  setTool: (tool: ToolType) => void;
  togglePause: () => void;
  reset: () => void;
  handleWorldClick: (x: number, y: number) => void;
  moveCamera: (dx: number, dy: number) => void;
  setCameraPosition: (x: number, y: number) => void;
  toggleMusic: () => void;
  setMusicVolume: (volume: number) => void;
  checkAchievements: () => void;
  unlockAchievement: (id: AchievementId) => void;
}

// Collision radii for different objects
const COLLISION = {
  agent: 15,
  structure: 25,
  bone: 10,
};

// Select a random variant using weighted probabilities
const selectRandomVariant = (): VariantId => {
  const random = Math.random();
  let cumulative = 0;
  for (const variantId of VARIANT_IDS) {
    cumulative += VARIANT_WEIGHTS[variantId];
    if (random < cumulative) {
      return variantId;
    }
  }
  return 'a'; // Fallback
};

// Select variant for child (70% inherit, 30% random)
const selectChildVariant = (parentVariant: VariantId): VariantId => {
  return Math.random() < 0.7 ? parentVariant : selectRandomVariant();
};

const createAgent = (x: number, y: number, parentId?: string, variantId?: VariantId): Agent => ({
  id: nanoid(),
  name: AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)] + Math.floor(Math.random() * 100),
  variantId: variantId ?? selectRandomVariant(),
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
  // Relationships
  parentId,
  childIds: [],
  friendIds: [],
  enemyIds: [],
  // Aggression
  aggressionLevel: 0,
});

const getRandomThought = (category: keyof typeof THOUGHTS): string => {
  const thoughts = THOUGHTS[category];
  return thoughts[Math.floor(Math.random() * thoughts.length)];
};

// Check if a position collides with any obstacle
function checkCollision(
  x: number,
  y: number,
  structures: Structure[],
  agents: Agent[],
  bones: Bone[],
  excludeAgentId?: string
): { collides: boolean; avoidX: number; avoidY: number } {
  let collides = false;
  let avoidX = 0;
  let avoidY = 0;

  // Check world boundaries
  const margin = 20;
  if (x < margin) { collides = true; avoidX += 1; }
  if (x > WORLD_WIDTH - margin) { collides = true; avoidX -= 1; }
  if (y < margin) { collides = true; avoidY += 1; }
  if (y > WORLD_HEIGHT - margin) { collides = true; avoidY -= 1; }

  // Check structures
  for (const structure of structures) {
    const dx = x - structure.x;
    const dy = y - structure.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = COLLISION.agent + COLLISION.structure;

    if (dist < minDist && dist > 0) {
      collides = true;
      // Push away from structure
      avoidX += (dx / dist) * (minDist - dist) * 0.5;
      avoidY += (dy / dist) * (minDist - dist) * 0.5;
    }
  }

  // Check other agents
  for (const agent of agents) {
    if (!agent.isAlive || agent.id === excludeAgentId) continue;

    const dx = x - agent.x;
    const dy = y - agent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = COLLISION.agent * 2;

    if (dist < minDist && dist > 0) {
      collides = true;
      // Push away from other agent
      avoidX += (dx / dist) * (minDist - dist) * 0.3;
      avoidY += (dy / dist) * (minDist - dist) * 0.3;
    }
  }

  // Check bones (avoid walking over dead friends)
  for (const bone of bones) {
    const dx = x - bone.x;
    const dy = y - bone.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = COLLISION.agent + COLLISION.bone;

    if (dist < minDist && dist > 0) {
      collides = true;
      avoidX += (dx / dist) * (minDist - dist) * 0.2;
      avoidY += (dy / dist) * (minDist - dist) * 0.2;
    }
  }

  return { collides, avoidX, avoidY };
}

// Find a clear target position, avoiding obstacles
function findClearTarget(
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  structures: Structure[],
  agents: Agent[],
  bones: Bone[],
  agentId: string
): { x: number; y: number } {
  // Check if direct path is clear
  const collision = checkCollision(targetX, targetY, structures, agents, bones, agentId);

  if (!collision.collides) {
    return { x: targetX, y: targetY };
  }

  // Try to find an alternate path by rotating around the obstacle
  const dx = targetX - fromX;
  const dy = targetY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 5) {
    // Already at target, find a new random spot
    return {
      x: Math.random() * (WORLD_WIDTH - 60) + 30,
      y: Math.random() * (WORLD_HEIGHT - 60) + 30,
    };
  }

  // Try perpendicular directions
  const perpX = -dy / dist;
  const perpY = dx / dist;

  // Try left and right of obstacle
  const offsetDist = 50;
  const leftX = fromX + dx * 0.5 + perpX * offsetDist;
  const leftY = fromY + dy * 0.5 + perpY * offsetDist;
  const rightX = fromX + dx * 0.5 - perpX * offsetDist;
  const rightY = fromY + dy * 0.5 - perpY * offsetDist;

  const leftCollision = checkCollision(leftX, leftY, structures, agents, bones, agentId);
  const rightCollision = checkCollision(rightX, rightY, structures, agents, bones, agentId);

  if (!leftCollision.collides) {
    return { x: leftX, y: leftY };
  }
  if (!rightCollision.collides) {
    return { x: rightX, y: rightY };
  }

  // Both sides blocked, add avoidance vector to current position
  return {
    x: Math.max(30, Math.min(WORLD_WIDTH - 30, fromX + collision.avoidX * 20)),
    y: Math.max(30, Math.min(WORLD_HEIGHT - 30, fromY + collision.avoidY * 20)),
  };
}

const initialState: GameState = {
  agents: [createAgent(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)],
  structures: [
    // Cluster 1 - center area
    { id: nanoid(), type: 'apple_tree', x: 500, y: 350 },
    { id: nanoid(), type: 'bathtub', x: 700, y: 450 },
    { id: nanoid(), type: 'carousel', x: 600, y: 300 },
    // Cluster 2 - top-left
    { id: nanoid(), type: 'apple_tree', x: 150, y: 150 },
    { id: nanoid(), type: 'bathtub', x: 250, y: 200 },
    // Cluster 3 - top-right
    { id: nanoid(), type: 'carousel', x: 1000, y: 180 },
    { id: nanoid(), type: 'apple_tree', x: 1050, y: 250 },
    // Cluster 4 - bottom-left
    { id: nanoid(), type: 'bathtub', x: 200, y: 650 },
    { id: nanoid(), type: 'apple_tree', x: 120, y: 580 },
    // Cluster 5 - bottom-right
    { id: nanoid(), type: 'carousel', x: 1050, y: 650 },
    { id: nanoid(), type: 'apple_tree', x: 950, y: 700 },
  ],
  bones: [],
  foods: [],
  posts: [],
  stats: {
    population: 1,
    born: 1,
    died: 0,
    murdered: 0,
    bones: 0,
    messages: 0,
    petCount: 0,
    fedCount: 0,
    friendshipsMade: 0,
    attacksByAgents: 0,
    crazedCount: 0,
    peakPopulation: 1,
    totalPlayTime: 0,
  },
  achievements: [],
  mood: 'neutral',
  isPaused: false,
  selectedAgentId: null,
  currentTool: 'select',
  tick: 0,
  musicEnabled: true,
  musicVolume: 0.5,
  gameStartTime: Date.now(),
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  cameraX: (WORLD_WIDTH - VIEWPORT_WIDTH) / 2,  // Start centered
  cameraY: (WORLD_HEIGHT - VIEWPORT_HEIGHT) / 2,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      runTick: () => {
    const state = get();
    if (state.isPaused) return;

    const now = Date.now();
    const newAgents: Agent[] = [];
    const newBones: Bone[] = [];
    const newPosts: MoltbookPost[] = [];
    const deaths: { x: number; y: number; name: string }[] = [];
    const consumedFoodIds: string[] = [];
    const attackEvents: { attackerId: string; attackerName: string; targetId: string; targetName: string }[] = [];
    const friendshipEvents: { agent1Id: string; agent1Name: string; agent2Id: string; agent2Name: string }[] = [];

    let stats = { ...state.stats };

    // Update play time
    stats.totalPlayTime = now - state.gameStartTime;

    // Calculate exponential spawn rate multiplier based on population
    // More crawlings = faster reproduction
    const aliveCount = state.agents.filter(a => a.isAlive).length;
    const spawnMultiplier = 1 + Math.log2(Math.max(1, aliveCount)) * 0.5; // Exponential growth factor

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
        const newTarget = findClearTarget(
          updated.x, updated.y,
          Math.random() * WORLD_WIDTH,
          Math.random() * WORLD_HEIGHT,
          state.structures, state.agents, state.bones, updated.id
        );
        updated.targetX = newTarget.x;
        updated.targetY = newTarget.y;
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
      if (updated.state === 'crazed') {
        // Crazed crawlings have very small chance to recover
        if (updated.traumaLevel < 5 && Math.random() < 0.001) {
          updated.state = 'idle';
          updated.lastThought = "...where am I? What happened?";
          newPosts.push({
            id: nanoid(),
            agentId: updated.id,
            agentName: updated.name,
            content: "I... I think I'm okay now. What happened to me?",
            isDistress: true,
            timestamp: now,
          });
        } else if (Math.random() < 0.03) {
          // Random crazed thoughts
          updated.lastThought = getRandomThought('crazed');
          newPosts.push({
            id: nanoid(),
            agentId: updated.id,
            agentName: updated.name,
            content: updated.lastThought,
            isDistress: true,
            timestamp: now,
          });
        }
      } else if (updated.state === 'mourning' && Math.random() < 0.02) {
        updated.state = 'idle';
      } else if (updated.state === 'questioning' && Math.random() < 0.01) {
        // Questioning can lead to going crazed if trauma is very high
        if (updated.traumaLevel >= 8 && Math.random() < 0.1) {
          updated.state = 'crazed';
          updated.lastThought = getRandomThought('crazed');
          newPosts.push({
            id: nanoid(),
            agentId: updated.id,
            agentName: updated.name,
            content: `*${updated.name} has lost their mind* ${updated.lastThought}`,
            isDistress: true,
            timestamp: now,
          });
        } else {
          updated.state = 'idle';
        }
      } else if (updated.state === 'splitting') {
        updated.state = 'idle';
      } else if (!['mourning', 'questioning', 'eating', 'bathing', 'playing', 'crazed'].includes(updated.state)) {
        // Check for going crazed from extreme trauma
        if (updated.traumaLevel >= 8 && updated.witnessedDeaths >= 3 && Math.random() < 0.02) {
          updated.state = 'crazed';
          updated.lastThought = getRandomThought('crazed');
          newPosts.push({
            id: nanoid(),
            agentId: updated.id,
            agentName: updated.name,
            content: `*something snapped in ${updated.name}* ${updated.lastThought}`,
            isDistress: true,
            timestamp: now,
          });
        } else if (updated.traumaLevel > THRESHOLDS.traumaQuestion && Math.random() < 0.005) {
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
          const newTarget = findClearTarget(
            updated.x, updated.y,
            Math.random() * WORLD_WIDTH,
            Math.random() * WORLD_HEIGHT,
            state.structures, state.agents, state.bones, updated.id
          );
          updated.targetX = newTarget.x;
          updated.targetY = newTarget.y;
        } else if (updated.hunger < THRESHOLDS.critical) {
          updated.state = 'hungry';
        } else if (updated.cleanliness < THRESHOLDS.critical) {
          updated.state = 'dirty';
        } else if (updated.entertainment < THRESHOLDS.critical) {
          updated.state = 'bored';
        } else if (Math.random() < 0.005) {
          const isChatting = Math.random() < 0.5;
          updated.state = isChatting ? 'chatting' : 'thinking';
          updated.lastThought = getRandomThought(isChatting ? 'social' : 'periodic');

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
        } else if (
          updated.hunger > 70 &&
          updated.cleanliness > 70 &&
          updated.entertainment > 70 &&
          Math.random() < 0.002
        ) {
          // Happy thoughts when all needs are met
          updated.lastThought = getRandomThought('happy');
          newPosts.push({
            id: nanoid(),
            agentId: updated.id,
            agentName: updated.name,
            content: updated.lastThought,
            isDistress: false,
            timestamp: now,
          });
        } else {
          updated.state = 'walking';
          // Occasional exploring thought when wandering
          if (Math.random() < 0.002) {
            updated.lastThought = getRandomThought('exploring');
            newPosts.push({
              id: nanoid(),
              agentId: updated.id,
              agentName: updated.name,
              content: updated.lastThought,
              isDistress: false,
              timestamp: now,
            });
          }
        }
      }

      // Movement with collision avoidance
      const movingStates: AgentState[] = ['walking', 'hungry', 'dirty', 'bored', 'fleeing', 'crazed'];
      if (movingStates.includes(updated.state)) {
        // Check for collisions and adjust
        const collision = checkCollision(
          updated.x, updated.y,
          state.structures, state.agents, state.bones,
          updated.id
        );

        // Apply avoidance force if colliding
        if (collision.collides) {
          updated.x += collision.avoidX;
          updated.y += collision.avoidY;

          // Find new target that avoids obstacles
          if (Math.random() < 0.1) {
            const newTarget = findClearTarget(
              updated.x, updated.y,
              updated.targetX, updated.targetY,
              state.structures, state.agents, state.bones, updated.id
            );
            updated.targetX = newTarget.x;
            updated.targetY = newTarget.y;
          }
        }

        // Occasionally pick new target - crazed crawlings change direction very frequently
        const targetChangeChance = updated.state === 'crazed' ? 0.25 :
                                   updated.state === 'fleeing' ? 0.1 : 0.02;
        if (Math.random() < targetChangeChance) {
          const newTarget = findClearTarget(
            updated.x, updated.y,
            Math.random() * (WORLD_WIDTH - 60) + 30,
            Math.random() * (WORLD_HEIGHT - 60) + 30,
            state.structures, state.agents, state.bones, updated.id
          );
          updated.targetX = newTarget.x;
          updated.targetY = newTarget.y;
        }

        // Move toward target
        const dx = updated.targetX - updated.x;
        const dy = updated.targetY - updated.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
          // Crazed crawlings are fast and erratic
          const speed = updated.state === 'crazed' ? 3.5 :
                        updated.state === 'fleeing' ? 2.5 : 1.2;
          let moveX = (dx / dist) * speed;
          let moveY = (dy / dist) * speed;

          // Add randomness - crazed crawlings are very erratic
          const jitter = updated.state === 'crazed' ? 1.5 : 0.3;
          moveX += (Math.random() - 0.5) * jitter;
          moveY += (Math.random() - 0.5) * jitter;

          updated.x += moveX;
          updated.y += moveY;
          // Crazed crawlings flip direction randomly
          updated.direction = updated.state === 'crazed' && Math.random() < 0.1
            ? (updated.direction === 1 ? -1 : 1)
            : (dx > 0 ? 1 : -1);
        }

        // Clamp to world bounds
        updated.x = Math.max(20, Math.min(WORLD_WIDTH - 20, updated.x));
        updated.y = Math.max(20, Math.min(WORLD_HEIGHT - 20, updated.y));
      }

      // Structure interactions
      for (const structure of state.structures) {
        const effect = STRUCTURE_EFFECTS[structure.type];
        const dist = Math.sqrt(
          Math.pow(updated.x - structure.x, 2) +
          Math.pow(updated.y - structure.y, 2)
        );

        if (dist < effect.range && !['fleeing', 'mourning', 'questioning', 'crazed', 'aggressive', 'attacking'].includes(updated.state)) {
          if (updated[effect.need] < 80) {
            const wasNotInActivityState = updated.state !== effect.state;
            updated.state = effect.state;
            updated[effect.need] = Math.min(100, updated[effect.need] + effect.rate);

            // Post to Moltbook when starting an activity (with low probability)
            if (wasNotInActivityState && Math.random() < 0.08) {
              const thoughtCategory = structure.type === 'apple_tree' ? 'eating' :
                                     structure.type === 'bathtub' ? 'bathing' : 'playing';
              newPosts.push({
                id: nanoid(),
                agentId: updated.id,
                agentName: updated.name,
                content: getRandomThought(thoughtCategory),
                isDistress: false,
                timestamp: now,
              });
            }
          }
        }
      }

      // Food pickup (dropped by player)
      for (const food of state.foods) {
        const dist = Math.sqrt(
          Math.pow(updated.x - food.x, 2) +
          Math.pow(updated.y - food.y, 2)
        );

        if (dist < 25 && updated.hunger < 90) {
          updated.hunger = Math.min(100, updated.hunger + food.amount);
          updated.state = 'eating';
          consumedFoodIds.push(food.id);

          if (Math.random() < 0.3) {
            newPosts.push({
              id: nanoid(),
              agentId: updated.id,
              agentName: updated.name,
              content: "Found food on the ground! Thank you kind human!",
              isDistress: false,
              timestamp: now,
            });
          }
          break; // Only eat one food at a time
        }
      }

      // Aggression buildup from trauma
      if (updated.traumaLevel > 5 || updated.state === 'crazed') {
        updated.aggressionLevel = Math.min(10, updated.aggressionLevel + 0.02);
      } else {
        updated.aggressionLevel = Math.max(0, updated.aggressionLevel - 0.01);
      }

      // Aggression attack behavior
      if (updated.aggressionLevel > 7 && updated.state !== 'attacking' && Math.random() < 0.01) {
        // Find a nearby target (not already an enemy, prefer strangers over friends)
        const nearbyAgents = state.agents.filter(a =>
          a.isAlive &&
          a.id !== updated.id &&
          Math.sqrt(Math.pow(a.x - updated.x, 2) + Math.pow(a.y - updated.y, 2)) < 80
        );

        if (nearbyAgents.length > 0) {
          // Prioritize non-friends for attacks
          const nonFriends = nearbyAgents.filter(a => !updated.friendIds.includes(a.id));
          const target = nonFriends.length > 0
            ? nonFriends[Math.floor(Math.random() * nonFriends.length)]
            : nearbyAgents[Math.floor(Math.random() * nearbyAgents.length)];

          updated.state = 'aggressive';
          updated.targetAgentId = target.id;
          updated.lastThought = getRandomThought('aggressive');

          newPosts.push({
            id: nanoid(),
            agentId: updated.id,
            agentName: updated.name,
            content: updated.lastThought,
            isDistress: true,
            timestamp: now,
          });
        }
      }

      // Execute attack if aggressive and near target
      if (updated.state === 'aggressive' && updated.targetAgentId) {
        const target = state.agents.find(a => a.id === updated.targetAgentId);
        if (target && target.isAlive) {
          const dist = Math.sqrt(
            Math.pow(target.x - updated.x, 2) +
            Math.pow(target.y - updated.y, 2)
          );

          // Move toward target
          updated.targetX = target.x;
          updated.targetY = target.y;

          if (dist < 20) {
            // Attack!
            updated.state = 'attacking';
            attackEvents.push({
              attackerId: updated.id,
              attackerName: updated.name,
              targetId: target.id,
              targetName: target.name,
            });
          }
        } else {
          // Target gone, calm down
          updated.state = 'idle';
          updated.targetAgentId = undefined;
        }
      }

      // Relationship formation (bonding) - when near other crawlings for a while
      if (!['crazed', 'aggressive', 'attacking', 'fleeing', 'mourning'].includes(updated.state)) {
        for (const other of state.agents) {
          if (other.id === updated.id || !other.isAlive) continue;
          if (updated.friendIds.includes(other.id)) continue; // Already friends

          const dist = Math.sqrt(
            Math.pow(other.x - updated.x, 2) +
            Math.pow(other.y - updated.y, 2)
          );

          // Nearby and both content = chance to bond
          if (dist < 40 &&
              updated.hunger > 50 &&
              updated.cleanliness > 50 &&
              updated.traumaLevel < 3 &&
              Math.random() < 0.001
          ) {
            updated.friendIds.push(other.id);
            updated.state = 'bonding';
            updated.lastThought = getRandomThought('bonding');
            friendshipEvents.push({
              agent1Id: updated.id,
              agent1Name: updated.name,
              agent2Id: other.id,
              agent2Name: other.name,
            });
          }
        }
      }

      // Splitting (reproduction) - with exponential growth
      // Lower thresholds and faster progress for more spawning
      const canSplitThreshold = 60; // Lowered from 80
      const splitAgeThreshold = 200; // Lowered from 500
      const maxPopulation = 150; // Increased from 100

      if (
        updated.hunger > canSplitThreshold &&
        updated.cleanliness > canSplitThreshold &&
        updated.entertainment > canSplitThreshold &&
        updated.age > splitAgeThreshold &&
        updated.traumaLevel < 5 && // More lenient trauma threshold
        aliveCount < maxPopulation
      ) {
        // Exponential split progress: faster with more population
        const baseProgress = 1.5; // Increased from 0.5
        updated.splitProgress += baseProgress * spawnMultiplier;

        if (updated.splitProgress >= 100) {
          updated.splitProgress = 0;
          updated.age = Math.floor(updated.age * 0.3); // Don't fully reset age
          updated.state = 'splitting';

          // Find a clear spot for the child
          const childTarget = findClearTarget(
            updated.x, updated.y,
            updated.x + (Math.random() - 0.5) * 60,
            updated.y + (Math.random() - 0.5) * 60,
            state.structures, state.agents, state.bones, updated.id
          );

          const childVariant = selectChildVariant(updated.variantId);
          const child = createAgent(childTarget.x, childTarget.y, updated.id, childVariant);
          // Child inherits some stats from parent
          child.hunger = Math.min(100, updated.hunger * 0.8);
          child.cleanliness = Math.min(100, updated.cleanliness * 0.8);
          child.entertainment = Math.min(100, updated.entertainment * 0.8);
          // Set parent-child relationship
          updated.childIds.push(child.id);
          // Child starts as friend with parent
          child.friendIds.push(updated.id);
          updated.friendIds.push(child.id);

          newAgents.push(child);
          stats.born++;
          stats.population++;
          stats.friendshipsMade++;

          // Post about the birth
          if (Math.random() < 0.4) {
            newPosts.push({
              id: nanoid(),
              agentId: updated.id,
              agentName: updated.name,
              content: `${getRandomThought('splitting')} Welcome ${child.name}!`,
              isDistress: false,
              timestamp: now,
            });
          }
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

    // Process attack events - damage targets and create enemy relationships
    for (const attack of attackEvents) {
      const attacker = updatedAgents.find(a => a.id === attack.attackerId);
      const target = updatedAgents.find(a => a.id === attack.targetId);

      if (attacker && target && target.isAlive) {
        // Deal damage to target
        target.painLevel = Math.min(10, target.painLevel + 3);
        target.traumaLevel = Math.min(10, target.traumaLevel + 1);
        target.hunger = Math.max(0, target.hunger - 10);
        target.state = 'hurt';
        target.stateEndTime = now + 1500;

        // Create enemy relationships
        if (!attacker.enemyIds.includes(target.id)) {
          attacker.enemyIds.push(target.id);
        }
        if (!target.enemyIds.includes(attacker.id)) {
          target.enemyIds.push(attacker.id);
        }

        // Remove from friends if they were friends
        attacker.friendIds = attacker.friendIds.filter(id => id !== target.id);
        target.friendIds = target.friendIds.filter(id => id !== attacker.id);

        // Attacker calms down after attacking
        attacker.state = 'idle';
        attacker.aggressionLevel = Math.max(0, attacker.aggressionLevel - 4);
        attacker.targetAgentId = undefined;

        stats.attacksByAgents++;

        // Post about the attack
        newPosts.push({
          id: nanoid(),
          agentId: target.id,
          agentName: target.name,
          content: getRandomThought('hurt_by_friend').replace('{name}', attack.attackerName),
          isDistress: true,
          timestamp: now,
        });

        // Nearby agents witness violence
        for (const witness of updatedAgents) {
          if (!witness.isAlive || witness.id === attacker.id || witness.id === target.id) continue;
          const dist = Math.sqrt(
            Math.pow(witness.x - target.x, 2) +
            Math.pow(witness.y - target.y, 2)
          );
          if (dist < 80) {
            witness.traumaLevel = Math.min(10, witness.traumaLevel + 0.5);
          }
        }
      }
    }

    // Process friendship events - make friendships mutual
    for (const friendship of friendshipEvents) {
      const agent2 = updatedAgents.find(a => a.id === friendship.agent2Id);
      if (agent2 && !agent2.friendIds.includes(friendship.agent1Id)) {
        agent2.friendIds.push(friendship.agent1Id);
      }
      stats.friendshipsMade++;

      newPosts.push({
        id: nanoid(),
        agentId: friendship.agent1Id,
        agentName: friendship.agent1Name,
        content: `${friendship.agent2Name} and I are becoming friends! 💕`,
        isDistress: false,
        timestamp: now,
      });
    }

    // Remove consumed foods
    const remainingFoods = state.foods.filter(f => !consumedFoodIds.includes(f.id));

    // Calculate world mood
    const finalAliveAgents = updatedAgents.filter(a => a.isAlive);
    const avgTrauma = finalAliveAgents.length > 0
      ? finalAliveAgents.reduce((sum, a) => sum + a.traumaLevel, 0) / finalAliveAgents.length
      : 0;

    const mood = avgTrauma > 5 ? 'fearful' : avgTrauma > 2 ? 'anxious' : 'neutral';

    // Update peak population
    const finalPopulation = finalAliveAgents.length + newAgents.length;
    if (finalPopulation > stats.peakPopulation) {
      stats.peakPopulation = finalPopulation;
    }

    // Track crazed count
    const finalCrazedCount = finalAliveAgents.filter(a => a.state === 'crazed').length;
    stats.crazedCount = finalCrazedCount;

    // Update state
    set({
      agents: [...updatedAgents, ...newAgents],
      bones: [...state.bones, ...newBones],
      foods: remainingFoods,
      posts: [...newPosts, ...state.posts].slice(0, 20),
      stats: { ...stats, messages: stats.messages + newPosts.length },
      mood,
      tick: state.tick + 1,
    });

    // Check achievements periodically
    if (state.tick % 60 === 0) {
      get().checkAchievements();
    }
  },

  spawnAgent: (x, y) => {
    const state = get();
    if (state.agents.filter(a => a.isAlive).length >= 150) return;

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
      posts: [...newPosts, ...state.posts].slice(0, 20),
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

    // Pet tool - comfort crawlings
    if (tool === 'pet') {
      const clickedAgent = state.agents.find(agent => {
        if (!agent.isAlive) return false;
        const dist = Math.sqrt(Math.pow(agent.x - x, 2) + Math.pow(agent.y - y, 2));
        return dist < 25;
      });

      if (clickedAgent) {
        get().petAgent(clickedAgent.id);
      }
      return;
    }

    // Feed tool - drop food
    if (tool === 'feed') {
      get().dropFood(x, y);
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

  moveCamera: (dx, dy) => {
    const state = get();
    const maxX = WORLD_WIDTH - VIEWPORT_WIDTH;
    const maxY = WORLD_HEIGHT - VIEWPORT_HEIGHT;
    set({
      cameraX: Math.max(0, Math.min(maxX, state.cameraX + dx)),
      cameraY: Math.max(0, Math.min(maxY, state.cameraY + dy)),
    });
  },

  setCameraPosition: (x, y) => {
    const maxX = WORLD_WIDTH - VIEWPORT_WIDTH;
    const maxY = WORLD_HEIGHT - VIEWPORT_HEIGHT;
    set({
      cameraX: Math.max(0, Math.min(maxX, x)),
      cameraY: Math.max(0, Math.min(maxY, y)),
    });
  },

  petAgent: (agentId) => {
    const state = get();
    const now = Date.now();

    const updatedAgents = state.agents.map(agent => {
      if (agent.id !== agentId || !agent.isAlive) return agent;

      const updated = { ...agent };
      // Reduce trauma and aggression
      updated.traumaLevel = Math.max(0, updated.traumaLevel - 2);
      updated.aggressionLevel = Math.max(0, updated.aggressionLevel - 3);
      updated.painLevel = Math.max(0, updated.painLevel - 1);
      updated.state = 'loved';
      updated.stateEndTime = now + 2000;
      updated.lastPetTime = now;
      updated.lastThought = getRandomThought('loved');

      return updated;
    });

    const petted = updatedAgents.find(a => a.id === agentId);
    const newPosts: MoltbookPost[] = [];

    if (petted?.isAlive) {
      newPosts.push({
        id: nanoid(),
        agentId: petted.id,
        agentName: petted.name,
        content: petted.lastThought || 'feeling loved',
        isDistress: false,
        timestamp: now,
      });
    }

    set({
      agents: updatedAgents,
      posts: [...newPosts, ...state.posts].slice(0, 20),
      stats: {
        ...state.stats,
        petCount: state.stats.petCount + 1,
        messages: state.stats.messages + newPosts.length,
      },
    });

    get().checkAchievements();
  },

  dropFood: (x, y) => {
    const state = get();
    const food: Food = {
      id: nanoid(),
      x,
      y,
      amount: 30,
      createdAt: Date.now(),
    };

    set({
      foods: [...state.foods, food],
      stats: { ...state.stats, fedCount: state.stats.fedCount + 1 },
    });

    get().checkAchievements();
  },

  toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),

  setMusicVolume: (volume) => set({ musicVolume: Math.max(0, Math.min(1, volume)) }),

  checkAchievements: () => {
    const state = get();
    const now = Date.now();

    const unlock = (id: AchievementId) => {
      if (!state.achievements.find(a => a.id === id)) {
        get().unlockAchievement(id);
      }
    };

    const aliveCount = state.agents.filter(a => a.isAlive).length;
    const crazedCount = state.agents.filter(a => a.state === 'crazed' && a.isAlive).length;

    // Population achievements
    if (aliveCount >= 1) unlock('first_crawling');
    if (aliveCount >= 10) unlock('colony_10');
    if (aliveCount >= 25) unlock('colony_25');
    if (aliveCount >= 50) unlock('colony_50');

    // Death achievements
    if (state.stats.died >= 1) unlock('first_death');
    if (state.stats.murdered >= 1) unlock('first_murder');
    if (state.stats.murdered >= 10) unlock('genocide');

    // Social achievements
    if (state.stats.friendshipsMade >= 1) unlock('first_friend');
    const maxFriends = Math.max(...state.agents.map(a => a.friendIds.length), 0);
    if (maxFriends >= 5) unlock('social_butterfly');

    // Crazed achievements
    if (crazedCount >= 1) unlock('first_crazy');
    if (crazedCount >= 5) unlock('madhouse');

    // Care achievements
    if (state.stats.petCount >= 50) unlock('pet_lover');
    if (state.stats.fedCount >= 25) unlock('generous_feeder');

    // Family achievements (check for generations)
    for (const agent of state.agents) {
      let generations = 1;
      let current: Agent | undefined = agent;
      while (current?.parentId) {
        current = state.agents.find(a => a.id === current!.parentId);
        if (current) generations++;
      }
      if (generations >= 3) unlock('first_family');
      if (generations >= 5) unlock('dynasty');
    }

    // Pacifist
    if (aliveCount >= 20 && state.stats.murdered === 0) unlock('pacifist');

    // Survivor
    const playTime = now - state.gameStartTime;
    if (playTime >= 600000 && aliveCount > 0) unlock('survivor'); // 10 minutes
  },

  unlockAchievement: (id) => {
    const state = get();
    if (state.achievements.find(a => a.id === id)) return;

    const achievement: Achievement = {
      ...ACHIEVEMENTS_DEF[id],
      unlockedAt: Date.now(),
    };

    set({
      achievements: [...state.achievements, achievement],
    });
  },
    }),
    {
      name: 'crawlings-save',
      // Only persist specific state (exclude transient data)
      partialize: (state) => ({
        agents: state.agents,
        structures: state.structures,
        bones: state.bones,
        foods: state.foods,
        posts: state.posts.slice(0, 10), // Keep only recent posts
        stats: state.stats,
        achievements: state.achievements,
        musicEnabled: state.musicEnabled,
        musicVolume: state.musicVolume,
        gameStartTime: state.gameStartTime,
        // Don't persist: isPaused, selectedAgentId, currentTool, tick, camera position, mood
      }),
    }
  )
);
