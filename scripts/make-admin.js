import { PrismaClient } from '@prisma/client';

const databaseUrl =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  process.env.PRISMA_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!databaseUrl) {
  throw new Error('Database connection string missing. Set POSTGRES_PRISMA_URL or DATABASE_URL.');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function makeAdmin(email) {
  try {
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        planCode: 'ADMIN',
        perfUsed: 0,
        buildUsed: 0,
        imageUsed: 0,
        extraCredits: {},
        resetDate: new Date()
      },
      update: {
        planCode: 'ADMIN'
      }
    });

    console.log(`✅ ${email} is now an admin!`);
    console.log('User details:', {
      email: user.email,
      planCode: user.planCode,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('❌ Error making user admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address: node make-admin.js user@example.com');
  process.exit(1);
}

makeAdmin(email);
