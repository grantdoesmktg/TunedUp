// Script to migrate all users from old gradient backgrounds to new image backgrounds
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateBackgrounds() {
  try {
    console.log('🔄 Starting background migration...');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        backgroundTheme: true
      }
    });

    console.log(`📊 Found ${users.length} users to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if user already has new format (contains hyphen like "neutral-1")
      if (user.backgroundTheme && user.backgroundTheme.includes('-') && !user.backgroundTheme.includes('midnight') && !user.backgroundTheme.includes('carbon')) {
        console.log(`✓ ${user.email}: Already migrated (${user.backgroundTheme})`);
        skipped++;
        continue;
      }

      // Migrate to neutral-1 as default
      await prisma.user.update({
        where: { id: user.id },
        data: { backgroundTheme: 'neutral-1' }
      });

      console.log(`✅ ${user.email}: Migrated to neutral-1`);
      migrated++;
    }

    console.log('\\n📈 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated} users`);
    console.log(`   ✓  Skipped: ${skipped} users (already using new format)`);
    console.log(`   📊 Total: ${users.length} users`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateBackgrounds()
  .then(() => {
    console.log('\\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\\n💥 Migration failed:', error);
    process.exit(1);
  });
