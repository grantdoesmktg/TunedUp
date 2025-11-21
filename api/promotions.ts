import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkPromotion, getPromotionStats } from '../lib/promotions.js';
import { setCorsHeaders } from '../lib/corsConfig.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Promotion code required' });
    }

    // Get promotion availability
    const check = await checkPromotion(code);

    if (!check.available) {
      return res.status(200).json({
        available: false,
        reason: check.reason
      });
    }

    // Get detailed stats (without sensitive data)
    const stats = await getPromotionStats(code);

    return res.status(200).json({
      available: true,
      remaining: stats?.remaining || 0,
      planCode: check.promotion?.planCode
    });

  } catch (error) {
    console.error('Promotions API error:', error);
    return res.status(500).json({ error: 'Failed to check promotion' });
  }
}
