// Script to migrate users with null tokens to default values based on their plan
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PLAN_TOKENS = {
  ANONYMOUS: 10,
  FREE: 30,
  PLUS: 100,
  PRO: 250,
  ULTRA: 500,
  ADMIN: 999999
}

async function main() {
  console.log('🔍 Finding users with null tokens...')

  const usersWithNullTokens = await prisma.user.findMany({
    where: {
      tokens: null
    },
    select: {
      id: true,
      email: true,
      planCode: true,
      tokens: true
    }
  })

  console.log(`Found ${usersWithNullTokens.length} users with null tokens`)

  if (usersWithNullTokens.length === 0) {
    console.log('✅ All users already have tokens set!')
    return
  }

  console.log('\n📝 Updating users...')

  for (const user of usersWithNullTokens) {
    const defaultTokens = PLAN_TOKENS[user.planCode] || PLAN_TOKENS.FREE

    await prisma.user.update({
      where: { id: user.id },
      data: { tokens: defaultTokens }
    })

    console.log(`✅ ${user.email} (${user.planCode}): Set to ${defaultTokens} tokens`)
  }

  // Also check anonymous users
  const anonUsersWithNullTokens = await prisma.anonymousUser.findMany({
    where: {
      tokens: null
    }
  })

  if (anonUsersWithNullTokens.length > 0) {
    console.log(`\n🔍 Found ${anonUsersWithNullTokens.length} anonymous users with null tokens`)

    for (const anonUser of anonUsersWithNullTokens) {
      await prisma.anonymousUser.update({
        where: { id: anonUser.id },
        data: { tokens: PLAN_TOKENS.ANONYMOUS }
      })
      console.log(`✅ Anonymous user ${anonUser.fingerprint}: Set to ${PLAN_TOKENS.ANONYMOUS} tokens`)
    }
  }

  console.log('\n🎉 Migration complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
