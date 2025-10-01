import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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