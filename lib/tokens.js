import { prisma } from '../api/lib/prisma.js'

// Token costs for each tool
export const TOKEN_COSTS = {
  performance: 3,
  build: 2,
  image: 5,
  community: 0  // Free to encourage sharing
}

// Plan token allocations (monthly)
export const PLAN_TOKENS = {
  ANONYMOUS: 10,
  FREE: 30,
  PLUS: 100,
  PRO: 250,
  ULTRA: 500,
  ADMIN: Infinity
}

// Token carryover rules
export const CARRYOVER_RULES = {
  ANONYMOUS: { enabled: false, maxPercent: 0 },
  FREE: { enabled: false, maxPercent: 0 }, // No carryover - resets to 30 each month
  PLUS: { enabled: true, maxPercent: 50, cap: 2.0 },
  PRO: { enabled: true, maxPercent: 50, cap: 2.0 },
  ULTRA: { enabled: true, maxPercent: 50, cap: 2.0 },
  ADMIN: { enabled: false, maxPercent: 0 }
}

/**
 * Check if user has enough tokens for an action
 */
export async function hasEnoughTokens(email, toolType, fingerprint) {
  const cost = TOKEN_COSTS[toolType]

  if (cost === undefined) {
    throw new Error(`Invalid tool type: ${toolType}`)
  }

  // Handle anonymous users
  if (!email) {
    if (!fingerprint) {
      return {
        allowed: false,
        error: 'Authentication or device fingerprint required',
        message: 'Please provide a valid device fingerprint or sign in to continue.'
      }
    }

    try {
      let anonUser = await prisma.anonymousUser.findUnique({
        where: { fingerprint }
      })

      if (!anonUser) {
        // Create new anonymous user
        anonUser = await prisma.anonymousUser.create({
          data: {
            fingerprint,
            tokens: PLAN_TOKENS.ANONYMOUS,
            communityUsed: 0,
            resetDate: new Date()
          }
        })
        console.log(`Created new anonymous user with ${PLAN_TOKENS.ANONYMOUS} tokens`)
      }

      // Check for monthly reset
      const now = new Date()
      const daysSinceReset = Math.floor((now - anonUser.resetDate) / (1000 * 60 * 60 * 24))

      if (daysSinceReset >= 30) {
        anonUser = await prisma.anonymousUser.update({
          where: { fingerprint },
          data: {
            tokens: PLAN_TOKENS.ANONYMOUS,
            communityUsed: 0,
            resetDate: now
          }
        })
        console.log(`Reset anonymous user tokens to ${PLAN_TOKENS.ANONYMOUS}`)
      }

      // Check if enough tokens
      if (anonUser.tokens < cost) {
        return {
          allowed: false,
          tokens: anonUser.tokens,
          cost,
          message: `Insufficient tokens. You need ${cost} tokens but only have ${anonUser.tokens}. Sign in to get more.`
        }
      }

      return {
        allowed: true,
        tokens: anonUser.tokens,
        cost
      }

    } catch (error) {
      console.error('Anonymous token check error:', error)
      return {
        allowed: false,
        error: 'Failed to check tokens. Please try again or sign in.'
      }
    }
  }

  // Handle authenticated users
  try {
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Create new user with FREE plan
      user = await prisma.user.create({
        data: {
          email,
          planCode: 'FREE',
          tokens: PLAN_TOKENS.FREE,
          communityUsed: 0
        }
      })
      console.log(`Created new user ${email} with ${PLAN_TOKENS.FREE} tokens`)
    }

    // Check for monthly reset
    const now = new Date()
    const daysSinceReset = Math.floor((now - user.resetDate) / (1000 * 60 * 60 * 24))

    if (daysSinceReset >= 30) {
      const newTokens = calculateMonthlyRefill(user.planCode, user.tokens)
      user = await prisma.user.update({
        where: { email },
        data: {
          tokens: newTokens,
          communityUsed: 0,
          resetDate: now
        }
      })
      console.log(`Reset user ${email} tokens to ${newTokens} (with carryover)`)
    }

    // Admin gets unlimited tokens
    if (user.planCode === 'ADMIN') {
      return {
        allowed: true,
        tokens: Infinity,
        cost
      }
    }

    // Check if enough tokens
    if (user.tokens < cost) {
      return {
        allowed: false,
        plan: user.planCode,
        tokens: user.tokens,
        cost,
        message: `Insufficient tokens. You need ${cost} tokens but only have ${user.tokens}. Upgrade to get more.`
      }
    }

    return {
      allowed: true,
      plan: user.planCode,
      tokens: user.tokens,
      cost
    }

  } catch (error) {
    console.error('Token check error:', error)
    // On error, deny the request for security
    return {
      allowed: false,
      error: 'Failed to check tokens. Please try again.'
    }
  }
}

/**
 * Deduct tokens from user after successful action
 */
export async function deductTokens(email, toolType, fingerprint) {
  const cost = TOKEN_COSTS[toolType]

  if (cost === undefined) {
    throw new Error(`Invalid tool type: ${toolType}`)
  }

  // Handle anonymous users
  if (!email) {
    if (!fingerprint) {
      console.log('deductTokens: No email or fingerprint provided, skipping')
      return
    }

    try {
      const result = await prisma.anonymousUser.update({
        where: { fingerprint },
        data: {
          tokens: { decrement: cost }
        }
      })
      console.log(`Deducted ${cost} tokens from anonymous user. Remaining: ${result.tokens}`)
      return result.tokens
    } catch (error) {
      console.error('Anonymous token deduction error:', error)
    }
    return
  }

  // Handle authenticated users
  try {
    const result = await prisma.user.update({
      where: { email },
      data: {
        tokens: { decrement: cost }
      }
    })
    console.log(`Deducted ${cost} tokens from ${email}. Remaining: ${result.tokens}`)
    return result.tokens
  } catch (error) {
    console.error('Token deduction error:', error)
  }
}

/**
 * Calculate token amount for monthly refill with carryover
 */
export function calculateMonthlyRefill(planCode, currentTokens) {
  const planAllocation = PLAN_TOKENS[planCode] || PLAN_TOKENS.FREE
  const carryoverRule = CARRYOVER_RULES[planCode] || CARRYOVER_RULES.FREE

  // Handle null/undefined/NaN current tokens - treat as 0
  const safeCurrentTokens = (currentTokens != null && !isNaN(currentTokens)) ? currentTokens : 0

  // Admin or no carryover - just return plan allocation
  if (!carryoverRule.enabled || planAllocation === Infinity) {
    return planAllocation
  }

  // Calculate carryover amount (50% of remaining tokens)
  const carryoverTokens = Math.floor(safeCurrentTokens * (carryoverRule.maxPercent / 100))

  // Calculate new total
  const newTotal = planAllocation + carryoverTokens

  // Cap at maximum (200% of plan allocation)
  const maxTokens = Math.floor(planAllocation * carryoverRule.cap)

  return Math.min(newTotal, maxTokens)
}

/**
 * Set user's tokens based on their plan (used by Stripe webhooks)
 */
export async function setTokensForPlan(email, planCode) {
  const tokens = PLAN_TOKENS[planCode] || PLAN_TOKENS.FREE

  try {
    const user = await prisma.user.update({
      where: { email },
      data: {
        tokens,
        planCode,
        resetDate: new Date()
      }
    })
    console.log(`Set ${email} to ${planCode} plan with ${tokens} tokens`)
    return user
  } catch (error) {
    console.error('Error setting tokens for plan:', error)
    throw error
  }
}

/**
 * Get user's current token balance
 */
export async function getTokenBalance(email, fingerprint) {
  if (!email && !fingerprint) {
    return { tokens: 0, plan: 'ANONYMOUS' }
  }

  try {
    if (!email) {
      const anonUser = await prisma.anonymousUser.findUnique({
        where: { fingerprint }
      })
      return {
        tokens: anonUser?.tokens || 0,
        plan: 'ANONYMOUS'
      }
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    return {
      tokens: user?.tokens || 0,
      plan: user?.planCode || 'FREE'
    }
  } catch (error) {
    console.error('Error getting token balance:', error)
    return { tokens: 0, plan: 'FREE' }
  }
}
