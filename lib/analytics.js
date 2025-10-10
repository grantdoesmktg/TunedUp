import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Log tool usage to database for analytics
 * @param {string} toolType - "performance", "build", or "image"
 * @param {string|null} userEmail - User email if authenticated, null if anonymous
 * @param {string|null} fingerprint - Browser fingerprint for anonymous users
 * @param {boolean} success - Whether the operation succeeded
 * @param {string|null} errorMessage - Error message if failed
 */
export async function logToolUsage(toolType, userEmail = null, fingerprint = null, success = true, errorMessage = null) {
  try {
    await prisma.toolUsage.create({
      data: {
        toolType,
        userEmail,
        fingerprint,
        success,
        errorMessage
      }
    })
  } catch (error) {
    // Don't throw - this is just tracking
    console.error('Failed to log tool usage:', error)
  }
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(days = 7) {
  try {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const usage = await prisma.toolUsage.findMany({
      where: {
        createdAt: {
          gte: since
        }
      }
    })

    const summary = {
      total: usage.length,
      byTool: {
        performance: usage.filter(u => u.toolType === 'performance').length,
        build: usage.filter(u => u.toolType === 'build').length,
        image: usage.filter(u => u.toolType === 'image').length
      },
      authenticated: usage.filter(u => u.userEmail !== null).length,
      anonymous: usage.filter(u => u.userEmail === null).length,
      uniqueUsers: new Set(usage.filter(u => u.userEmail).map(u => u.userEmail)).size,
      uniqueAnonymous: new Set(usage.filter(u => u.fingerprint).map(u => u.fingerprint)).size,
      failures: usage.filter(u => !u.success).length,
      successRate: usage.length > 0 ? ((usage.filter(u => u.success).length / usage.length) * 100).toFixed(1) : 0
    }

    return summary
  } catch (error) {
    console.error('Failed to get analytics summary:', error)
    throw error
  }
}
