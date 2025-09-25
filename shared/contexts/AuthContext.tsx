import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  planCode: string
  planRenewsAt?: Date
  extraCredits: Record<string, any>
  perfUsed: number
  buildUsed: number
  imageUsed: number
  resetDate: Date
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string) => Promise<{ success: boolean; message: string; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')

      if (response.ok) {
        const data = await response.json()
        setUser({
          ...data.user,
          planRenewsAt: data.user.planRenewsAt ? new Date(data.user.planRenewsAt) : undefined,
          resetDate: new Date(data.user.resetDate),
          createdAt: new Date(data.user.createdAt)
        })
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string): Promise<{ success: boolean; message: string; error?: string }> => {
    try {
      const response = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: data.message
        }
      } else {
        return {
          success: false,
          message: 'Failed to send magic link',
          error: data.error
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: 'Network error occurred',
        error: 'Network error'
      }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      })
      setUser(null)
      // Redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      // Clear user state anyway
      setUser(null)
      window.location.href = '/'
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Plan limits helper
export const PLAN_LIMITS = {
  FREE: { perf: 1, build: 1, image: 3 },
  PLUS: { perf: 10, build: 10, image: 25 },
  PRO: { perf: 15, build: 15, image: 60 },
  ULTRA: { perf: 25, build: 25, image: 100 }
}

export function getRemainingUsage(user: User | null, toolType: 'performance' | 'build' | 'image') {
  if (!user) return { remaining: Infinity, limit: Infinity }

  const limits = PLAN_LIMITS[user.planCode as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE
  let used: number
  let limit: number

  switch (toolType) {
    case 'performance':
      used = user.perfUsed
      limit = limits.perf
      break
    case 'build':
      used = user.buildUsed
      limit = limits.build
      break
    case 'image':
      used = user.imageUsed
      limit = limits.image
      break
  }

  return {
    remaining: Math.max(0, limit - used),
    limit,
    used
  }
}