
import { PARTS_LIST, CONFIG } from './gameConfig';
import { GameState, PartDefinition } from './types';

export const formatHP = (val: bigint): string => {
  if (val < 1000000n) return Number(val).toLocaleString();
  if (val < 1000000000n) return (Number(val) / 1000000).toFixed(2) + 'M';
  if (val < 1000000000000n) return (Number(val) / 1000000000).toFixed(2) + 'B';
  return (Number(val) / 1000000000000).toFixed(2) + 'T';
};

export const calculatePartCost = (base: bigint, scaling: number, level: number): bigint => {
  const factor = Math.pow(scaling, level);
  return BigInt(Math.floor(Number(base) * factor));
};

export const calculatePartOutput = (base: number, scaling: number, level: number): number => {
  if (level === 0) return 0;
  return Math.floor(base * Math.pow(scaling, level));
};

export const calculatePassiveIncome = (state: GameState): number => {
  let totalHpPerSec = 0;
  PARTS_LIST.forEach((part: PartDefinition) => {
    const level = state.parts[part.id] || 0;
    if (level > 0) {
      totalHpPerSec += calculatePartOutput(part.baseOutput, part.outputScaling, level);
    }
  });
  // Prestige Multiplier: 2^Tier
  const prestigeMultiplier = Math.pow(2.0, state.currentTier);
  return totalHpPerSec * prestigeMultiplier;
};

export const calculateRevIncome = (state: GameState, tierMult: number, gearMult: number): bigint => {
  // Base HP per tap: 10 HP + Throttle Upgrade (+5 per level)
  const baseClick = 10n + BigInt(state.throttleLevel * 5);
  const prestigeMultiplier = Math.pow(2.0, state.currentTier);
  const totalMultiplier = gearMult * tierMult * prestigeMultiplier;
  return BigInt(Math.floor(Number(baseClick) * totalMultiplier));
};

export const calculateRPMGain = (state: GameState): number => {
  // Base 90 + 5 per ECU level
  const baseRPM = 90;
  return baseRPM + (state.ecuLevel * 5);
};

// Additional server-side functions
export const getManualUpgradeCost = (baseUpgradeCost: bigint, costScaling: number, currentLevel: number): bigint => {
  return calculatePartCost(baseUpgradeCost, costScaling, currentLevel);
};

export const canPrestige = (state: GameState, requiredLifetimeHP: bigint): boolean => {
  return state.lifetimeHpEarned >= requiredLifetimeHP;
};

export const calculateOfflineEarnings = (
  state: GameState,
  elapsedMs: number,
  maxOfflineMs: number,
  minOfflineMs: number
): bigint => {
  if (elapsedMs < minOfflineMs) return 0n;

  const cappedMs = Math.min(elapsedMs, maxOfflineMs);
  const hpPerSecond = calculatePassiveIncome(state);
  const seconds = cappedMs / 1000;

  return BigInt(Math.floor(hpPerSecond * seconds));
};

export const processRev = (state: GameState, tierMultiplier: number, gearMultiplier: number) => {
  // This is a placeholder - the actual rev logic is handled client-side
  // Server just needs to calculate the HP income from a rev action
  const income = calculateRevIncome(state, tierMultiplier, gearMultiplier);
  return income;
};
