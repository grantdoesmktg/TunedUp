import { VercelRequest, VercelResponse } from '@vercel/node';
import { createFirst50Promotion } from '../lib/promotions.js';
import { setCorsHeaders } from '../lib/corsConfig.js';

/**
 * One-time initialization endpoint to create FIRST50 promotion
 * Call this after deployment: GET /api/init-promotion?secret=YOUR_SECRET
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple secret check to prevent abuse
  const { secret } = req.query;
  const expectedSecret = process.env.INIT_SECRET || 'tunedup-init-2025';

  if (secret !== expectedSecret) {
    return res.status(403).json({ error: 'Invalid secret' });
  }

  try {
    const promotion = await createFirst50Promotion();

    return res.status(200).json({
      success: true,
      message: 'FIRST50 promotion created successfully',
      promotion: {
        code: promotion.code,
        planCode: promotion.planCode,
        maxUses: promotion.maxUses,
        usedCount: promotion.usedCount,
        active: promotion.active
      }
    });

  } catch (error) {
    console.error('Init promotion error:', error);
    return res.status(500).json({
      error: 'Failed to initialize promotion',
      details: error.message
    });
  }
}
