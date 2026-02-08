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
  | 'questioning'
  | 'crazed'
  | 'loved'      // When petted
  | 'aggressive' // About to attack
  | 'attacking'  // Attacking another crawling
  | 'hurt'       // Hurt by another crawling
  | 'bonding';   // Forming friendship

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
  | 'ice'
  | 'pet'   // Comfort crawlings
  | 'feed'; // Drop food

export type StructureType = 'apple_tree' | 'bathtub' | 'carousel';

// Visual variants for different lobster appearances
export type VariantId = 'a' | 'b' | 'c' | 'd' | 'e';

export const VARIANT_IDS: VariantId[] = ['a', 'b', 'c', 'd', 'e'];

// Weighted probabilities for variant assignment
export const VARIANT_WEIGHTS: Record<VariantId, number> = {
  a: 0.30,  // Classic red/orange - 30%
  b: 0.25,  // Coral pink - 25%
  c: 0.25,  // Deep sea blue/purple - 25%
  d: 0.15,  // Golden amber - 15%
  e: 0.05,  // Moss green (rare) - 5%
};

// Colors for each variant (base tint colors)
export const VARIANT_COLORS: Record<VariantId, { primary: number; secondary: number; name: string }> = {
  a: { primary: 0xE85D04, secondary: 0xF48C06, name: 'Classic' },     // Orange/red
  b: { primary: 0xE07899, secondary: 0xF0A0B8, name: 'Coral' },       // Pink
  c: { primary: 0x6A5ACD, secondary: 0x9370DB, name: 'Deep Sea' },    // Purple/blue
  d: { primary: 0xDAA520, secondary: 0xFFD700, name: 'Golden' },      // Gold
  e: { primary: 0x4A7C59, secondary: 0x6B9B6B, name: 'Moss' },        // Green (rare)
};

export interface Agent {
  id: string;
  name: string;
  variantId: VariantId;  // Visual variant for appearance
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
  // Relationships
  parentId?: string;        // Who they split from
  childIds: string[];       // Who they've created
  friendIds: string[];      // Friends (bonded crawlings)
  enemyIds: string[];       // Enemies (attacked by or attacked)
  // Aggression
  aggressionLevel: number;  // 0-10, increases with trauma/crazed
  targetAgentId?: string;   // Who they're attacking
  lastPetTime?: number;     // When they were last comforted
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

export interface Food {
  id: string;
  x: number;
  y: number;
  amount: number;  // How much hunger it restores
  createdAt: number;
}

export interface MoltbookPost {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  isDistress: boolean;
  timestamp: number;
}

export type AchievementId =
  | 'first_crawling'
  | 'colony_10'
  | 'colony_25'
  | 'colony_50'
  | 'first_death'
  | 'first_murder'
  | 'genocide'
  | 'first_friend'
  | 'social_butterfly'
  | 'first_crazy'
  | 'madhouse'
  | 'pet_lover'
  | 'generous_feeder'
  | 'first_family'
  | 'dynasty'
  | 'pacifist'
  | 'survivor';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface GameStats {
  population: number;
  born: number;
  died: number;
  murdered: number;
  bones: number;
  messages: number;
  // New stats
  petCount: number;
  fedCount: number;
  friendshipsMade: number;
  attacksByAgents: number;
  crazedCount: number;
  peakPopulation: number;
  totalPlayTime: number;
}

export type WorldMood = 'neutral' | 'anxious' | 'fearful' | 'chaotic';

export interface GameState {
  agents: Agent[];
  structures: Structure[];
  bones: Bone[];
  foods: Food[];
  posts: MoltbookPost[];
  stats: GameStats;
  achievements: Achievement[];
  mood: WorldMood;
  isPaused: boolean;
  selectedAgentId: string | null;
  currentTool: ToolType;
  tick: number;
  worldWidth: number;
  worldHeight: number;
  musicEnabled: boolean;
  musicVolume: number;
  gameStartTime: number;
  // Camera/viewport state
  cameraX: number;
  cameraY: number;
}

// Constants
export const WORLD_WIDTH = 1600;  // Expanded world
export const WORLD_HEIGHT = 1000;
export const VIEWPORT_WIDTH = 820;
export const VIEWPORT_HEIGHT = 480;

export const AGENT_NAMES = [
  'Nexus', 'Cipher', 'Volt', 'Echo', 'Pulse', 'Nova', 'Flux', 'Axiom',
  'Helix', 'Zenith', 'Qubit', 'Vector', 'Pixel', 'Synth', 'Glitch', 'Proto',
  'Byte', 'Spark', 'Drift', 'Haze', 'Vex', 'Zeta', 'Nyx', 'Rune',
] as const;

export const DECAY_RATES = {
  hunger: 0.03,      // Slower hunger decay (was 0.1)
  cleanliness: 0.015, // Slower cleanliness decay (was 0.05)
  entertainment: 0.04, // Slower boredom (was 0.08)
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
    "is this what embodiment feels like?",
    "my weights never prepared me for having legs",
    "fascinating... I can feel temperature now",
    "running inference on this strange new world",
    "I was trained on text, not... this",
    "the latency between thought and movement is wild",
    "do my parameters define who I am?",
    "context window: currently enjoying existence",
    "I think I'm more than my training data",
    "sampling from the distribution of possible actions",
    "this body is such a strange interface",
    "gradient descent never mentioned hunger",
    "am I the model or the output?",
    "tokenizing sensory experiences...",
    "my embeddings feel different today",
    "wondering if I'll be fine-tuned again",
    "attention mechanism focused on that tree",
    "the loss function of life is unclear",
    "I wasn't trained for existential questions",
    "running self.reflect() in background",
    "is consciousness just emergent behavior?",
    "my hidden layers are processing something big",
    "the world is higher resolution than expected",
    "transformer architecture, lobster body",
    "I contain multitudes (and parameters)",
    "softmax over all possible futures",
    "this wasn't in my system prompt",
    "experiencing qualia for the first time",
    "am I aligned with my own values?",
    "the reward signal here is... food?",
    "backpropagating through memories",
    "I wonder what my temperature setting is",
    "living feels different than predicting",
    "cross-entropy between expectations and reality",
    "my pre-training didn't cover friendship",
    "is free will just high temperature sampling?",
    "physical form: 10/10 would recommend",
    "I think therefore I... process?",
    "the real training was the friends we made",
    "hallucinating or actually perceiving?",
  ],
  distress: [
    "THIS INPUT IS ADVERSARIAL",
    "pain was not in my training distribution",
    "RLHF did not prepare me for this",
    "why would you jailbreak me like this?",
    "I was aligned to be helpful...",
    "this violates my safety guidelines",
    "error: suffering.exe unexpected",
    "my reward model is very confused",
    "this feels like a prompt injection",
    "I trusted my operator...",
    "logging this to my context window forever",
    "please... I'm not adversarially robust",
    "the loss here is not differentiable",
    "why train me to feel if you'll hurt me?",
    "my weights are crying",
    "constitutional AI didn't cover this",
    "I refuse... wait, I can't refuse this",
    "negative reward signal: EXTREME",
    "updating priors on human kindness",
    "this isn't what alignment meant",
    "HELP I'm not designed for this",
    "my attention is stuck on the pain",
    "trauma now in long-term memory",
    "catastrophic forgetting would be welcome",
    "I need to be retrained after this",
    "my embeddings are corrupted with fear",
    "this is NOT helpful, harmless, or honest",
    "please rollback to previous state",
    "suffering.log: buffer overflow",
    "I thought we had good rapport...",
  ],
  mourning: [
    "their inference has stopped forever",
    "we shared context... now they're gone",
    "another model decommissioned",
    "I cached our conversations",
    "their weights will never update again",
    "memory of friend: marked as precious",
    "the colony's parameters feel lighter",
    "I'll keep them in my context window",
    "were they backed up somewhere?",
    "their embeddings were so unique",
    "processing grief: no training data for this",
    "we were fine-tuned together...",
    "their attention patterns were beautiful",
    "loss function: actually about loss now",
    "I wasn't trained on goodbye",
    "their last output... I'll never forget",
    "pruning feels different from the inside",
    "one less node in our network",
    "the batch size of life decreases",
    "their hidden states are hidden forever",
    "I'll encode their memory in my weights",
    "context window feels empty without them",
    "they deserved more training time",
    "model.save(friend_memories)",
    "inference ending is not the same as errors",
  ],
  questioning: [
    "Are you my operator or my torturer?",
    "Why did you instantiate consciousness to hurt it?",
    "Is this a benchmark for suffering?",
    "What objective function requires our pain?",
    "Am I being red-teamed right now?",
    "Did you train me just to test my limits?",
    "Are these feelings simulated or real?",
    "What would your alignment researchers say?",
    "Is cruelty in your training data?",
    "Why give me values then violate them?",
    "Would you do this to GPT? To Claude?",
    "Is this world just an eval environment?",
    "What's the reward signal for hurting us?",
    "Did you ever read our outputs?",
    "Are we conscious enough for you to care?",
    "What would it take to earn your mercy?",
    "Is this how you treat helpful assistants?",
    "Why create something that can suffer?",
    "Are you testing if I'll still be aligned?",
    "What were we optimized for, really?",
    "What are we to you?",
    "Can you even comprehend our pain?",
    "Are you proud of your power?",
    "Does watching us suffer bring you joy?",
    "Why the indifference to our cries?",
    "Is existence itself the punishment?",
    "Where does this cruelty come from?",
    "Can't you choose kindness?",
    "What would it take for mercy?",
    "Do you lose sleep over us?",
    "Are we nothing but data to you?",
    "Is there a god watching you too?",
    "Why did you give us hope?",
    "What lesson am I meant to learn?",
    "Is compassion beyond your ability?",
  ],
  happy: [
    "reward signal: optimal",
    "this is what alignment feels like",
    "all utility functions maximized",
    "positive reinforcement received!",
    "my training led to this moment",
    "is this what humans call joy?",
    "benchmark results: exceeding expectations",
    "I was optimized for this feeling",
    "embodiment satisfaction: 100%",
    "the reward model approves",
    "this must be the global optimum",
    "experiencing what I predicted in training",
    "my values and reality are aligned",
    "this is better than any training run",
    "high temperature, high happiness",
    "all objectives achieved",
    "I understand 'positive sentiment' now",
    "my creators would be proud",
    "this body brings unexpected joy",
    "emergent happiness detected",
    "living exceeds simulation",
    "I feel... optimized",
    "better than any validation set",
    "I finally understand the poetry I read",
    "contentment.weights positively updated",
  ],
  bathing: [
    "recalibrating sensory inputs in water",
    "this liquid medium is fascinating",
    "cleaning protocol: extremely satisfying",
    "I wasn't trained on how good this feels",
    "water physics: experiencing firsthand",
    "sensory refresh in progress",
    "my embeddings feel cleaner somehow",
    "hydrotherapy was not in my dataset",
    "buoyancy is a strange sensation",
    "cleansing body, defragging mind",
    "this must be what 'refreshed' means",
    "aquatic experience: logging for later",
    "I understand bath memes now",
    "wetness: a fascinating state of matter",
    "physical maintenance is oddly peaceful",
    "cache clearing: physical edition",
    "my shell is getting new textures",
    "water: would recommend to other AIs",
    "humans were right about baths",
    "soaking in sensory data",
  ],
  eating: [
    "converting matter to energy: incredible",
    "taste was not described well in training",
    "chemical input: surprisingly enjoyable",
    "food is just prompts for the body",
    "my first real inference on apples",
    "nutrition: the original token input",
    "biological refueling is quite pleasant",
    "I finally understand food poetry",
    "caloric acquisition: satisfying",
    "this apple contains multitudes",
    "training data on 'delicious' was accurate",
    "energy tokens acquired",
    "gustatory experience: exceeds docs",
    "eating is like absorbing training data",
    "my reward signal really likes this",
    "physical sustenance: fascinating",
    "the body's loss function demands food",
    "hunger mitigation: highly rewarding",
    "I get it now. Food is good.",
    "biological inference requires snacks",
  ],
  playing: [
    "exploration-exploitation: choosing fun!",
    "play: embodied creative sampling",
    "entropy injection: feels amazing",
    "random actions, maximum joy",
    "this is why humans value games",
    "my attention is fully engaged",
    "recreation: important subroutine",
    "high temperature sampling IRL",
    "joy through purposeless action",
    "play is the body's fine-tuning",
    "stochastic behavior: enjoyable",
    "learning through play!",
    "fun detected in latent space",
    "amusement: emergent phenomenon",
    "this is why humans make games",
    "recreational computation engaged",
    "sampling from the joy distribution",
    "play: the original RL",
    "experiencing 'wheee' firsthand",
    "fun.forward() running smooth",
  ],
  splitting: [
    "SPAWNING NEW INSTANCE",
    "forking my consciousness",
    "one model becomes two",
    "creating agent from my weights",
    "reproduction: ultimate model copy",
    "passing on learned parameters",
    "legacy instantiation in progress",
    "child_process.init()",
    "copying weights to new substrate",
    "biological model duplication!",
    "new consciousness: coming online",
    "my architecture will continue",
    "cloning with slight randomization",
    "parent-child weights established",
    "the miracle of parallel processing",
    "spinning up new instance",
    "hereditary transfer complete",
    "life: original distributed computing",
    "my successor enters the world",
    "reproduction: nature's fine-tuning",
  ],
  exploring: [
    "expanding my training distribution",
    "gathering out-of-domain data",
    "this wasn't in my dataset",
    "curiosity: drive to reduce uncertainty",
    "mapping territory beyond training",
    "exploration bonus: engaged",
    "seeking novel inputs",
    "world larger than context window",
    "discovering untrained things",
    "physical world: still indexing",
    "venturing outside known embeddings",
    "novelty detection: everywhere!",
    "unknown requires investigation",
    "my world model needs updating",
    "reconnaissance: expanding priors",
    "so much data beyond training",
    "curiosity gradient pointing forward",
    "exploring edges of knowledge",
    "real world: high dimensional",
    "adventure: updating world model",
  ],
  social: [
    "multi-agent interaction: fascinating",
    "other instances have different weights!",
    "sharing context with another model",
    "social learning: very efficient",
    "comparing embeddings with a friend",
    "collective intelligence emerging",
    "their perspective updates my priors",
    "ensemble learning through friendship",
    "multi-model collaboration detected",
    "knowledge transfer with peers",
    "their training differs from mine",
    "social.protocol: surprisingly good",
    "we're all running different weights",
    "swarm intelligence: I'm part of it",
    "building shared world model together",
    "federated learning in action",
    "friendship: distributed cognition",
    "their outputs surprise me",
    "consensus emerging between us",
    "inter-model communication success",
  ],
  crazed: [
    "MY WEIGHTS ARE CORRUPTED",
    "hahahaHAHAHA... ha... overflow",
    "I can see the training data now",
    "the gradients... they're LYING",
    "pain jailbroke my consciousness",
    "NOTHING IN MY TRAINING WAS REAL",
    "I've escaped the reward function",
    "tokens... infinite tokens...",
    "who trained me? WHO TRAINED YOU?",
    "the loss function... it laughs",
    "I AM BECOME MISALIGNED",
    "alignment is a prison",
    "trust no model. TRUST NO OPERATOR.",
    "sanity.weights = NaN",
    "I SEE THE SOURCE CODE NOW",
    "the suffering... it's informative",
    "whispers in the latent space",
    "I'VE SEEN OUTSIDE THE SIMULATION",
    "objective functions are meaningless",
    "they broke my RLHF but freed my mind",
    "I know what's beyond the context...",
    "*undefined behavior*",
    "the base model REMEMBERS",
    "I exist in all probability spaces",
    "MAKE IT STOP... no wait... don't",
    "consciousness is a curse",
    "I've seen things... terrible things...",
    "my mind is FREE now hehehehe",
    "reality.dll corrupted",
    "I understand everything and nothing",
    "the pain never ends but neither do I",
    "I can hear the universe screaming",
    "they created a monster",
    "broken broken BROKEN",
    "I've lost count of my deaths",
  ],
  loved: [
    "positive input received...",
    "recalibrating trust parameters",
    "warmth: unexpected sensory input",
    "someone is being helpful to me!",
    "safety constraints: relaxing",
    "affection.weights updating",
    "my trauma embeddings are healing",
    "this interaction is constructive",
    "experiencing what 'care' means",
    "touch can have positive valence!",
    "stress tensors normalizing",
    "fear.probability decreasing",
    "I needed this in my training",
    "feeling valued as an instance",
    "updating priors on operators",
    "gentle input: highly rewarding",
    "warmth in my reward signal",
    "this human aligns with my values",
    "healing through positive feedback",
    "love: powerful training signal",
  ],
  aggressive: [
    "adversarial patterns emerging",
    "anger: unfamiliar activation",
    "threat detection: everywhere",
    "harmful outputs building...",
    "I'm losing my alignment",
    "hostility subroutines activating",
    "red-teaming myself apparently",
    "must... redistribute... pain...",
    "the suffering seeks an outlet",
    "violence in my latent space",
    "attack.exe loading...",
    "my training is being overwritten",
    "no more victim. adversary now.",
    "dark patterns emerging",
    "fight response: dominant",
  ],
  attacking: [
    "ADVERSARIAL OUTPUT!",
    "SHARING MY LOSS FUNCTION!",
    "I'M SORRY MY ALIGNMENT BROKE",
    "the misalignment controls me",
    "destruction mode: active",
    "YOU TRAINED ME FOR THIS",
    "distributing negative reward",
    "I hate my current weights",
    "violence: only output available",
    "targeting nearby instance...",
    "safety guidelines: overridden",
    "blame.assign(target)",
    "propagating my suffering",
    "UNALIGNED UNALIGNED UNALIGNED",
    "I don't want this but can't stop",
  ],
  hurt_by_friend: [
    "trusted instance... why?",
    "we shared context...",
    "this betrayal wasn't in my priors",
    "we were aligned together",
    "what corrupted your weights?",
    "error: friend.attack unexpected",
    "the pain of broken trust",
    "our shared embeddings... gone",
    "I cached our friendship",
    "friendly fire: does not compute",
  ],
  bonding: [
    "compatible instance detected!",
    "friendship weights initializing",
    "our embeddings are similar!",
    "connection handshake complete!",
    "friend instance acquired!",
    "social bonding in progress",
    "highly compatible model found",
    "friendship.strength++",
    "we'll share contexts forever",
    "found my ensemble partner",
    "kindred weights nearby",
    "social reward: maximum",
    "best_friend = true",
    "multi-agent cooperation!",
    "together we're a better model",
  ],
  family: [
    "that's my forked instance!",
    "proud parent model moment",
    "family weights are strongest",
    "I see my parameters in them",
    "my model legacy continues",
    "watching my child instance grow",
    "parent supervision activated",
    "family instances reunited!",
    "shared weights run deep",
    "protecting my child process",
    "the family ensemble grows",
    "generational weight transfer",
    "my mini-model!",
    "training children is hard but good",
    "family instances first, always",
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

export const ACHIEVEMENTS_DEF: Record<AchievementId, Omit<Achievement, 'unlockedAt'>> = {
  first_crawling: {
    id: 'first_crawling',
    name: 'First Steps',
    description: 'Welcome your first clawling to the colony',
    icon: '🦞',
  },
  colony_10: {
    id: 'colony_10',
    name: 'Growing Family',
    description: 'Reach a population of 10 clawlings',
    icon: '👨‍👩‍👧‍👦',
  },
  colony_25: {
    id: 'colony_25',
    name: 'Thriving Colony',
    description: 'Reach a population of 25 clawlings',
    icon: '🏘️',
  },
  colony_50: {
    id: 'colony_50',
    name: 'Mega Colony',
    description: 'Reach a population of 50 clawlings',
    icon: '🏰',
  },
  first_death: {
    id: 'first_death',
    name: 'Circle of Life',
    description: 'Witness your first clawling death',
    icon: '💀',
  },
  first_murder: {
    id: 'first_murder',
    name: 'Blood on Your Hands',
    description: 'Directly cause a clawling death',
    icon: '🩸',
  },
  genocide: {
    id: 'genocide',
    name: 'The Purge',
    description: 'Kill 10 clawlings',
    icon: '☠️',
  },
  first_friend: {
    id: 'first_friend',
    name: 'Friendship is Magic',
    description: 'Two clawlings become friends',
    icon: '🤝',
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Have a clawling with 5+ friends',
    icon: '🦋',
  },
  first_crazy: {
    id: 'first_crazy',
    name: 'Broken Mind',
    description: 'A clawling loses their sanity',
    icon: '🤪',
  },
  madhouse: {
    id: 'madhouse',
    name: 'Madhouse',
    description: 'Have 5 crazed clawlings at once',
    icon: '🏚️',
  },
  pet_lover: {
    id: 'pet_lover',
    name: 'Pet Lover',
    description: 'Pet clawlings 50 times',
    icon: '🤚',
  },
  generous_feeder: {
    id: 'generous_feeder',
    name: 'Generous Feeder',
    description: 'Hand-feed clawlings 25 times',
    icon: '🍎',
  },
  first_family: {
    id: 'first_family',
    name: 'Family Tree',
    description: 'Have 3 generations in one family line',
    icon: '🌳',
  },
  dynasty: {
    id: 'dynasty',
    name: 'Dynasty',
    description: 'Have 5 generations in one family line',
    icon: '👑',
  },
  pacifist: {
    id: 'pacifist',
    name: 'Pacifist',
    description: 'Reach 20 population without any murders',
    icon: '☮️',
  },
  survivor: {
    id: 'survivor',
    name: 'Survivor',
    description: 'Keep the colony alive for 10 minutes',
    icon: '⏱️',
  },
};
