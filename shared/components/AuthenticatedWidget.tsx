import React, { useState } from 'react'
import { useAuth, getRemainingUsage } from '../contexts/AuthContext'
import { UpgradePopup } from './UpgradePopup'
import { checkAnonymousQuota, incrementAnonymousUsage } from '../utils/anonymousTracking'

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

  // For anonymous users, check anonymous quota
  if (!user) {
    const anonQuota = checkAnonymousQuota(toolType === 'performance' ? 'perf' : toolType === 'build' ? 'build' : 'image')
    const hasUsage = anonQuota.allowed

    const handleAnonymousQuota = async () => {
      if (!hasUsage) {
        setQuotaError({
          plan: 'ANONYMOUS',
          used: anonQuota.used,
          limit: anonQuota.limit,
          message: `You've used your free trial! Sign up to get more ${toolType} calculations.`
        })
        setShowUpgrade(true)
        throw new Error('Anonymous quota exceeded')
      }

      // Increment anonymous usage
      incrementAnonymousUsage(toolType === 'performance' ? 'perf' : toolType === 'build' ? 'build' : 'image')
    }

    return (
      <>
        {children({
          user: null,
          hasUsage,
          onUseQuota: handleAnonymousQuota,
          isAuthenticated: false
        })}

        {quotaError && quotaError.plan === 'ANONYMOUS' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                You've Used Your Free Trial!
              </h2>
              <p className="text-gray-600 mb-6">
                {quotaError.message}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-semibold mb-2">Create a free account to get:</p>
                <ul className="text-left text-blue-700 text-sm space-y-1">
                  <li>✓ 3 performance calculations/month</li>
                  <li>✓ 3 build plans/month</li>
                  <li>✓ 5 image generations/month</li>
                  <li>✓ Save and share your builds</li>
                </ul>
              </div>
              <div className="space-y-3">
                <a
                  href="/login"
                  className="block w-full bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white px-6 py-3 rounded-md font-medium hover:opacity-90"
                >
                  Sign Up Free
                </a>
                <button
                  onClick={() => {
                    setShowUpgrade(false)
                    setQuotaError(null)
                  }}
                  className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
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

    // Note: Usage increment is handled by the backend API endpoints (performance.ts, etc.)
    // This function just checks if the user has quota available
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