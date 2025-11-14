// Turbo Tycoon Game API - Single consolidated endpoint
// Handles: load game, sync production, tap, unlock/upgrade factories, buy research, convert HP to tokens

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { getToken } from './lib/auth.js';
import {
  FACTORIES,
  RESEARCH_NODES,
  TOKEN_CONVERSIONS,
  FactoryType,
  getUpgradeCost,
  getOfflineCapHours,
  MAX_FACTORY_LEVEL,
} from '../lib/turboTycoon/gameConfig.js';
import {
  applyTimeAndTapsToFactory,
  calculateOfflineProgress,
  combineResearchEffects,
  calculateHpPerMinute,
  calculateHpPerPart,
  FactoryState,
} from '../lib/turboTycoon/gameLogic.js';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getToken(req);
    const userEmail = token?.email as string || null;

    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { action, ...params } = req.body;

    switch (action) {
      case 'load':
        return await handleLoad(userEmail, res);
      case 'sync':
        return await handleSync(userEmail, params, res);
      case 'tap':
        return await handleTap(userEmail, params, res);
      case 'unlock_factory':
        return await handleUnlockFactory(userEmail, params, res);
      case 'upgrade_factory':
        return await handleUpgradeFactory(userEmail, params, res);
      case 'buy_research':
        return await handleBuyResearch(userEmail, params, res);
      case 'convert_hp_to_tokens':
        return await handleConvertHpToTokens(userEmail, params, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('Turbo Tycoon API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// LOAD: Initialize or load existing game state
async function handleLoad(userEmail: string, res: VercelResponse) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      turboTycoonState: true,
      turboFactoryProgresses: true,
      turboResearchOwnership: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Initialize game state if it doesn't exist
  let gameState = user.turboTycoonState;
  if (!gameState) {
    gameState = await prisma.turboTycoonState.create({
      data: {
        userEmail: user.email,
        totalHp: 0n,
        lifetimeHpEarned: 0n,
        lifetimePartsMade: 0n,
        lastUpdatedAt: new Date(),
      },
    });
  }

  // Initialize factory progresses if they don't exist
  let factories = user.turboFactoryProgresses;
  if (factories.length === 0) {
    const factoryTypes: FactoryType[] = ['COMPRESSOR', 'TURBO_ASSEMBLY', 'ECU_FLASH'];
    for (const type of factoryTypes) {
      const config = FACTORIES[type];
      await prisma.turboFactoryProgress.create({
        data: {
          userEmail: user.email,
          factoryType: type,
          isUnlocked: config.defaultUnlocked,
          level: 1,
          totalPartsProduced: 0n,
          currentCycleRemainingSeconds: config.baseProductionTimeSeconds,
        },
      });
    }
    // Reload factories
    factories = await prisma.turboFactoryProgress.findMany({
      where: { userEmail: user.email },
    });
  }

  // Get research effects
  const ownedResearch = user.turboResearchOwnership.map((r) => {
    const node = RESEARCH_NODES.find((n) => n.id === r.researchKey);
    return node?.effect || {};
  });
  const researchEffects = combineResearchEffects(ownedResearch);

  // Calculate offline progress
  const offlineCapHours = getOfflineCapHours(researchEffects.offlineCapHoursBonus || 0);
  const factoryStates: FactoryState[] = factories.map((f) => ({
    factoryType: f.factoryType as FactoryType,
    isUnlocked: f.isUnlocked,
    level: f.level,
    totalPartsProduced: f.totalPartsProduced,
    currentCycleRemainingSeconds: f.currentCycleRemainingSeconds,
  }));

  const offlineResult = calculateOfflineProgress(
    gameState.lastUpdatedAt,
    new Date(),
    factoryStates,
    researchEffects,
    user.planCode as any,
    offlineCapHours
  );

  // Update game state with offline progress
  const newTotalHp = gameState.totalHp + offlineResult.totalHpGained;
  const newLifetimeHp = gameState.lifetimeHpEarned + offlineResult.totalHpGained;
  const newLifetimeParts = gameState.lifetimePartsMade + offlineResult.totalPartsProduced;

  await prisma.turboTycoonState.update({
    where: { userEmail: user.email },
    data: {
      totalHp: newTotalHp,
      lifetimeHpEarned: newLifetimeHp,
      lifetimePartsMade: newLifetimeParts,
      lastUpdatedAt: new Date(),
    },
  });

  // Update factories
  for (let i = 0; i < offlineResult.updatedFactories.length; i++) {
    const updated = offlineResult.updatedFactories[i];
    await prisma.turboFactoryProgress.update({
      where: {
        userEmail_factoryType: {
          userEmail: user.email,
          factoryType: updated.factoryType,
        },
      },
      data: {
        currentCycleRemainingSeconds: updated.currentCycleRemainingSeconds,
        totalPartsProduced: updated.totalPartsProduced,
      },
    });
  }

  // Prepare response
  const response = {
    totalHp: newTotalHp.toString(),
    lifetimeHpEarned: newLifetimeHp.toString(),
    lifetimePartsMade: newLifetimeParts.toString(),
    offlineHpGained: offlineResult.totalHpGained.toString(),
    offlinePartsProduced: offlineResult.totalPartsProduced.toString(),
    offlineTimeSeconds: offlineResult.effectiveElapsedSeconds,
    factories: offlineResult.updatedFactories.map((f) => ({
      type: f.factoryType,
      isUnlocked: f.isUnlocked,
      level: f.level,
      totalPartsProduced: f.totalPartsProduced.toString(),
      currentCycleRemainingSeconds: f.currentCycleRemainingSeconds,
      hpPerPart: calculateHpPerPart(f.factoryType, f.level, researchEffects),
      hpPerMinute: calculateHpPerMinute(f.factoryType, f.level, researchEffects),
    })),
    ownedResearch: user.turboResearchOwnership.map((r) => r.researchKey),
    planCode: user.planCode,
  };

  return res.status(200).json(response);
}

// SYNC: Periodic sync for production updates (called from client interval)
async function handleSync(userEmail: string, params: any, res: VercelResponse) {
  // Similar to load but doesn't return full state, just incremental updates
  return handleLoad(userEmail, res);
}

// TAP: Apply tap to a factory
async function handleTap(userEmail: string, params: any, res: VercelResponse) {
  const { factoryType, taps = 1 } = params;

  if (!factoryType || !['COMPRESSOR', 'TURBO_ASSEMBLY', 'ECU_FLASH'].includes(factoryType)) {
    return res.status(400).json({ error: 'Invalid factory type' });
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      turboTycoonState: true,
      turboFactoryProgresses: true,
      turboResearchOwnership: true,
    },
  });

  if (!user || !user.turboTycoonState) {
    return res.status(404).json({ error: 'Game state not found' });
  }

  const factory = user.turboFactoryProgresses.find((f) => f.factoryType === factoryType);
  if (!factory || !factory.isUnlocked) {
    return res.status(400).json({ error: 'Factory not unlocked' });
  }

  // Get research effects
  const ownedResearch = user.turboResearchOwnership.map((r) => {
    const node = RESEARCH_NODES.find((n) => n.id === r.researchKey);
    return node?.effect || {};
  });
  const researchEffects = combineResearchEffects(ownedResearch);

  // Calculate time since last update
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - user.turboTycoonState.lastUpdatedAt.getTime()) / 1000);

  // Apply taps and elapsed time
  const factoryState: FactoryState = {
    factoryType: factory.factoryType as FactoryType,
    isUnlocked: factory.isUnlocked,
    level: factory.level,
    totalPartsProduced: factory.totalPartsProduced,
    currentCycleRemainingSeconds: factory.currentCycleRemainingSeconds,
  };

  const result = applyTimeAndTapsToFactory(
    factoryState,
    elapsed,
    taps,
    researchEffects,
    user.planCode as any
  );

  // Update game state
  const newTotalHp = user.turboTycoonState.totalHp + result.hpGained;
  const newLifetimeHp = user.turboTycoonState.lifetimeHpEarned + result.hpGained;
  const newLifetimeParts = user.turboTycoonState.lifetimePartsMade + result.partsProduced;

  await prisma.turboTycoonState.update({
    where: { userEmail: user.email },
    data: {
      totalHp: newTotalHp,
      lifetimeHpEarned: newLifetimeHp,
      lifetimePartsMade: newLifetimeParts,
      lastUpdatedAt: now,
    },
  });

  await prisma.turboFactoryProgress.update({
    where: {
      userEmail_factoryType: {
        userEmail: user.email,
        factoryType: factoryType,
      },
    },
    data: {
      currentCycleRemainingSeconds: result.updatedRemainingSeconds,
      totalPartsProduced: factory.totalPartsProduced + result.partsProduced,
    },
  });

  return res.status(200).json({
    totalHp: newTotalHp.toString(),
    hpGained: result.hpGained.toString(),
    partsProduced: result.partsProduced.toString(),
    currentCycleRemainingSeconds: result.updatedRemainingSeconds,
    doubleProductTriggered: result.doubleProductTriggered,
  });
}

// UNLOCK_FACTORY: Unlock a factory
async function handleUnlockFactory(userEmail: string, params: any, res: VercelResponse) {
  const { factoryType } = params;

  if (!factoryType || !['COMPRESSOR', 'TURBO_ASSEMBLY', 'ECU_FLASH'].includes(factoryType)) {
    return res.status(400).json({ error: 'Invalid factory type' });
  }

  const config = FACTORIES[factoryType as FactoryType];
  if (config.defaultUnlocked) {
    return res.status(400).json({ error: 'Factory already unlocked by default' });
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      turboTycoonState: true,
      turboFactoryProgresses: true,
    },
  });

  if (!user || !user.turboTycoonState) {
    return res.status(404).json({ error: 'Game state not found' });
  }

  // Check if user has enough HP
  if (user.turboTycoonState.totalHp < config.unlockCostHp) {
    return res.status(400).json({ error: 'Not enough HP' });
  }

  const factory = user.turboFactoryProgresses.find((f) => f.factoryType === factoryType);
  if (!factory) {
    return res.status(404).json({ error: 'Factory not found' });
  }

  if (factory.isUnlocked) {
    return res.status(400).json({ error: 'Factory already unlocked' });
  }

  // Deduct HP and unlock
  const newTotalHp = user.turboTycoonState.totalHp - config.unlockCostHp;

  await prisma.turboTycoonState.update({
    where: { userEmail: user.email },
    data: { totalHp: newTotalHp },
  });

  await prisma.turboFactoryProgress.update({
    where: {
      userEmail_factoryType: {
        userEmail: user.email,
        factoryType: factoryType,
      },
    },
    data: {
      isUnlocked: true,
      currentCycleRemainingSeconds: config.baseProductionTimeSeconds,
    },
  });

  return res.status(200).json({
    success: true,
    totalHp: newTotalHp.toString(),
  });
}

// UPGRADE_FACTORY: Upgrade a factory level
async function handleUpgradeFactory(userEmail: string, params: any, res: VercelResponse) {
  const { factoryType } = params;

  if (!factoryType || !['COMPRESSOR', 'TURBO_ASSEMBLY', 'ECU_FLASH'].includes(factoryType)) {
    return res.status(400).json({ error: 'Invalid factory type' });
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      turboTycoonState: true,
      turboFactoryProgresses: true,
      turboResearchOwnership: true,
    },
  });

  if (!user || !user.turboTycoonState) {
    return res.status(404).json({ error: 'Game state not found' });
  }

  const factory = user.turboFactoryProgresses.find((f) => f.factoryType === factoryType);
  if (!factory || !factory.isUnlocked) {
    return res.status(400).json({ error: 'Factory not unlocked' });
  }

  // Check if factory is already at max level
  if (factory.level >= MAX_FACTORY_LEVEL) {
    return res.status(400).json({ error: 'Factory already at max level' });
  }

  // Get research effects for cost calculation
  const ownedResearch = user.turboResearchOwnership.map((r) => {
    const node = RESEARCH_NODES.find((n) => n.id === r.researchKey);
    return node?.effect || {};
  });
  const researchEffects = combineResearchEffects(ownedResearch);

  const upgradeCost = getUpgradeCost(factoryType as FactoryType, factory.level, {
    upgradeCostMultiplier: researchEffects.upgradeCostMultiplier,
  });

  if (user.turboTycoonState.totalHp < upgradeCost) {
    return res.status(400).json({ error: 'Not enough HP' });
  }

  // Deduct HP and upgrade
  const newTotalHp = user.turboTycoonState.totalHp - upgradeCost;

  await prisma.turboTycoonState.update({
    where: { userEmail: user.email },
    data: { totalHp: newTotalHp },
  });

  await prisma.turboFactoryProgress.update({
    where: {
      userEmail_factoryType: {
        userEmail: user.email,
        factoryType: factoryType,
      },
    },
    data: {
      level: factory.level + 1,
    },
  });

  return res.status(200).json({
    success: true,
    totalHp: newTotalHp.toString(),
    newLevel: factory.level + 1,
  });
}

// BUY_RESEARCH: Purchase a research node (paid users only)
async function handleBuyResearch(userEmail: string, params: any, res: VercelResponse) {
  const { researchKey } = params;

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      turboTycoonState: true,
      turboResearchOwnership: true,
    },
  });

  if (!user || !user.turboTycoonState) {
    return res.status(404).json({ error: 'Game state not found' });
  }

  // Check if user has paid plan
  if (!['PLUS', 'PRO', 'ULTRA', 'ADMIN'].includes(user.planCode)) {
    return res.status(403).json({ error: 'Research tree requires a paid plan' });
  }

  const node = RESEARCH_NODES.find((n) => n.id === researchKey);
  if (!node) {
    return res.status(400).json({ error: 'Invalid research node' });
  }

  // Check if already owned
  const alreadyOwned = user.turboResearchOwnership.find((r) => r.researchKey === researchKey);
  if (alreadyOwned) {
    return res.status(400).json({ error: 'Research already owned' });
  }

  // Check prerequisites
  for (const requiredKey of node.requires) {
    const hasRequired = user.turboResearchOwnership.find((r) => r.researchKey === requiredKey);
    if (!hasRequired) {
      return res.status(400).json({ error: 'Missing prerequisite research' });
    }
  }

  // Check if user has enough HP
  if (user.turboTycoonState.totalHp < node.costHp) {
    return res.status(400).json({ error: 'Not enough HP' });
  }

  // Deduct HP and grant research
  const newTotalHp = user.turboTycoonState.totalHp - node.costHp;

  await prisma.turboTycoonState.update({
    where: { userEmail: user.email },
    data: { totalHp: newTotalHp },
  });

  await prisma.turboResearchOwnership.create({
    data: {
      userEmail: user.email,
      researchKey: researchKey,
    },
  });

  return res.status(200).json({
    success: true,
    totalHp: newTotalHp.toString(),
  });
}

// CONVERT_HP_TO_TOKENS: Convert HP to TunedUp tokens
async function handleConvertHpToTokens(userEmail: string, params: any, res: VercelResponse) {
  const { conversionId } = params;

  const conversion = TOKEN_CONVERSIONS.find((c) => c.id === conversionId);
  if (!conversion) {
    return res.status(400).json({ error: 'Invalid conversion' });
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      turboTycoonState: true,
    },
  });

  if (!user || !user.turboTycoonState) {
    return res.status(404).json({ error: 'Game state not found' });
  }

  // Check if user has enough HP
  if (user.turboTycoonState.totalHp < conversion.hpCost) {
    return res.status(400).json({ error: 'Not enough HP' });
  }

  // Deduct HP and add tokens
  const newTotalHp = user.turboTycoonState.totalHp - conversion.hpCost;
  const newTokens = user.tokens + conversion.tokensReward;

  await prisma.turboTycoonState.update({
    where: { userEmail: user.email },
    data: { totalHp: newTotalHp },
  });

  await prisma.user.update({
    where: { email: user.email },
    data: { tokens: newTokens },
  });

  return res.status(200).json({
    success: true,
    totalHp: newTotalHp.toString(),
    newTokens: newTokens,
    tokensAdded: conversion.tokensReward,
  });
}
