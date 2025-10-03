import { VercelRequest, VercelResponse } from '@vercel/node';
import { incrementUsage } from '../lib/quota.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, toolType } = req.body;

    if (!email || !toolType) {
      return res.status(400).json({
        error: 'Missing required fields: email and toolType are required'
      });
    }

    if (!['performance', 'build', 'image'].includes(toolType)) {
      return res.status(400).json({
        error: 'Invalid toolType. Must be performance, build, or image'
      });
    }

    await incrementUsage(email, toolType);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Increment usage API error:', error);
    return res.status(500).json({ error: 'Failed to increment usage' });
  }
}
