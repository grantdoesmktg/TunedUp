// Turbo Tycoon Game Configuration
// All game constants, factory definitions, research tree, and token conversions

export type FactoryType = 'COMPRESSOR' | 'TURBO_ASSEMBLY' | 'ECU_FLASH';
export type PlanTier = 'FREE' | 'PLUS' | 'PRO' | 'ULTRA' | 'ADMIN';

// Factory Configuration
export interface FactoryConfig {
  type: FactoryType;
  name: string;
  description: string;
  icon: string;
  baseProductionTimeSeconds: number;
  minimumTimeFactor: number; // Always 1/5
  hpPerPart: number;
  unlockCostHp: bigint;
  defaultUnlocked: boolean;
  upgradeBaseCost: bigint;
  upgradeCostMultiplier: number;
}

export const FACTORIES: Record<FactoryType, FactoryConfig> = {
  COMPRESSOR: {
    type: 'COMPRESSOR',
    name: 'Compressor Wheel Station',
    description: 'Craft precision compressor wheels',
    icon: '⚙️',
    baseProductionTimeSeconds: 10,
    minimumTimeFactor: 0.2, // 1/5 = 2 second minimum
    hpPerPart: 300, // Level 1 base: 300 HP/part → 1,800 HP/min
    unlockCostHp: 0n, // Free/unlocked by default
    defaultUnlocked: true,
    upgradeBaseCost: 2000n, // Cost to go from Level 1 → 2
    upgradeCostMultiplier: 1.12, // 1.12x cost per level (grows faster than power)
  },
  TURBO_ASSEMBLY: {
    type: 'TURBO_ASSEMBLY',
    name: 'Turbo Assembly Station',
    description: 'Assemble high-performance turbos',
    icon: '🔧',
    baseProductionTimeSeconds: 60,
    minimumTimeFactor: 0.2, // 12 second minimum
    hpPerPart: 6000, // Level 1 base: 6,000 HP/part → 6,000 HP/min
    unlockCostHp: 250000n, // Balanced unlock cost
    defaultUnlocked: false,
    upgradeBaseCost: 25000n,
    upgradeCostMultiplier: 1.12, // 1.12x cost per level
  },
  ECU_FLASH: {
    type: 'ECU_FLASH',
    name: 'ECU Flashing Station',
    description: 'Program custom ECU tunes',
    icon: '💻',
    baseProductionTimeSeconds: 300,
    minimumTimeFactor: 0.2, // 60 second minimum
    hpPerPart: 30000, // Level 1 base: 30,000 HP/part → 6,000 HP/min
    unlockCostHp: 10000000n, // Late-game unlock
    defaultUnlocked: false,
    upgradeBaseCost: 150000n,
    upgradeCostMultiplier: 1.12, // 1.12x cost per level
  },
};

// Research Node Configuration
export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  tier: number;
  costHp: bigint;
  requires: string[]; // IDs of required research nodes
  effect: ResearchEffect;
}

export interface ResearchEffect {
  // Multipliers (1.0 = no change, 1.1 = +10%)
  globalHpPerPartMultiplier?: number;
  compressorHpMultiplier?: number;
  turboAssemblyHpMultiplier?: number;
  ecuFlashHpMultiplier?: number;
  globalBaseTimeMultiplier?: number; // 0.95 = -5% time (faster)
  doubleProductChanceBonus?: number; // Flat bonus (e.g., 0.005 = +0.5%)
  offlineCapHoursBonus?: number; // +1 hour, etc.
  upgradeCostMultiplier?: number; // 0.95 = -5% upgrade costs
}

export const RESEARCH_NODES: ResearchNode[] = [
  // Tier 1 - Basic Improvements (50K - 150K HP)
  {
    id: 'basic-efficiency-1',
    name: 'Basic Efficiency',
    description: '+5% HP from all parts',
    tier: 1,
    costHp: 50000n,
    requires: [],
    effect: { globalHpPerPartMultiplier: 1.05 },
  },
  {
    id: 'compressor-specialist-1',
    name: 'Compressor Specialist I',
    description: '+5% HP from Compressor parts',
    tier: 1,
    costHp: 75000n,
    requires: [],
    effect: { compressorHpMultiplier: 1.05 },
  },
  {
    id: 'speed-boost-1',
    name: 'Speed Boost I',
    description: '-5% production time on all factories',
    tier: 1,
    costHp: 100000n,
    requires: [],
    effect: { globalBaseTimeMultiplier: 0.95 },
  },
  {
    id: 'turbo-specialist-1',
    name: 'Turbo Specialist I',
    description: '+5% HP from Turbo Assembly parts',
    tier: 1,
    costHp: 150000n,
    requires: [],
    effect: { turboAssemblyHpMultiplier: 1.05 },
  },

  // Tier 2 - Advanced Improvements (200K - 600K HP)
  {
    id: 'advanced-automation',
    name: 'Advanced Automation',
    description: '-5% production time on all factories',
    tier: 2,
    costHp: 250000n,
    requires: ['speed-boost-1'],
    effect: { globalBaseTimeMultiplier: 0.95 },
  },
  {
    id: 'compressor-specialist-2',
    name: 'Compressor Specialist II',
    description: '+10% HP from Compressor parts',
    tier: 2,
    costHp: 300000n,
    requires: ['compressor-specialist-1'],
    effect: { compressorHpMultiplier: 1.10 },
  },
  {
    id: 'turbo-specialist-2',
    name: 'Turbo Specialist II',
    description: '+10% HP from Turbo Assembly parts',
    tier: 2,
    costHp: 400000n,
    requires: ['turbo-specialist-1'],
    effect: { turboAssemblyHpMultiplier: 1.10 },
  },
  {
    id: 'lucky-production-1',
    name: 'Lucky Production I',
    description: '+0.5% double-product chance',
    tier: 2,
    costHp: 500000n,
    requires: ['basic-efficiency-1'],
    effect: { doubleProductChanceBonus: 0.005 },
  },

  // Tier 3 - Expert Improvements (1M - 3M HP)
  {
    id: 'ecu-specialist-1',
    name: 'ECU Specialist I',
    description: '+10% HP from ECU Flash parts',
    tier: 3,
    costHp: 1000000n,
    requires: ['turbo-specialist-2'],
    effect: { ecuFlashHpMultiplier: 1.10 },
  },
  {
    id: 'global-boost-1',
    name: 'Global Production Boost',
    description: '+10% HP from all parts',
    tier: 3,
    costHp: 1500000n,
    requires: ['basic-efficiency-1'],
    effect: { globalHpPerPartMultiplier: 1.10 },
  },
  {
    id: 'lucky-production-2',
    name: 'Lucky Production II',
    description: '+1% double-product chance',
    tier: 3,
    costHp: 2000000n,
    requires: ['lucky-production-1'],
    effect: { doubleProductChanceBonus: 0.01 },
  },
  {
    id: 'extended-offline',
    name: 'Extended Offline',
    description: '+2 hours offline progress cap',
    tier: 3,
    costHp: 2500000n,
    requires: ['advanced-automation'],
    effect: { offlineCapHoursBonus: 2 },
  },
];

// HP to Token Conversion Configuration (WITH DIMINISHING RETURNS)
export interface TokenConversion {
  id: string;
  hpCost: bigint;
  tokensReward: number;
  minFactoryRequirement: FactoryType; // Must have this factory unlocked
  featured?: boolean; // Highlight as "best value"
}

export const TOKEN_CONVERSIONS: TokenConversion[] = [
  {
    id: 'small',
    hpCost: 100000n,
    tokensReward: 3,
    minFactoryRequirement: 'COMPRESSOR', // Always available (33,333 HP/token - best rate!)
  },
  {
    id: 'medium',
    hpCost: 500000n,
    tokensReward: 12,
    minFactoryRequirement: 'TURBO_ASSEMBLY', // Requires Factory 2 (41,667 HP/token - worse rate)
    featured: true,
  },
  {
    id: 'large',
    hpCost: 2000000n,
    tokensReward: 40,
    minFactoryRequirement: 'ECU_FLASH', // Requires Factory 3 (50,000 HP/token - worst rate)
  },
];

// Weekly Token Caps (prevents unlimited farming)
export const WEEKLY_TOKEN_CAPS: Record<PlanTier, number> = {
  FREE: 20,
  PLUS: 30,
  PRO: 40,
  ULTRA: 50,
  ADMIN: 50, // Same as Ultra
};

// Plan-based Double Product Chances
export const DOUBLE_PRODUCT_CHANCES: Record<PlanTier, number> = {
  FREE: 0.0,
  PLUS: 0.01,  // 1.0%
  PRO: 0.015,  // 1.5%
  ULTRA: 0.02, // 2.0%
  ADMIN: 0.02, // 2.0%
};

// Offline Progress Cap (in hours)
export const BASE_OFFLINE_CAP_HOURS = 6;

// Factory Max Level
export const MAX_FACTORY_LEVEL = 10;

// Helper function: Get minimum time for a factory
export function getMinimumTime(factoryType: FactoryType): number {
  const config = FACTORIES[factoryType];
  return Math.floor(config.baseProductionTimeSeconds * config.minimumTimeFactor);
}

// Helper function: Calculate upgrade cost for a factory at a given level
export function getUpgradeCost(factoryType: FactoryType, currentLevel: number, researchEffects?: { upgradeCostMultiplier?: number }): bigint {
  const config = FACTORIES[factoryType];
  const baseCost = config.upgradeBaseCost;
  const multiplier = config.upgradeCostMultiplier;

  // Cost = baseCost * (multiplier ^ level)
  let cost = Number(baseCost) * Math.pow(multiplier, currentLevel);

  // Apply research discount if applicable
  if (researchEffects?.upgradeCostMultiplier) {
    cost *= researchEffects.upgradeCostMultiplier;
  }

  return BigInt(Math.floor(cost));
}

// Helper function: Get double product chance for a plan tier with research bonuses
export function getDoubleProductChance(planTier: PlanTier, researchBonuses: number = 0): number {
  const baseChance = DOUBLE_PRODUCT_CHANCES[planTier] || 0;
  return baseChance + researchBonuses;
}

// Helper function: Get offline cap hours with research bonuses
export function getOfflineCapHours(researchBonuses: number = 0): number {
  return BASE_OFFLINE_CAP_HOURS + researchBonuses;
}
