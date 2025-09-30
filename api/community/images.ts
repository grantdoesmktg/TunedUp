import { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { page = '1', limit = '12' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Get approved community images
    const images = await prisma.communityImage.findMany({
      where: {
        approved: true
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limitNum
    })

    // Get total count for pagination
    const totalCount = await prisma.communityImage.count({
      where: {
        approved: true
      }
    })

    const totalPages = Math.ceil(totalCount / limitNum)

    res.status(200).json({
      images: images.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        description: img.description,
        likesCount: img.likesCount,
        createdAt: img.createdAt,
        userEmail: img.user.email.replace(/(.{2}).*@/, '$1***@') // Partially hide email
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    })

  } catch (error) {
    console.error('Get community images error:', error)
    res.status(500).json({
      error: 'Failed to fetch community images'
    })
  }
}