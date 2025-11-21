import { PrismaClient } from '@prisma/client'

const databaseUrl =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  process.env.PRISMA_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING

if (!databaseUrl) {
  throw new Error(
    'Database connection string not found. Please set POSTGRES_PRISMA_URL (preferred) or DATABASE_URL/PRISMA_DATABASE_URL.'
  )
}

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

const displayUrl = (() => {
  try {
    const sanitized = databaseUrl.replace(/^prisma\+/, '')
    const parsed = new URL(sanitized)
    return `${parsed.protocol}//${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}`
  } catch {
    const parts = databaseUrl.split('@')
    return parts.length > 1 ? `postgres://${parts[1]}` : databaseUrl.slice(0, 50)
  }
})()

console.log('🔗 Prisma configured for:', displayUrl)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
