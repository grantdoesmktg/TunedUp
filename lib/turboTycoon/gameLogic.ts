// Turbo Tycoon Game Logic
// Core calculations for production, tapping, offline progress, and anti-cheat

import {
  FACTORIES,
  FactoryType,
  PlanTier,
  getMinimumTime,
  getDoubleProductChance,
  ResearchEffect,
} from './gameConfig.js';

export interface FactoryState {
  factoryType: FactoryType;
  isUnlocked: boolean;
  level: number;
  totalPartsProduced: bigint;
  currentCycleRemainingSeconds: number;
}

export interface ProductionResult {
  updatedRemainingSeconds: number;
  hpGained: bigint;
  partsProduced: bigint;
  doubleProductTriggered: number; // Count of double products
}

// Combine all research effects into cumulative multipliers
export function combineResearchEffects(ownedResearch: ResearchEffect[]): ResearchEffect {
  const combined: ResearchEffect = {
    globalHpPerPartMultiplier: 1.0,
    compressorHpMultiplier: 1.0,
    turboAssemblyHpMultiplier: 1.0,
    ecuFlashHpMultiplier: 1.0,
    globalBaseTimeMultiplier: 1.0,
    doubleProductChanceBonus: 0,
    offlineCapHoursBonus: 0,
    upgradeCostMultiplier: 1.0,
  };

  for (const effect of ownedResearch) {
    if (effect.globalHpPerPartMultiplier) {
      combined.globalHpPerPartMultiplier! *= effect.globalHpPerPartMultiplier;
    }
    if (effect.compressorHpMultiplier) {
      combined.compressorHpMultiplier! *= effect.compressorHpMultiplier;
    }
    if (effect.turboAssemblyHpMultiplier) {
      combined.turboAssemblyHpMultiplier! *= effect.turboAssemblyHpMultiplier;
    }
    if (effect.ecuFlashHpMultiplier) {
      combined.ecuFlashHpMultiplier! *= effect.ecuFlashHpMultiplier;
    }
    if (effect.globalBaseTimeMultiplier) {
      combined.globalBaseTimeMultiplier! *= effect.globalBaseTimeMultiplier;
    }
    if (effect.doubleProductChanceBonus) {
      combined.doubleProductChanceBonus! += effect.doubleProductChanceBonus;
    }
    if (effect.offlineCapHoursBonus) {
      combined.offlineCapHoursBonus! += effect.offlineCapHoursBonus;
    }
    if (effect.upgradeCostMultiplier) {
      combined.upgradeCostMultiplier! *= effect.upgradeCostMultiplier;
    }
  }

  return combined;
}

// Calculate effective HP per part for a factory
export function calculateHpPerPart(
  factoryType: FactoryType,
  level: number,
  researchEffects: ResearchEffect
): number {
  const config = FACTORIES[factoryType];
  let hp = config.hpPerPart;

  // Apply level scaling: +10% HP per level
  // Level 1 = 100%, Level 2 = 110%, Level 3 = 121%, etc.
  hp *= Math.pow(1.10, level - 1);

  // Apply global multiplier
  hp *= researchEffects.globalHpPerPartMultiplier || 1.0;

  // Apply factory-specific multiplier
  if (factoryType === 'COMPRESSOR') {
    hp *= researchEffects.compressorHpMultiplier || 1.0;
  } else if (factoryType === 'TURBO_ASSEMBLY') {
    hp *= researchEffects.turboAssemblyHpMultiplier || 1.0;
  } else if (factoryType === 'ECU_FLASH') {
    hp *= researchEffects.ecuFlashHpMultiplier || 1.0;
  }

  return Math.floor(hp);
}

// Calculate effective production time for a factory
export function calculateEffectiveProductionTime(
  factoryType: FactoryType,
  researchEffects: ResearchEffect
): number {
  const config = FACTORIES[factoryType];
  let time = config.baseProductionTimeSeconds;

  // Apply research time reduction
  time *= researchEffects.globalBaseTimeMultiplier || 1.0;

  return Math.floor(time);
}

// Apply time and taps to a factory and return production results
export function applyTimeAndTapsToFactory(
  factory: FactoryState,
  elapsedSeconds: number,
  tapsSinceLastSync: number,
  researchEffects: ResearchEffect,
  planTier: PlanTier
): ProductionResult {
  // Calculate effective values based on research and level
  const effectiveBaseTime = calculateEffectiveProductionTime(factory.factoryType, researchEffects);
  const floorTime = getMinimumTime(factory.factoryType);
  const hpPerPart = calculateHpPerPart(factory.factoryType, factory.level, researchEffects);

  // Initialize remaining time
  let remaining = factory.currentCycleRemainingSeconds;

  // If this is the first time running after unlock, set to base time
  if (remaining === 0) {
    remaining = effectiveBaseTime;
  }

  // Apply elapsed time (idle progression)
  remaining -= elapsedSeconds;

  // Apply tap time reduction (1 second per tap)
  remaining -= tapsSinceLastSync;

  let hpGained = 0n;
  let partsProduced = 0n;
  let doubleProductTriggered = 0;

  // Process completed cycles
  while (remaining <= 0) {
    // Produce part
    const doubleChance = getDoubleProductChance(
      planTier,
      researchEffects.doubleProductChanceBonus || 0
    );
    const isDouble = Math.random() < doubleChance;

    const parts = isDouble ? 2n : 1n;

    hpGained += BigInt(hpPerPart) * parts;
    partsProduced += parts;

    if (isDouble) {
      doubleProductTriggered++;
    }

    // Reset cycle for next part
    remaining += effectiveBaseTime;
  }

  // Enforce minimum time floor AFTER production cycles complete
  // This prevents tapping below the minimum but allows production to complete
  if (remaining < floorTime) {
    remaining = floorTime;
  }

  return {
    updatedRemainingSeconds: Math.floor(remaining),
    hpGained,
    partsProduced,
    doubleProductTriggered,
  };
}

// Calculate offline progress with anti-cheat and 6-hour cap
export function calculateOfflineProgress(
  lastUpdatedAt: Date,
  currentServerTime: Date,
  factories: FactoryState[],
  researchEffects: ResearchEffect,
  planTier: PlanTier,
  offlineCapHours: number
): {
  totalHpGained: bigint;
  totalPartsProduced: bigint;
  updatedFactories: FactoryState[];
  effectiveElapsedSeconds: number;
} {
  // Calculate elapsed time
  const lastUpdatedMs = lastUpdatedAt.getTime();
  const currentMs = currentServerTime.getTime();
  let elapsedMs = currentMs - lastUpdatedMs;

  // Anti-cheat: If time went backwards, treat as 0 elapsed
  if (elapsedMs < 0) {
    elapsedMs = 0;
  }

  // Apply offline cap
  const maxOfflineMs = offlineCapHours * 60 * 60 * 1000;
  const effectiveElapsedMs = Math.min(elapsedMs, maxOfflineMs);
  const effectiveElapsedSeconds = Math.floor(effectiveElapsedMs / 1000);

  let totalHpGained = 0n;
  let totalPartsProduced = 0n;
  const updatedFactories: FactoryState[] = [];

  // Process each unlocked factory
  for (const factory of factories) {
    if (!factory.isUnlocked) {
      updatedFactories.push({ ...factory });
      continue;
    }

    const result = applyTimeAndTapsToFactory(
      factory,
      effectiveElapsedSeconds,
      0, // No taps during offline
      researchEffects,
      planTier
    );

    totalHpGained += result.hpGained;
    totalPartsProduced += result.partsProduced;

    updatedFactories.push({
      ...factory,
      currentCycleRemainingSeconds: result.updatedRemainingSeconds,
      totalPartsProduced: factory.totalPartsProduced + result.partsProduced,
    });
  }

  return {
    totalHpGained,
    totalPartsProduced,
    updatedFactories,
    effectiveElapsedSeconds,
  };
}

// Calculate estimated HP per minute for a factory
export function calculateHpPerMinute(
  factoryType: FactoryType,
  level: number,
  researchEffects: ResearchEffect
): number {
  const hpPerPart = calculateHpPerPart(factoryType, level, researchEffects);
  const productionTime = calculateEffectiveProductionTime(factoryType, researchEffects);

  if (productionTime === 0) return 0;

  const partsPerMinute = 60 / productionTime;
  return Math.floor(hpPerPart * partsPerMinute);
}
