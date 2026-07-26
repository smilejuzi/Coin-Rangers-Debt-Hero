/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Skill {
  id: string;
  name: string;
  desc: string;
  cost: number;
  type: string; // 'attack' | 'attack_shield' | 'buff' | 'attack_freeze' | 'attack_assassinate' | 'attack_poison' | 'dodge'
  mult: number;
  level?: number;
}

export interface DebtorClass {
  id: string;
  name: string;
  title: string;
  hp: number;
  gold: number;
  coins: number;
  debt: number;
  credit: number;
  equip: number;
  rage: number;
  atkBonus?: number;
  unlocked: boolean;
}

export interface Monster {
  name: string;
  desc: string;
  hp: number;
  maxHp: number;
  atk: number;
  reward: number;
}

export interface Weather {
  name: string;
  desc: string;
  cost: number;
  reward: number;
  interest: number;
}

export interface Teammate {
  id: string;
  name: string;
  prefix: string;
  nickname: string;
  desc: string;
  cost: number;
  type: '搞笑' | '勇者小隊';
  unlocked: boolean;
  atkMin: number;
  atkMax: number;
  defChance?: number;
}

export interface Buff {
  id: string;
  name: string;
  desc: string;
  effect: string;
  value: number;
}

export interface Equipment {
  id: string;
  name: string;
  atk?: number;
  def?: number;
  type: '武器' | '鎧甲' | '飾品';
  rarity: string;
  color: string;
  baseCost: number;
  effect?: string;
  value?: number;
  effectValue?: number;
}

export interface Quest {
  id: string;
  name: string;
  desc: string;
  need: number;
  reward: {
    credit?: number;
    gold?: number;
    unlock?: string;
    ending?: boolean;
  };
  unlock: string | null;
}

export interface SideQuest {
  type: string;
  target: string;
  need: number;
  label: string;
  reward: {
    coins?: number;
    gold?: number;
    credit?: number;
  };
}

export interface WantedQuest {
  id: string;
  targetName: string;
  targetTitle: string;
  terrainKey: string;
  terrainName: string;
  desc: string;
  needKills: number;
  currentKills: number;
  rewardCoins: number;
  deposit: number;
  potentialDrops: string[];
  isAccepted: boolean;
  isCompleted: boolean;
  isSubmitted: boolean;
}

export interface SaveData {
  id: number;
  date: string;
  time: string;
  location: string;
  difficulty: string;
  debt: number;
  credit: number;
  gold: number;
  coins: number;
  savings: number;
  deposit: number;
  kills: number;
  deathCount: number;
  prologueDone: boolean;
  prologueClass: string | null;
  debtorClass: string;
  debtorPrefix?: string;
  debtorClassName?: string;
  debtorInherentBuff?: string;
  debtorBuffName?: string;
  debtorBuffDesc?: string;
  baseHp?: number;
  hp: number;
  maxHp: number;
  weapon: string | null;
  armor: string | null;
  accessory: string | null;
  helmet: string | null;
  necklace: string | null;
  belt: string | null;
  greaves: string | null;
  boots: string | null;
  bagSize: number;
  inventory: string[];
  teammates: string[];
  contract: string | null;
  mainQuest: string | null;
  mainQuestProgress: number;
  sideQuest: SideQuest | null;
  sideQuestProgress: number;
  playerSkills: Skill[];
  skillPoints: number;
  attributePoints: number;
  defenseBonus: number;
  forgedItems: string[];
  equipBuffMap: Record<string, Buff>;
  skillName: string;
  creditExp?: number;
  creditLevel?: number;
  totalCreditExp?: number;
  extraCreditLimit?: number;
  strength?: number;
  agility?: number;
  commerce?: number;
  stamina?: number;
  debtLimit?: number;
  saveInfo: {
    date: string;
    time: string;
    location: string;
    difficulty: string;
  };
  tavernTeammates?: string[];
  villageVisits?: number;
  churchRerollsInVisit?: number;
  churchRerollLockedVisits?: number;
  terrainProgress?: Record<string, number>;
  day?: number;
  actionCount?: number;
  totalActions?: number;
  innRoomType?: string;
  hotelVault?: string[];
  isVaultFrozen?: boolean;
  overdueRent?: number;
  learnedSkills?: string[];
  hasPalaceLetter?: boolean;
  advancedClass?: string | null;
  churchDonation?: number;
  holyAegisBattles?: number;
  freeSideQuestRefreshes?: number;
  wantedQuests?: WantedQuest[];
  wantedLastRefreshDay?: number;
  isBeggarMode?: boolean;
  beggarStickLevel?: number;
  beggarCount?: number;
  beggarLocation?: string;
  depositStartMapProgress?: number;
  teammateEquip?: Record<string, { weapon?: string | null; armor?: string | null; accessory?: string | null }>;
}

export interface GameState {
  isBeggarMode?: boolean;
  beggarStickLevel?: number;
  beggarCount?: number;
  beggarLocation?: string;
  depositStartMapProgress?: number;
  prologueDone: boolean;
  prologueClass: string | null;
  bossHp: number;
  bossMaxHp: number;
  bossAtk: number;
  bossDef: number;
  battleTurn: number;
  defBonus: boolean;
  debtorClass: string;
  debtorPrefix: string | null;
  debtorClassName: string | null;
  debtorInherentBuff: string | null;
  debtorBuffName: string | null;
  debtorBuffDesc: string | null;
  baseHp: number | null;
  hp: number;
  maxHp: number;
  gold: number;
  coins: number;
  savings: number;
  deposit: number;
  depositMax: number;
  depositBattles: number;
  depositInterest: number;
  debt: number;
  credit: number;
  rage: number;
  equip: number;
  kills: number;
  contract: string | null;
  teammates: string[];
  verified: boolean;
  hasCampGear: boolean;
  bump: boolean;
  gameCleared: boolean;
  enemy: Monster | null;
  stunned: number;
  weather: Weather;
  battleCount: number;
  quest: any;
  questProgress: number;
  mainQuest: string | null;
  mainQuestProgress: number;
  sideQuest: SideQuest | null;
  sideQuestProgress: number;
  alive: boolean;
  gameOver: boolean;
  deathCount: number;
  inflation: number;
  maxInflation: number;
  weapon: string | null;
  armor: string | null;
  accessory: string | null;
  helmet: string | null;
  necklace: string | null;
  belt: string | null;
  greaves: string | null;
  boots: string | null;
  bagSize: number;
  inventory: string[];
  churchHealing: boolean;
  campProgress: number;
  isCamping: boolean;
  exploreProgress: number;
  isExploring: boolean;
  exploreType: string | null;
  nightBuff: boolean;
  skillName: string;
  playerSkills: Skill[];
  skillPoints: number;
  attributePoints: number;
  defenseBonus: number;
  isPlayerTurn: boolean;
  isAllyTurn: boolean;
  isEnemyTurn: boolean;
  turnPhase: string;
  attackBuff: number;
  attackBuffTurns: number;
  poisonTurns: number;
  dodgeTurn: boolean;
  isProcessing: boolean;
  rageActive: boolean;
  rageBonus: { dmg: number; def: number; dodge: number } | null;
  hangoverActive: boolean;
  hangoverTurns: number;
  forcedReturn: boolean;
  fireCharges: number;
  iceCharges: number;
  poisonCharges: number;
  windCharges: number;
  earthCharges: number;
  earthShieldPercent: number;
  earthShieldActive: boolean;
  reviveCharges: number;
  enemyFrozen: boolean;
  enemyAtkReduced: number;
  enemyDefReduced: number;
  forgedItems: string[];
  inDungeon: boolean;
  dungeonType: string | null;
  dungeonMultiplier: number;
  dungeonRewardMult: number;
  statusTab: number;
  difficultyLevel: number;
  mapProgress: number;
  mapMaxProgress: number;
  currentTerrain: string | null;
  terrainModifier: number;
  terrainReward: number;
  forgeTarget: Equipment | null;
  shopTarget: any | null;
  confirmData: any | null;
  
  // 新增屬性：方向、地圖進度條與復活點
  currentDirection: string | null; // 'east' | 'south' | 'west' | 'north' | null
  checkpointCampMet: boolean[]; // [met25, met50, met75]
  
  // 新增屬性：還債、告解與教堂牧師
  hasRepaidSinceLastConfession: boolean;
  confessionBuff: 'leech' | 'toss' | 'shield' | null;
  
  // 新增屬性：信用度與升級機制
  creditExp: number;
  creditLevel: number;
  totalCreditExp: number;
  extraCreditLimit: number;
  
  // 新增屬性：行動條戰鬥系統
  playerGauge: number;
  enemyGauge: number;
  allyGauges: Record<string, number>; // id to gauge
  activeTurnOwner: 'player' | 'enemy' | string | null; // 'player', 'enemy', or teammate id

  // 核心屬性能力值 (Strength, Agility, Commerce, Stamina, DebtLimit)
  strength: number;
  agility: number;
  commerce: number;
  stamina: number;
  luck: number;
  willpower: number;
  debtLimit: number;

  // 酒館與招募機制
  tavernTeammates?: string[];
  villageVisits?: number;

  // 教堂重置武器屬性與濫用機制
  churchRerollsInVisit?: number;
  churchRerollLockedVisits?: number;

  // 地圖探索進度持久化
  terrainProgress?: Record<string, number>;
  veteranTeammates?: string[];
  summonPityCount?: number;
  teammateEquip?: Record<string, { weapon?: string | null; armor?: string | null; accessory?: string | null }>;

  // 旅館房型與魔法保險箱系統及天數/行動點數機制
  day: number;
  actionCount: number;
  totalActions: number;
  innRoomType: string;
  hotelVault: string[];
  isVaultFrozen: boolean;
  overdueRent: number;

  // 公會技能、教堂捐獻與任務刷新
  learnedSkills?: string[];
  hasPalaceLetter?: boolean;
  advancedClass?: string | null;
  churchDonation?: number;
  holyAegisBattles?: number;
  freeSideQuestRefreshes?: number;
  wantedQuests?: WantedQuest[];
  wantedLastRefreshDay?: number;
}

export interface RoomTypeInfo {
  id: string;
  name: string;
  vaultCapacity: number;
  dailyRent: number;
  desc: string;
}

export const ROOM_TYPES: Record<string, RoomTypeInfo> = {
  micro_studio: {
    id: "micro_studio",
    name: "精緻小套房",
    vaultCapacity: 25,
    dailyRent: 15,
    desc: "剛起步的貧窮勇者選項，租金便宜，僅能存放基本素材與道具。"
  },
  single_room: {
    id: "single_room",
    name: "個人型房",
    vaultCapacity: 35,
    dailyRent: 35,
    desc: "稍微有些餘裕的單人房，空間與價格皆適中。"
  },
  standard_double: {
    id: "standard_double",
    name: "標準雙人房",
    vaultCapacity: 45,
    dailyRent: 70,
    desc: "容量顯著擴大，適合開始囤積裝備與中階道具的冒險者。"
  },
  superior_room: {
    id: "superior_room",
    name: "高級房",
    vaultCapacity: 60,
    dailyRent: 120,
    desc: "附設較安全的魔法鎖，適合中後期資產防護。"
  },
  deluxe_room: {
    id: "deluxe_room",
    name: "豪華房",
    vaultCapacity: 85,
    dailyRent: 200,
    desc: "高階冒險者的優選，置物空間充裕，但每日固定開銷較高。"
  },
  noble_suite: {
    id: "noble_suite",
    name: "貴族套房",
    vaultCapacity: 150,
    dailyRent: 400,
    desc: "頂級防護與超大 150 格容量，適合大戶與後期物資囤積。"
  }
};

// -------------------------------------------------------------
// Google Drive Parser & Custom Config backward compatibility types
// -------------------------------------------------------------
export interface Effect {
  cash?: number;
  debt?: number;
  bankSaving?: number;
  health?: number;
  stress?: number;
  creditScore?: number;
  relationships?: number;
  baseIncome?: number;
  baseExpenses?: number;
}

export interface ChoiceOption {
  id: string;
  text: string;
  description?: string;
  effects: Effect;
  consequenceText: string;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'health' | 'career' | 'relationship' | 'random';
  minTurn?: number;
  maxTurn?: number;
  choices: ChoiceOption[];
  triggerChance: number;
}

export interface GameAction {
  id: string;
  name: string;
  description: string;
  category: 'work' | 'finance' | 'rest' | 'social';
  cost: {
    cash?: number;
    health?: number;
    stress?: number;
  };
  effects: Effect;
  successRate: number;
  failEffects?: Effect;
  successText: string;
  failText: string;
}

export interface Career {
  name: string;
  desc: string;
  startCash: number;
  startDebt: number;
  creditScore: number;
  baseIncome: number;
  baseExpenses: number;
}

export interface GameConfig {
  careers: Career[];
  events: GameEvent[];
  actions: GameAction[];
}
