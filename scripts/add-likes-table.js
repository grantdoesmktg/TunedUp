// Script to add the CommunityImageLike table to production database
// Run this with: node scripts/add-likes-table.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addLikesTable() {
  try {
    console.log('Adding CommunityImageLike table...')

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "community_image_likes" (
        "id" TEXT NOT NULL,
        "imageId" TEXT NOT NULL,
        "userEmail" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "community_image_likes_pkey" PRIMARY KEY ("id")
      );
    `

    console.log('Creating unique constraint...')
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "community_image_likes_imageId_userEmail_key"
      ON "community_image_likes"("imageId", "userEmail");
    `

    console.log('Adding foreign key constraint...')
    await prisma.$executeRaw`
      ALTER TABLE "community_image_likes"
      ADD CONSTRAINT "community_image_likes_imageId_fkey"
      FOREIGN KEY ("imageId") REFERENCES "community_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `

    console.log('✅ CommunityImageLike table added successfully!')

  } catch (error) {
    console.error('❌ Error adding likes table:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addLikesTable()