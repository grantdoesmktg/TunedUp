import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'haldennick036@gmail.com' }
    })

    console.log('User data:')
    console.log(JSON.stringify(user, null, 2))

    if (user) {
      console.log('\nUsage Summary:')
      console.log(`Plan: ${user.planCode}`)
      console.log(`Performance Used: ${user.perfUsed}`)
      console.log(`Build Used: ${user.buildUsed}`)
      console.log(`Image Used: ${user.imageUsed}`)
      console.log(`Reset Date: ${user.resetDate}`)
      console.log(`Plan Renews At: ${user.planRenewsAt}`)
    } else {
      console.log('User not found')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()