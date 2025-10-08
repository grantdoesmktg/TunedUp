/**
 * Anonymous user tracking for quota management
 * Uses localStorage + browser fingerprinting for tracking usage without authentication
 */

interface AnonymousUsage {
  perfUsed: number
  buildUsed: number
  imageUsed: number
  lastReset: string
}

// Anonymous user limits (1 free use per tool)
export const ANONYMOUS_LIMITS = {
  perf: 1,
  build: 1,
  image: 1
}

/**
 * Generate a semi-unique browser fingerprint
 * Combines multiple browser attributes for anonymous tracking
 */
function getBrowserFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || 'unknown'
  ]

  // Simple hash of combined components
  const fingerprint = btoa(components.join('|'))
  return fingerprint.substring(0, 32)
}

/**
 * Get or create anonymous user ID
 * Uses localStorage with fingerprint fallback
 */
export function getAnonymousId(): string {
  let anonId = localStorage.getItem('anonUserId')

  if (!anonId) {
    // Create new anonymous ID using fingerprint + timestamp
    const fingerprint = getBrowserFingerprint()
    anonId = `anon_${Date.now()}_${fingerprint}`
    localStorage.setItem('anonUserId', anonId)
  }

  return anonId
}

/**
 * Get anonymous user usage data
 */
export function getAnonymousUsage(): AnonymousUsage {
  const defaultUsage: AnonymousUsage = {
    perfUsed: 0,
    buildUsed: 0,
    imageUsed: 0,
    lastReset: new Date().toISOString()
  }

  const stored = localStorage.getItem('anonUsage')
  if (!stored) {
    localStorage.setItem('anonUsage', JSON.stringify(defaultUsage))
    return defaultUsage
  }

  return JSON.parse(stored)
}

/**
 * Increment usage for a specific tool
 */
export function incrementAnonymousUsage(toolType: 'perf' | 'build' | 'image'): void {
  const usage = getAnonymousUsage()

  switch (toolType) {
    case 'perf':
      usage.perfUsed++
      break
    case 'build':
      usage.buildUsed++
      break
    case 'image':
      usage.imageUsed++
      break
  }

  localStorage.setItem('anonUsage', JSON.stringify(usage))
}

/**
 * Check if anonymous user has quota remaining
 */
export function checkAnonymousQuota(toolType: 'perf' | 'build' | 'image'): {
  allowed: boolean
  used: number
  limit: number
  remaining: number
} {
  const usage = getAnonymousUsage()

  let used: number
  let limit: number

  switch (toolType) {
    case 'perf':
      used = usage.perfUsed
      limit = ANONYMOUS_LIMITS.perf
      break
    case 'build':
      used = usage.buildUsed
      limit = ANONYMOUS_LIMITS.build
      break
    case 'image':
      used = usage.imageUsed
      limit = ANONYMOUS_LIMITS.image
      break
  }

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used)
  }
}

/**
 * Check if user is anonymous (not logged in)
 */
export function isAnonymousUser(): boolean {
  // Check if there's a session cookie
  const hasSession = document.cookie.includes('session=') || document.cookie.includes('_vercel_jwt=')
  return !hasSession
}

/**
 * Clear anonymous usage data (useful after user signs up)
 */
export function clearAnonymousUsage(): void {
  localStorage.removeItem('anonUsage')
  localStorage.removeItem('anonUserId')
}
