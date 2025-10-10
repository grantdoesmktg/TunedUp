import { prisma } from '../api/lib/prisma.js'

/**
 * Check if a promotion is available and can be redeemed
 */
export async function checkPromotion(code) {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { code },
      include: {
        redemptions: true
      }
    })

    if (!promotion) {
      return { available: false, reason: 'Promotion not found' }
    }

    if (!promotion.active) {
      return { available: false, reason: 'Promotion is no longer active' }
    }

    if (promotion.expiresAt && new Date() > promotion.expiresAt) {
      return { available: false, reason: 'Promotion has expired' }
    }

    if (promotion.usedCount >= promotion.maxUses) {
      return { available: false, reason: 'Promotion limit reached' }
    }

    return {
      available: true,
      promotion: {
        code: promotion.code,
        planCode: promotion.planCode,
        remaining: promotion.maxUses - promotion.usedCount
      }
    }
  } catch (error) {
    console.error('Check promotion error:', error)
    return { available: false, reason: 'Error checking promotion' }
  }
}

/**
 * Redeem a promotion for a user (auto-upgrades their plan)
 */
export async function redeemPromotion(code, userEmail) {
  try {
    // Check if promotion is available
    const check = await checkPromotion(code)
    if (!check.available) {
      return { success: false, error: check.reason }
    }

    const promotion = await prisma.promotion.findUnique({
      where: { code }
    })

    // Check if user already redeemed this promotion
    const existingRedemption = await prisma.promotionRedemption.findUnique({
      where: {
        promotionId_userEmail: {
          promotionId: promotion.id,
          userEmail
        }
      }
    })

    if (existingRedemption) {
      return { success: false, error: 'You have already redeemed this promotion' }
    }

    // Atomic transaction: increment used count, create redemption, upgrade user
    const result = await prisma.$transaction(async (tx) => {
      // Increment promotion usage
      await tx.promotion.update({
        where: { id: promotion.id },
        data: { usedCount: { increment: 1 } }
      })

      // Create redemption record
      await tx.promotionRedemption.create({
        data: {
          promotionId: promotion.id,
          userEmail
        }
      })

      // Upgrade user's plan
      const updatedUser = await tx.user.update({
        where: { email: userEmail },
        data: {
          planCode: promotion.planCode,
          planRenewsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        }
      })

      return updatedUser
    })

    return {
      success: true,
      user: result,
      message: `Congratulations! You've been upgraded to ${promotion.planCode} plan!`
    }
  } catch (error) {
    console.error('Redeem promotion error:', error)
    return { success: false, error: 'Failed to redeem promotion' }
  }
}

/**
 * Create the FIRST50 promotion
 */
export async function createFirst50Promotion() {
  try {
    const existing = await prisma.promotion.findUnique({
      where: { code: 'FIRST50' }
    })

    if (existing) {
      console.log('FIRST50 promotion already exists')
      return existing
    }

    const promotion = await prisma.promotion.create({
      data: {
        code: 'FIRST50',
        planCode: 'PLUS',
        maxUses: 50,
        active: true
      }
    })

    console.log('Created FIRST50 promotion:', promotion)
    return promotion
  } catch (error) {
    console.error('Create promotion error:', error)
    throw error
  }
}

/**
 * Get promotion stats
 */
export async function getPromotionStats(code) {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { code },
      include: {
        redemptions: {
          orderBy: { redeemedAt: 'desc' }
        }
      }
    })

    if (!promotion) {
      return null
    }

    return {
      code: promotion.code,
      planCode: promotion.planCode,
      maxUses: promotion.maxUses,
      usedCount: promotion.usedCount,
      remaining: promotion.maxUses - promotion.usedCount,
      active: promotion.active,
      redemptions: promotion.redemptions
    }
  } catch (error) {
    console.error('Get promotion stats error:', error)
    return null
  }
}
