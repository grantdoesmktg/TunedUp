import React, { useState } from 'react'
import { useAuth, getRemainingUsage } from '../contexts/AuthContext'
import { UpgradePopup } from './UpgradePopup'

interface AuthenticatedWidgetProps {
  children: (props: {
    user: any
    hasUsage: boolean
    onUseQuota: () => Promise<void>
    isAuthenticated: boolean
  }) => React.ReactNode
  toolType: 'performance' | 'build' | 'image'
  widgetName: string
}

export const AuthenticatedWidget: React.FC<AuthenticatedWidgetProps> = ({
  children,
  toolType,
  widgetName
}) => {
  const { user, loading } = useAuth()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [quotaError, setQuotaError] = useState<any>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in required</h2>
          <p className="text-gray-600 mb-6">
            You need to sign in to use the {widgetName}
          </p>
          <a
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Sign In
          </a>
          <div className="mt-4">
            <a
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  const usage = getRemainingUsage(user, toolType)
  const hasUsage = usage.remaining > 0

  const handleUseQuota = async () => {
    if (!hasUsage) {
      setQuotaError({
        plan: user.planCode,
        used: usage.used,
        limit: usage.limit,
        message: `You've used ${usage.used}/${usage.limit} ${toolType} calculations this month. Upgrade to continue.`
      })
      setShowUpgrade(true)
      throw new Error('Quota exceeded')
    }

    try {
      const response = await fetch('/api/increment-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          toolType: toolType
        })
      })

      if (!response.ok) {
        throw new Error('Failed to increment usage')
      }
    } catch (error) {
      console.error('Usage increment failed:', error)
      // Don't throw here - graceful degradation
    }
  }

  return (
    <>
      {children({
        user,
        hasUsage,
        onUseQuota: handleUseQuota,
        isAuthenticated: true
      })}

      {quotaError && (
        <UpgradePopup
          isOpen={showUpgrade}
          onClose={() => {
            setShowUpgrade(false)
            setQuotaError(null)
          }}
          plan={quotaError.plan}
          used={quotaError.used}
          limit={quotaError.limit}
          toolType={toolType}
          message={quotaError.message}
        />
      )}
    </>
  )
}