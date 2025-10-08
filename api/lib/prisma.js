import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Configure connection pool for serverless
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Gracefully shutdown Prisma Client on process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
