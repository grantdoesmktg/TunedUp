import { hasEnoughTokens, deductTokens } from './tokens.js'

/**
 * Check if user has enough tokens for an action
 * This is a wrapper for backward compatibility with existing code
 */
export async function checkQuota(email, toolType, fingerprint) {
  return await hasEnoughTokens(email, toolType, fingerprint)
}

/**
 * Deduct tokens after successful action
 * This is a wrapper for backward compatibility with existing code
 */
export async function incrementUsage(email, toolType, fingerprint) {
  return await deductTokens(email, toolType, fingerprint)
}
