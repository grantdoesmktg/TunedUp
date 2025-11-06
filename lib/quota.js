import { redeemPromotion } from './promotions.js'
import { prisma } from '../api/lib/prisma.js'

// Plan limits
const PLAN_LIMITS = {
  FREE: { perf: 3, build: 3, image: 5, community: 5 },
  PLUS: { perf: 10, build: 10, image: 25, community: 10 },
  PRO: { perf: 15, build: 15, image: 60, community: 20 },
  ULTRA: { perf: 25, build: 25, image: 100, community: 30 },
  ADMIN: { perf: Infinity, build: Infinity, image: Infinity, community: Infinity }
}

export async function checkQuota(email, toolType, fingerprint) {
  // Handle anonymous users with fingerprint tracking
  if (!email) {
    if (!fingerprint) {
      console.log('checkQuota: No email or fingerprint provided, blocking request')
      return {
        allowed: false,
        error: 'Authentication or device fingerprint required',
        message: 'Please provide a valid device fingerprint or sign in to continue.'
      }
    }

    try {
      // Find or create anonymous user by fingerprint
      let anonUser = await prisma.anonymousUser.findUnique({
        where: { fingerprint }
      })

      if (!anonUser) {
        // Create new anonymous user with limits
        anonUser = await prisma.anonymousUser.create({
          data: {
            fingerprint,
            perfUsed: 0,
            buildUsed: 0,
            imageUsed: 0,
            communityUsed: 0,
            resetDate: new Date()
          }
        })
        console.log(`checkQuota: Created new anonymous user for fingerprint: ${fingerprint}`)
      }

      // Check if we need to reset monthly usage (30 days)
      const now = new Date()
      const daysSinceReset = Math.floor((now - anonUser.resetDate) / (1000 * 60 * 60 * 24))

      if (daysSinceReset >= 30) {
        // Reset usage for new month
        anonUser = await prisma.anonymousUser.update({
          where: { fingerprint },
          data: {
            perfUsed: 0,
            buildUsed: 0,
            imageUsed: 0,
            communityUsed: 0,
            resetDate: now
          }
        })
        console.log(`checkQuota: Reset anonymous user quota for fingerprint: ${fingerprint}`)
      }

      // Define anonymous limits (1 perf, 1 build, 3 image)
      const ANONYMOUS_LIMITS = { performance: 1, build: 1, image: 3, community: 0 }

      // Get usage and limit for the tool type
      let used, limit
      switch (toolType) {
        case 'performance':
          used = anonUser.perfUsed
          limit = ANONYMOUS_LIMITS.performance
          break
        case 'build':
          used = anonUser.buildUsed
          limit = ANONYMOUS_LIMITS.build
          break
        case 'image':
          used = anonUser.imageUsed
          limit = ANONYMOUS_LIMITS.image
          break
        case 'community':
          used = anonUser.communityUsed
          limit = ANONYMOUS_LIMITS.community
          break
        default:
          return { allowed: false, error: 'Invalid tool type' }
      }

      // Check if over limit
      if (used >= limit) {
        console.log(`checkQuota: Anonymous user ${fingerprint} exceeded ${toolType} limit (${used}/${limit})`)
        return {
          allowed: false,
          plan: 'ANONYMOUS',
          used,
          limit,
          message: `You've used ${used}/${limit} ${toolType} requests this month. Sign in to get more credits.`
        }
      }

      console.log(`checkQuota: Anonymous user ${fingerprint} allowed (${used}/${limit} ${toolType} used)`)
      return { allowed: true, used, limit }

    } catch (error) {
      console.error('Anonymous quota check error:', error)
      // On error, deny the request for security
      return {
        allowed: false,
        error: 'Failed to check quota. Please try again or sign in.',
        message: 'Unable to verify usage limits. Please sign in to continue.'
      }
    }
  }

  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Create new user with FREE plan
      user = await prisma.user.create({
        data: {
          email,
          planCode: 'FREE',
          perfUsed: 0,
          buildUsed: 0,
          imageUsed: 0,
          communityUsed: 0
        }
      })

      // Auto-apply FIRST50 promotion for new signups
      try {
        const promoResult = await redeemPromotion('FIRST50', email)
        if (promoResult.success) {
          console.log(`Auto-upgraded ${email} to PLUS plan via FIRST50 promotion`)
          // Refresh user data to get updated plan
          user = promoResult.user
        }
      } catch (error) {
        console.log(`FIRST50 promotion not available or already used for ${email}`)
      }
    }

    // Check if we need to reset monthly usage
    const now = new Date()
    const daysSinceReset = Math.floor((now - user.resetDate) / (1000 * 60 * 60 * 24))
    
    if (daysSinceReset >= 30) {
      // Reset usage for new month
      user = await prisma.user.update({
        where: { email },
        data: {
          perfUsed: 0,
          buildUsed: 0,
          imageUsed: 0,
          communityUsed: 0,
          resetDate: now
        }
      })
    }

    // Get current usage and limit
    const limits = PLAN_LIMITS[user.planCode] || PLAN_LIMITS.FREE
    let used, limit

    switch (toolType) {
      case 'performance':
        used = user.perfUsed
        limit = limits.perf
        break
      case 'build':
        used = user.buildUsed
        limit = limits.build
        break
      case 'image':
        used = user.imageUsed
        limit = limits.image
        break
      case 'community':
        used = user.communityUsed
        limit = limits.community
        break
      default:
        return { allowed: false, error: 'Invalid tool type' }
    }

    // Check if over limit
    if (used >= limit) {
      return {
        allowed: false,
        plan: user.planCode,
        used,
        limit,
        message: `You've used ${used}/${limit} ${toolType} calculations this month. Upgrade to continue.`
      }
    }

    return { allowed: true }

  } catch (error) {
    console.error('Quota check error:', error)
    // On error, allow the request (graceful degradation)
    return { allowed: true }
  }
}

export async function incrementUsage(email, toolType, fingerprint) {
  // Handle anonymous users with fingerprint tracking
  if (!email) {
    if (!fingerprint) {
      console.log('incrementUsage: No email or fingerprint provided, skipping')
      return
    }

    try {
      const updateField = toolType === 'performance' ? 'perfUsed' :
                         toolType === 'build' ? 'buildUsed' :
                         toolType === 'community' ? 'communityUsed' : 'imageUsed'

      console.log(`incrementUsage: Incrementing ${updateField} for anonymous user ${fingerprint}`)

      const result = await prisma.anonymousUser.update({
        where: { fingerprint },
        data: {
          [updateField]: { increment: 1 }
        }
      })

      console.log(`incrementUsage: Successfully updated anonymous user. New value: ${result[updateField]}`)
    } catch (error) {
      console.error('Anonymous usage increment error:', error)
      // Don't throw - this is just tracking
    }
    return
  }

  // Handle authenticated users
  try {
    const updateField = toolType === 'performance' ? 'perfUsed' :
                       toolType === 'build' ? 'buildUsed' :
                       toolType === 'community' ? 'communityUsed' : 'imageUsed'

    console.log(`incrementUsage: Incrementing ${updateField} for ${email}`)

    const result = await prisma.user.update({
      where: { email },
      data: {
        [updateField]: { increment: 1 }
      }
    })

    console.log(`incrementUsage: Successfully updated. New value: ${result[updateField]}`)
  } catch (error) {
    console.error('Usage increment error:', error)
    // Don't throw - this is just tracking
  }
}
