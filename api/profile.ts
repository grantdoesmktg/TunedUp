import { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders } from '../lib/corsConfig.js'
import { prisma } from './lib/prisma.js'
import { checkQuota } from '../lib/quota.js'
import { getToken } from './lib/auth.js'
import { moderateMultipleFields } from './lib/moderation.js'

const MAX_SAVED_IMAGES = 3

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS with restrictions
  setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Verify JWT authentication using shared helper
  try {
    const payload = await getToken(req)

    if (!payload || !payload.email) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const userEmail = payload.email as string

    const { action } = req.query

    try {
      // ==================== QUOTA ACTIONS ====================

      // Get quota information for user
      if (action === 'quota-info' && req.method === 'GET') {
        const user = await prisma.user.findUnique({
          where: { email: userEmail },
          select: {
            planCode: true,
            perfUsed: true,
            buildUsed: true,
            imageUsed: true,
            communityUsed: true,
            resetDate: true,
            planRenewsAt: true
          }
        })

        if (!user) {
          return res.status(404).json({ error: 'User not found' })
        }

        return res.status(200).json({
          planCode: user.planCode,
          usage: {
            performance: user.perfUsed,
            build: user.buildUsed,
            image: user.imageUsed,
            community: user.communityUsed
          },
          resetDate: user.resetDate,
          planRenewsAt: user.planRenewsAt
        })
      }

      // Check quota for a specific tool
      if (action === 'quota-check' && req.method === 'POST') {
        const { toolType } = req.body

        if (!toolType) {
          return res.status(400).json({ error: 'toolType is required' })
        }

        const quotaCheck = await checkQuota(userEmail, toolType)

        return res.status(200).json(quotaCheck)
      }

      // ==================== SAVED PERFORMANCE ACTIONS ====================

      // Get saved performance calculation
      if (action === 'get-performance' && req.method === 'GET') {
        const savedPerformance = await prisma.saved_performance.findUnique({
          where: { userEmail }
        })

        return res.status(200).json({
          performance: savedPerformance
        })
      }

      // Save performance calculation (replaces existing)
      if (action === 'save-performance' && req.method === 'POST') {
        const { carInput, results } = req.body

        if (!carInput || !results) {
          return res.status(400).json({ error: 'carInput and results are required' })
        }

        const savedPerformance = await prisma.saved_performance.upsert({
          where: { userEmail },
          update: {
            carInput,
            results,
            updatedAt: new Date()
          },
          create: {
            id: `perf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userEmail,
            carInput,
            results,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })

        return res.status(200).json({
          success: true,
          performance: savedPerformance
        })
      }

      // Delete saved performance calculation
      if (action === 'delete-performance' && req.method === 'DELETE') {
        const { perfId } = req.body

        if (!perfId) {
          return res.status(400).json({ error: 'perfId is required' })
        }

        await prisma.saved_performance.delete({
          where: {
            id: perfId,
            userEmail // Ensure user owns this
          }
        })

        return res.status(200).json({ success: true })
      }

      // ==================== SAVED IMAGES ACTIONS ====================

      // Get saved images
      if (action === 'get-images' && req.method === 'GET') {
        const savedImages = await prisma.saved_images.findMany({
          where: { userEmail },
          orderBy: { createdAt: 'desc' },
          take: MAX_SAVED_IMAGES
        })

        return res.status(200).json({
          images: savedImages
        })
      }

      // Save image
      if (action === 'save-image' && req.method === 'POST') {
        const { imageUrl, carSpec, prompt } = req.body

        if (!imageUrl || !carSpec || !prompt) {
          return res.status(400).json({ error: 'imageUrl, carSpec, and prompt are required' })
        }

        // Check current count
        const currentCount = await prisma.saved_images.count({
          where: { userEmail }
        })

        if (currentCount >= MAX_SAVED_IMAGES) {
          return res.status(400).json({
            error: `Maximum of ${MAX_SAVED_IMAGES} saved images reached. Delete one to save a new image.`
          })
        }

        const savedImage = await prisma.saved_images.create({
          data: {
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userEmail,
            imageUrl,
            carSpec,
            prompt,
            createdAt: new Date()
          }
        })

        return res.status(200).json({
          success: true,
          image: savedImage
        })
      }

      // Delete saved image
      if (action === 'delete-image' && req.method === 'DELETE') {
        const { imageId } = req.body

        if (!imageId) {
          return res.status(400).json({ error: 'imageId is required' })
        }

        await prisma.saved_images.delete({
          where: {
            id: imageId,
            userEmail // Ensure user owns this
          }
        })

        return res.status(200).json({ success: true })
      }

      // ==================== COMBINED PROFILE DATA ====================

      // Get all profile data in one request
      if (action === 'get-all' && req.method === 'GET') {
        const [user, savedPerformance, savedImages] = await Promise.all([
          prisma.user.findUnique({
            where: { email: userEmail },
            select: {
              planCode: true,
              perfUsed: true,
              buildUsed: true,
              imageUsed: true,
              communityUsed: true,
              resetDate: true,
              planRenewsAt: true
            }
          }),
          prisma.saved_performance.findUnique({
            where: { userEmail }
          }),
          prisma.saved_images.findMany({
            where: { userEmail },
            orderBy: { createdAt: 'desc' },
            take: MAX_SAVED_IMAGES
          })
        ])

        if (!user) {
          return res.status(404).json({ error: 'User not found' })
        }

        return res.status(200).json({
          quota: {
            planCode: user.planCode,
            usage: {
              performance: user.perfUsed,
              build: user.buildUsed,
              image: user.imageUsed,
              community: user.communityUsed
            },
            resetDate: user.resetDate,
            planRenewsAt: user.planRenewsAt
          },
          savedPerformance,
          savedImages
        })
      }

      // ==================== UPDATE PROFILE ====================

      // Update profile customization fields
      if (action === 'update-profile' && req.method === 'POST') {
        const { name, nickname, location, instagramHandle, profileIcon, backgroundTheme } = req.body

        // Moderate text fields before saving
        console.log('🛡️ Moderating profile update...')
        const fieldsToModerate: Record<string, string> = {}

        if (name && name.trim().length > 0) fieldsToModerate.name = name
        if (nickname && nickname.trim().length > 0) fieldsToModerate.nickname = nickname
        if (location && location.trim().length > 0) fieldsToModerate.location = location
        if (instagramHandle && instagramHandle.trim().length > 0) fieldsToModerate.instagramHandle = instagramHandle

        if (Object.keys(fieldsToModerate).length > 0) {
          const moderationResult = await moderateMultipleFields(fieldsToModerate)

          if (!moderationResult.passed) {
            console.log('❌ Profile content flagged:', moderationResult.failedField)
            return res.status(400).json({
              error: 'CONTENT_MODERATION_FAILED',
              field: moderationResult.failedField,
              message: moderationResult.message
            })
          }
          console.log('✅ Profile content passed moderation')
        }

        const updatedUser = await prisma.user.update({
          where: { email: userEmail },
          data: {
            name: name || null,
            nickname: nickname || null,
            location: location || null,
            instagramHandle: instagramHandle || null,
            profileIcon: profileIcon || '👤',
            backgroundTheme: backgroundTheme || 'neutral-1',
          },
          select: {
            id: true,
            email: true,
            name: true,
            nickname: true,
            location: true,
            instagramHandle: true,
            profileIcon: true,
            backgroundTheme: true,
          }
        })

        return res.status(200).json({
          success: true,
          user: updatedUser
        })
      }

      return res.status(400).json({ error: 'Invalid action' })

    } catch (error) {
      console.error('Profile API error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  } catch (authError) {
    console.error('Authentication error:', authError)
    return res.status(401).json({ error: 'Invalid session' })
  }
}
