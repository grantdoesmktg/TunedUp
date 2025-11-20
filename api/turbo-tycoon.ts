/**
 * Turbo Tycoon Game API Endpoint
 * Handles all game actions: load, rev, buy_part, buy_manual_upgrade, prestige, convert_hp_to_tokens
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma.js';
import { getToken } from './lib/auth.js';
import {
  CONFIG,
  CAR_TIERS,
  PARTS_LIST,
  TOKEN_PACKAGES,
  DAILY_TOKEN_CAP,
  ACHIEVEMENTS,
  MAX_OFFLINE_TIME_MS,
  MIN_OFFLINE_TIME_MS,
  MAX_TIME_JUMP_MS,
  FREE_USER_MAX_TOKEN_PACKAGE_SIZE,
  CarTierType,
} from '../lib/turboTycoon/gameConfig';
import {
  processRev,
  calculatePassiveIncome,
  calculatePartCost,
  getManualUpgradeCost,
  canPrestige,
  calculateOfflineEarnings,
} from '../lib/turboTycoon/gameLogic';
import { GameState } from '../lib/turboTycoon/types';

// ============================
// Authentication Helper
// ============================

async function authenticateUser(req: VercelRequest): Promise<string> {
  const payload = await getToken(req);
  if (!payload || !payload.email) {
    throw new Error('Unauthorized');
  }
  return payload.email as string;
}

// ============================
// Database Operations
// ============================

async function loadGameState(userEmail: string): Promise<GameState> {
  // Load or create game state
  let dbState = await prisma.turboTycoonState.findUnique({
    where: { userEmail },
  });

  if (!dbState) {
    // Create initial state
    dbState = await prisma.turboTycoonState.create({
      data: {
        userEmail,
        totalHp: 0n,
        lifetimeHpEarned: 0n,
        currentTier: 0,
        currentRpm: 0,
        currentGear: 1,
        lastClickTime: BigInt(Date.now()),
        throttleLevel: 0,
        ecuLevel: 0,
        tokensEarnedToday: 0,
        lastTokenResetDate: new Date().toISOString().split('T')[0],
        achievements: '[]',
        redzoneStartTime: null,
      },
    });
  }

  // Load parts
  const parts = await prisma.turboPartProgress.findMany({
    where: { userEmail },
  });

  const partsRecord: Record<string, number> = {};
  parts.forEach((p) => {
    partsRecord[p.partId] = p.level;
  });

  // Get user tokens from User table
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { tokens: true },
  });

  return {
    totalHp: dbState.totalHp,
    lifetimeHpEarned: dbState.lifetimeHpEarned,
    currentTier: dbState.currentTier as CarTierType,
    currentRpm: dbState.currentRpm,
    currentGear: dbState.currentGear,
    lastClickTime: Number(dbState.lastClickTime),
    throttleLevel: dbState.throttleLevel,
    ecuLevel: dbState.ecuLevel,
    parts: partsRecord,
    tokens: user?.tokens || 0,
    tokensEarnedToday: dbState.tokensEarnedToday,
    lastTokenDate: dbState.lastTokenResetDate,
    achievements: JSON.parse(dbState.achievements),
    redzoneStartTime: dbState.redzoneStartTime ? Number(dbState.redzoneStartTime) : null,
  };
}

async function saveGameState(userEmail: string, state: GameState): Promise<void> {
  // Update main state
  await prisma.turboTycoonState.update({
    where: { userEmail },
    data: {
      totalHp: state.totalHp,
      lifetimeHpEarned: state.lifetimeHpEarned,
      currentTier: state.currentTier,
      currentRpm: state.currentRpm,
      currentGear: state.currentGear,
      lastClickTime: BigInt(state.lastClickTime),
      throttleLevel: state.throttleLevel,
      ecuLevel: state.ecuLevel,
      tokensEarnedToday: state.tokensEarnedToday,
      lastTokenResetDate: state.lastTokenDate,
      achievements: JSON.stringify(state.achievements),
      redzoneStartTime: state.redzoneStartTime ? BigInt(state.redzoneStartTime) : null,
      lastUpdatedAt: new Date(),
    },
  });

  // Update parts (upsert each one)
  const partPromises = Object.entries(state.parts).map(([partId, level]) =>
    prisma.turboPartProgress.upsert({
      where: {
        userEmail_partId: {
          userEmail,
          partId,
        },
      },
      create: {
        userEmail,
        partId,
        level,
      },
      update: {
        level,
      },
    })
  );

  await Promise.all(partPromises);
}

// ============================
// Action Handlers
// ============================

async function handleLoad(userEmail: string, res: VercelResponse) {
  const state = await loadGameState(userEmail);

  // Calculate offline earnings with anti-cheat
  const now = Date.now();
  const timeSinceLastClick = now - state.lastClickTime;

  let offlineEarnings = 0n;
  let offlineTime = '';

  // Anti-cheat: Detect time manipulation
  // If user goes back in time (negative diff), reset to server time
  if (timeSinceLastClick < 0) {
    console.warn(`[ANTI-CHEAT] User ${userEmail} has negative time diff: ${timeSinceLastClick}ms. Resetting to server time.`);
    state.lastClickTime = now;
    await saveGameState(userEmail, state);
  }
  // Anti-cheat: If time jump is suspiciously large (>6 hours but user claims more), cap it
  else if (timeSinceLastClick > MIN_OFFLINE_TIME_MS) {
    const validDiffMs = Math.min(timeSinceLastClick, MAX_OFFLINE_TIME_MS);

    // Additional check: If diff is way too large (e.g., years), it's suspicious
    const MAX_REASONABLE_TIME = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (timeSinceLastClick > MAX_REASONABLE_TIME) {
      console.warn(`[ANTI-CHEAT] User ${userEmail} has unreasonable time diff: ${timeSinceLastClick}ms (${Math.floor(timeSinceLastClick / 86400000)} days). Capping to max offline time.`);
    }

    offlineEarnings = calculateOfflineEarnings(state, validDiffMs, MAX_OFFLINE_TIME_MS);

    if (offlineEarnings > 0n) {
      const hrs = Math.floor(validDiffMs / 3600000);
      const mins = Math.floor((validDiffMs % 3600000) / 60000);
      offlineTime = `${hrs > 0 ? `${hrs}h ` : ''}${mins}m`;

      // Award offline earnings
      state.totalHp += offlineEarnings;
      state.lifetimeHpEarned += offlineEarnings;
      state.lastClickTime = now;
      await saveGameState(userEmail, state);
    }
  }

  // Check for new achievements
  const hpPerSecond = calculatePassiveIncome(state);
  const newAchievements: string[] = [];
  const achievementRewards: Array<{ id: string; title: string; tokens: number }> = [];

  ACHIEVEMENTS.forEach((ach) => {
    if (!state.achievements.includes(ach.id)) {
      if (ach.condition(state, hpPerSecond)) {
        newAchievements.push(ach.id);
        achievementRewards.push({
          id: ach.id,
          title: ach.title,
          tokens: ach.rewardTokens,
        });
      }
    }
  });

  if (newAchievements.length > 0) {
    state.achievements.push(...newAchievements);
    const totalTokens = achievementRewards.reduce((sum, a) => sum + a.tokens, 0);

    // Award tokens to user
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        tokens: { increment: totalTokens },
      },
    });

    state.tokens += totalTokens;
    await saveGameState(userEmail, state);
  }

  res.status(200).json({
    success: true,
    state,
    offlineEarnings: offlineEarnings.toString(),
    offlineTime,
    newAchievements: achievementRewards,
  });
}

async function handleRev(userEmail: string, res: VercelResponse) {
  const state = await loadGameState(userEmail);

  // Process the rev
  const revResult = processRev(state);

  // Update state
  state.totalHp += revResult.hpEarned;
  state.lifetimeHpEarned += revResult.hpEarned;
  state.currentRpm = revResult.newRpm;
  state.currentGear = revResult.newGear;
  state.redzoneStartTime = revResult.redzoneStartTime;
  state.lastClickTime = Date.now();

  await saveGameState(userEmail, state);

  res.status(200).json({
    success: true,
    state,
    revResult: {
      hpEarned: revResult.hpEarned.toString(),
      isPerfectShift: revResult.isPerfectShift,
      isShift: revResult.isShift,
    },
  });
}

async function handleBuyPart(
  userEmail: string,
  partId: string,
  res: VercelResponse
) {
  const state = await loadGameState(userEmail);
  const part = PARTS_LIST.find((p) => p.id === partId);

  if (!part) {
    return res.status(400).json({ success: false, error: 'Invalid part ID' });
  }

  const currentLevel = state.parts[part.id] || 0;
  const cost = calculatePartCost(part.baseCost, part.costScaling, currentLevel);

  if (state.totalHp < cost) {
    return res.status(400).json({ success: false, error: 'Insufficient HP' });
  }

  // Deduct cost and upgrade
  state.totalHp -= cost;
  state.parts[part.id] = currentLevel + 1;

  await saveGameState(userEmail, state);

  res.status(200).json({
    success: true,
    state,
  });
}

async function handleBuyManualUpgrade(
  userEmail: string,
  upgradeType: 'throttle' | 'ecu',
  res: VercelResponse
) {
  const state = await loadGameState(userEmail);

  const level =
    upgradeType === 'throttle' ? state.throttleLevel : state.ecuLevel;
  const cost = getManualUpgradeCost(level);

  if (state.totalHp < cost) {
    return res.status(400).json({ success: false, error: 'Insufficient HP' });
  }

  // Deduct cost and upgrade
  state.totalHp -= cost;

  if (upgradeType === 'throttle') {
    state.throttleLevel += 1;
  } else {
    state.ecuLevel += 1;
  }

  await saveGameState(userEmail, state);

  res.status(200).json({
    success: true,
    state,
  });
}

async function handlePrestige(userEmail: string, res: VercelResponse) {
  const state = await loadGameState(userEmail);

  if (!canPrestige(state)) {
    return res
      .status(400)
      .json({ success: false, error: 'Cannot prestige yet' });
  }

  const nextTierIdx = state.currentTier + 1;

  // Reset everything except lifetime stats and achievements
  state.totalHp = 0n;
  state.currentTier = nextTierIdx as CarTierType;
  state.currentRpm = 0;
  state.currentGear = 1;
  state.throttleLevel = 0;
  state.ecuLevel = 0;
  state.parts = {};
  state.redzoneStartTime = null;
  state.lastClickTime = Date.now();

  await saveGameState(userEmail, state);

  res.status(200).json({
    success: true,
    state,
  });
}

async function handleConvertHpToTokens(
  userEmail: string,
  packageId: string,
  res: VercelResponse
) {
  const state = await loadGameState(userEmail);
  const pkg = TOKEN_PACKAGES.find((p) => p.id === packageId);

  if (!pkg) {
    return res.status(400).json({ success: false, error: 'Invalid package ID' });
  }

  // Check if free user trying to buy large package (50 tokens)
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { planCode: true },
  });

  const isFreePlan = !user || user.planCode === 'FREE';

  if (isFreePlan && pkg.tokenAmount > FREE_USER_MAX_TOKEN_PACKAGE_SIZE) {
    return res.status(403).json({
      success: false,
      error: 'Free users can only purchase the 10 or 25 token packages. Upgrade to access the 50 token package!',
      requiresUpgrade: true,
    });
  }

  // Check daily cap
  const today = new Date().toISOString().split('T')[0];

  // Reset if new day
  if (state.lastTokenDate !== today) {
    state.tokensEarnedToday = 0;
    state.lastTokenDate = today;
  }

  if (state.tokensEarnedToday > 0) {
    return res.status(400).json({
      success: false,
      error: 'You can only perform one token exchange per day.',
    });
  }

  if (pkg.tokenAmount > DAILY_TOKEN_CAP) {
    return res.status(400).json({
      success: false,
      error: `This package exceeds the daily limit of ${DAILY_TOKEN_CAP}.`,
    });
  }

  if (state.totalHp < pkg.hpCost) {
    return res.status(400).json({ success: false, error: 'Insufficient HP' });
  }

  // Deduct HP
  state.totalHp -= pkg.hpCost;
  state.tokensEarnedToday += pkg.tokenAmount;

  // Award tokens to user in User table
  await prisma.user.update({
    where: { email: userEmail },
    data: {
      tokens: { increment: pkg.tokenAmount },
    },
  });

  // Log the conversion
  await prisma.turboTokenConversion.create({
    data: {
      userEmail,
      conversionId: pkg.id,
      hpSpent: pkg.hpCost,
      tokensEarned: pkg.tokenAmount,
      dayDate: today,
    },
  });

  state.tokens += pkg.tokenAmount;

  await saveGameState(userEmail, state);

  res.status(200).json({
    success: true,
    state,
    tokensAwarded: pkg.tokenAmount,
  });
}

async function handleSync(userEmail: string, clientState: Partial<GameState>, res: VercelResponse) {
  // This is called by the game loop to sync state changes (RPM decay, passive income, etc.)
  const state = await loadGameState(userEmail);

  // Update only the fields that the client sends
  if (clientState.currentRpm !== undefined) state.currentRpm = clientState.currentRpm;
  if (clientState.currentGear !== undefined) state.currentGear = clientState.currentGear;
  if (clientState.redzoneStartTime !== undefined) state.redzoneStartTime = clientState.redzoneStartTime;
  if (clientState.totalHp !== undefined) state.totalHp = clientState.totalHp;
  if (clientState.lifetimeHpEarned !== undefined) state.lifetimeHpEarned = clientState.lifetimeHpEarned;

  state.lastClickTime = Date.now();

  await saveGameState(userEmail, state);

  res.status(200).json({
    success: true,
    state,
  });
}

// ============================
// Main Handler
// ============================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userEmail = await authenticateUser(req);
    const { action } = req.body;

    switch (action) {
      case 'load':
        await handleLoad(userEmail, res);
        break;

      case 'rev':
        await handleRev(userEmail, res);
        break;

      case 'buy_part':
        await handleBuyPart(userEmail, req.body.partId, res);
        break;

      case 'buy_manual_upgrade':
        await handleBuyManualUpgrade(userEmail, req.body.upgradeType, res);
        break;

      case 'prestige':
        await handlePrestige(userEmail, res);
        break;

      case 'convert_hp_to_tokens':
        await handleConvertHpToTokens(userEmail, req.body.packageId, res);
        break;

      case 'sync':
        await handleSync(userEmail, req.body.state, res);
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('Turbo Tycoon API Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
