import { createFirst50Promotion } from '../lib/promotions.js'

async function main() {
  try {
    const promotion = await createFirst50Promotion()
    console.log('✅ FIRST50 promotion created successfully!')
    console.log('Details:', {
      code: promotion.code,
      planCode: promotion.planCode,
      maxUses: promotion.maxUses,
      usedCount: promotion.usedCount,
      active: promotion.active
    })
  } catch (error) {
    console.error('❌ Failed to create promotion:', error)
    process.exit(1)
  }
}

main()
