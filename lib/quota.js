import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Plan limits
const PLAN_LIMITS = {
  FREE: { perf: 1, build: 1, image: 3 },
  PLUS: { perf: 10, build: 10, image: 25 },
  PRO: { perf: 15, build: 15, image: 60 },
  ULTRA: { perf: 25, build: 25, image: 100 },
  ADMIN: { perf: Infinity, build: Infinity, image: Infinity }
}

export async function checkQuota(email, toolType) {
  if (!email) {
    // Anonymous users have no limits
    return { allowed: true }
  }

  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          planCode: 'FREE',
          perfUsed: 0,
          buildUsed: 0,
          imageUsed: 0
        }
      })
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

export async function incrementUsage(email, toolType) {
  if (!email) {
    console.log('incrementUsage: No email provided, skipping')
    return
  }

  try {
    const updateField = toolType === 'performance' ? 'perfUsed' :
                       toolType === 'build' ? 'buildUsed' : 'imageUsed'

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