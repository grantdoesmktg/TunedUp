import { PrismaClient } from '@prisma/client'

// Singleton pattern for Prisma Client to prevent connection exhaustion in serverless
const prisma = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export { prisma }
