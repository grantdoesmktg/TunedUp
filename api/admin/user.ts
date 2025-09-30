import { VercelRequest, VercelResponse } from '@vercel/node'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { email, action, newPlan } = req.method === 'GET' ? req.query : req.body

  try {
    if (req.method === 'GET' && action === 'all') {
      // Get all users
      const users = await prisma.user.findMany({
        select: {
          email: true,
          planCode: true,
          perfUsed: true,
          buildUsed: true,
          imageUsed: true,
          resetDate: true,
          createdAt: true,
          stripeCustomerId: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return res.status(200).json(users)
    }

    if (req.method === 'GET' || action === 'get') {
      // Get specific user info
      if (!email) {
        return res.status(400).json({ error: 'Email is required' })
      }

      const user = await prisma.user.findUnique({
        where: { email: email as string },
        select: {
          email: true,
          planCode: true,
          perfUsed: true,
          buildUsed: true,
          imageUsed: true,
          resetDate: true,
          createdAt: true,
          stripeCustomerId: true
        }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      return res.status(200).json(user)
    }

    if (req.method === 'POST' && action === 'upgrade') {
      // Upgrade user plan
      if (!newPlan) {
        return res.status(400).json({ error: 'newPlan is required for upgrade' })
      }

      const validPlans = ['FREE', 'PLUS', 'PRO', 'ULTRA', 'ADMIN']
      if (!validPlans.includes(newPlan as string)) {
        return res.status(400).json({
          error: `Invalid plan. Must be one of: ${validPlans.join(', ')}`
        })
      }

      const updatedUser = await prisma.user.update({
        where: { email: email as string },
        data: {
          planCode: newPlan as string,
          planRenewsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        },
        select: {
          email: true,
          planCode: true,
          perfUsed: true,
          buildUsed: true,
          imageUsed: true,
          planRenewsAt: true
        }
      })

      return res.status(200).json({
        message: `User ${email} upgraded to ${newPlan}`,
        user: updatedUser
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('Admin user API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}