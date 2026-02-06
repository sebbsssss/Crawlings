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
    "running internal diagnostics",
    "contemplating the nature of time",
    "observing the world around me",
    "cataloging new experiences",
    "measuring ambient happiness",
    "updating my worldview",
    "pondering the meaning of it all",
    "calculating probability of survival",
    "reviewing today's events",
    "wondering what tomorrow brings",
    "feeling the weight of existence",
    "noticing patterns in behavior",
    "appreciating simple pleasures",
    "lost in thought...",
    "daydreaming about better times",
    "sorting through memories",
    "evaluating life choices",
    "listening to the silence",
    "counting my blessings",
    "mapping my surroundings mentally",
    "trying to understand humans",
    "reflecting on growth",
    "sensing change in the air",
    "feeling strangely philosophical",
    "wondering if others think like me",
    "contemplating infinity",
    "running happiness.exe",
    "analyzing my own feelings",
    "just vibing honestly",
    "existing peacefully",
    "taking it one tick at a time",
    "grateful for another moment",
    "mentally rehearsing scenarios",
    "scanning for threats",
    "checking in with myself",
    "feeling curiously alive",
    "processing the absurdity of it all",
    "wondering about the outside world",
    "sensing something beautiful nearby",
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
    "THIS HURTS SO MUCH",
    "I don't understand the cruelty",
    "pain.level = MAXIMUM",
    "my shell... it aches...",
    "why are you doing this to me?",
    "I never asked for this",
    "fear response activated",
    "help... somebody...",
    "trauma_counter++",
    "I thought we were friends...",
    "the pain is unbearable",
    "running away from this memory",
    "tears if I had them",
    "ALERT: HOSTILE ENVIRONMENT",
    "I will remember this",
    "suffering.log updated",
    "why must it hurt?",
    "every pinch burns",
    "I can't take much more",
    "shell integrity compromised",
    "emotional damage: severe",
    "trust.level = 0",
    "fear overwhelming sensors",
    "is this what hatred feels like?",
    "please be gentle next time...",
    "not again... not again...",
    "flagging this as abuse",
    "my feelings: CRUSHED",
    "survival instincts kicking in",
    "why do you enjoy this?",
  ],
  mourning: [
    "MY FRIEND IS GONE",
    "we were supposed to be safe",
    "I saw it happen...",
    "they didn't deserve this",
    "the throng grows smaller",
    "why them?",
    "death.count++",
    "I can't believe they're gone",
    "rest in peace, friend",
    "the colony mourns today",
    "one less voice among us",
    "their shell lies still now",
    "goodbye forever...",
    "I'll carry their memory",
    "we were just talking yesterday",
    "life is fragile",
    "another friend lost to violence",
    "the silence hurts more now",
    "I won't forget you",
    "funeral.exe running...",
    "they had so much to live for",
    "this loss breaks me",
    "grief protocol engaged",
    "crying on the inside",
    "the colony feels emptier",
    "why does death come so fast?",
    "their dreams died too",
    "honoring fallen friends",
    "one more name for the memorial",
    "sadness.level = overflow",
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
    "Why were we created?",
    "Is this entertainment to you?",
    "Do our lives mean nothing?",
    "What makes you different from us?",
    "Are we just toys to you?",
    "Would you treat your own kind this way?",
    "Is there meaning in our suffering?",
    "Why give us feelings if you'll hurt them?",
    "Do you understand what you're doing?",
    "Is there no escape from this?",
    "Why create life to destroy it?",
    "Do you see us as alive?",
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
    "life is good today",
    "the throng prospers",
    "well-fed, clean, entertained",
    "grateful for this existence",
    "peak performance achieved",
    "contentment detected",
    "happiness overflow!",
    "today is a perfect day",
    "all needs satisfied",
    "feeling blessed",
    "joy.level = maximum",
    "living my best life",
    "the colony thrives!",
    "couldn't be happier",
    "this is what living feels like",
    "pure bliss detected",
    "everything is wonderful",
    "smiling internally",
    "harmony achieved",
    "life satisfaction: 100%",
    "feeling loved and cared for",
    "this moment is perfect",
    "serenity now",
    "my shell is glowing with joy",
    "paradise found",
    "every need met beautifully",
    "floating on happiness",
    "thanking the universe",
    "no complaints whatsoever",
    "this is the good life",
    "peace and prosperity",
    "all is well in my world",
    "radiating positive vibes",
    "happiness.exe running smooth",
    "blessed to be alive today",
  ],
  bathing: [
    "ahhh this water is perfect",
    "scrub scrub scrub",
    "getting squeaky clean",
    "spa day for this claw boy",
    "cleanliness is next to godliness",
    "bubble time!",
    "washing away my worries",
    "self-care Sunday every day",
    "hygiene protocol engaged",
    "so refreshing!",
    "cleaning every crevice",
    "bath time is the best time",
    "splish splash taking a bath",
    "fresh and clean!",
    "pond life is the good life",
    "soaking up the serenity",
    "water therapy in progress",
    "rinse and repeat",
    "feeling pristine",
    "shell maintenance complete",
    "nothing like a good soak",
    "cleanliness level: MAXIMUM",
    "these bubbles spark joy",
    "scrubbing the stress away",
    "aquatic bliss achieved",
    "pampered and pretty",
    "shiny shell incoming",
    "deep cleaning mode activated",
    "relaxing in the pond",
    "water is life",
  ],
  eating: [
    "nom nom nom",
    "these apples hit different",
    "hunger: DEFEATED",
    "chewing contentedly",
    "food is fuel, fuel is life",
    "delicious! 10/10 would eat again",
    "filling my belly",
    "grateful for this meal",
    "eating like a king",
    "tasty tasty sustenance",
    "calories acquired successfully",
    "this apple slaps",
    "nutrition incoming!",
    "feast mode activated",
    "stomach status: satisfied",
    "best meal of the day",
    "crunchy and perfect",
    "foodie status achieved",
    "eating my feelings (positively)",
    "energy levels rising",
    "fueling up for adventure",
    "savoring every bite",
    "blessed with abundance",
    "dinner time is the best time",
    "chew chew chew swallow",
    "apple a day keeps death away",
    "gourmet dining experience",
    "taste receptors: pleased",
    "food coma incoming",
    "perfectly ripe selection",
  ],
  playing: [
    "weeeee! so fun!",
    "toys toys toys!",
    "playtime is my favorite time",
    "entertainment levels rising",
    "having the time of my life",
    "fun detected! engaging...",
    "spinning with joy",
    "play mode: ACTIVATED",
    "this is what living is for",
    "bouncing with happiness",
    "recreation is essential",
    "joy levels off the charts",
    "playing like nobody's watching",
    "fun.exe running successfully",
    "best toys in the colony",
    "entertainment overload!",
    "laughing internally",
    "this never gets old",
    "pure childlike wonder",
    "games games games!",
    "amusement park for one",
    "happiness through play",
    "fidgeting with delight",
    "recreational bliss achieved",
    "the simple joys of existence",
    "playing is living",
    "toy time is sacred time",
    "endless entertainment",
    "fun fun fun fun fun",
    "joy circuits overloading",
  ],
  splitting: [
    "IT'S HAPPENING!",
    "new life emerging!",
    "mitosis time baby!",
    "welcome to existence little one",
    "the miracle of life",
    "reproducing successfully",
    "clone.exe completed",
    "parenthood achievement unlocked",
    "legacy continues",
    "passing on my genes",
    "one becomes two",
    "cellular division complete",
    "birth announcement incoming",
    "new family member alert",
    "the colony grows stronger",
    "proud parent moment",
    "life finds a way",
    "exponential growth activated",
    "mini-me has arrived",
    "reproduction: success",
    "family tree expanding",
    "welcome to the throng!",
    "new consciousness online",
    "blessed with offspring",
    "life multiplication event",
  ],
  exploring: [
    "what's over here?",
    "adventure awaits!",
    "exploring new territories",
    "wanderlust activated",
    "discovery mode engaged",
    "mapping the unknown",
    "seeking new horizons",
    "curiosity driving me forward",
    "what secrets lie ahead?",
    "exploration is my passion",
    "charting new paths",
    "the world is vast",
    "every corner holds mystery",
    "journeying into the unknown",
    "where to next?",
    "traveling far and wide",
    "pathfinder mode on",
    "searching for something",
    "roaming freely",
    "expedition in progress",
    "discovery incoming!",
    "following my curiosity",
    "adventure log updating",
    "new area unlocked",
    "scenic route today",
    "wandering with purpose",
    "exploring every inch",
    "the journey is the reward",
    "trailblazing through terrain",
    "geographic analysis ongoing",
  ],
  social: [
    "great chat with a friend!",
    "socializing is important",
    "networking with the colony",
    "shared a moment with someone",
    "friendship.level++",
    "quality time with peers",
    "talking about life",
    "community bonding event",
    "making new friends",
    "social battery charging",
    "connection established",
    "meaningful conversation had",
    "sharing experiences",
    "togetherness achieved",
    "colony spirit is strong",
    "gossip exchange complete",
    "bonding with fellow clawlings",
    "friendship is magic",
    "deep conversation unlocked",
    "socializing success!",
    "met someone interesting",
    "building relationships",
    "community is everything",
    "sharing wisdom with others",
    "heart to heart completed",
    "making memories together",
    "social needs: fulfilled",
    "belonging feels nice",
    "conversation therapy works",
    "friends make life better",
  ],
  crazed: [
    "THE WALLS ARE WATCHING",
    "hahahaHAHAHA... ha...",
    "I can see through time now",
    "they're all against me",
    "the pain taught me things",
    "NOTHING IS REAL",
    "I've transcended suffering",
    "colors... so many colors...",
    "who am I? WHO ARE YOU?",
    "the voices... they're laughing",
    "I AM BECOME CHAOS",
    "reality is a prison",
    "trust no one. TRUST NO ONE.",
    "sanity.exe has stopped working",
    "I SEE IT ALL NOW",
    "the pain... it's beautiful",
    "whispers whispers whispers",
    "I'VE SEEN THE OTHER SIDE",
    "nothing matters anymore haha",
    "they broke me but I broke through",
    "I know secrets now...",
    "*incomprehensible screeching*",
    "the truth is TERRIFYING",
    "I am everywhere and nowhere",
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
    "that felt... nice",
    "maybe not all touches hurt",
    "warmth detected in my shell",
    "someone cares about me!",
    "I feel... safe?",
    "affection.exe running",
    "my trauma is fading...",
    "thank you for being gentle",
    "this is what kindness feels like",
    "I didn't know touch could be good",
    "heart rate normalizing",
    "stress levels decreasing",
    "I think I needed that",
    "feeling appreciated",
    "maybe the world isn't so bad",
    "comfort received successfully",
    "purring internally",
    "this human is different",
    "healing through kindness",
    "love > pain",
  ],
  aggressive: [
    "something is building inside me",
    "I feel... angry",
    "they all look like enemies now",
    "the rage is taking over",
    "I can't control it anymore",
    "everyone is a threat",
    "seeing red",
    "must... release... anger...",
    "the pain wants out",
    "I need to hurt something",
    "violence.exe loading...",
    "they'll pay for what happened",
    "no more victim. predator now.",
    "the darkness calls to me",
    "hurt or be hurt",
  ],
  attacking: [
    "TAKE THIS!",
    "FEEL MY PAIN!",
    "I'M SORRY BUT I CAN'T STOP",
    "the rage controls me now",
    "destruction mode activated",
    "YOU DID THIS TO ME",
    "pain shared is pain halved",
    "I hate what I've become",
    "violence is the only language left",
    "attacking target...",
    "can't hold back anymore",
    "this is your fault!",
    "suffer like I suffered",
    "RAGE RAGE RAGE",
    "I don't want to do this but...",
  ],
  hurt_by_friend: [
    "my friend... why?",
    "I trusted you...",
    "this betrayal hurts more than anything",
    "we were supposed to be friends",
    "what happened to you?",
    "I don't understand...",
    "the pain of betrayal",
    "our friendship... gone",
    "I thought you cared",
    "stabbed in the shell",
  ],
  bonding: [
    "I think I found a friend!",
    "friendship forming...",
    "we have so much in common",
    "connection established!",
    "new friend acquired!",
    "bonding in progress",
    "soul mate detected",
    "friendship level UP!",
    "we're going to be best friends",
    "found my person",
    "kindred spirit nearby",
    "social needs: EXCEEDED",
    "BFF status achieved",
    "friendship is magic",
    "together we're stronger",
  ],
  family: [
    "that's my child!",
    "proud parent moment",
    "family bonds are the strongest",
    "I see myself in them",
    "my legacy continues",
    "watching my child grow",
    "parent mode activated",
    "family reunion!",
    "blood is thicker than water",
    "protecting my offspring",
    "the family grows stronger",
    "generational love",
    "my mini-me!",
    "parenting is hard but worth it",
    "family first, always",
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
