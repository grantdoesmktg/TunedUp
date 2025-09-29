import React, { useState, useEffect } from 'react'
import { useAuth, getRemainingUsage, PLAN_LIMITS } from '../../shared/contexts/AuthContext'
import { UpgradePlansModal } from '../../shared/components/UpgradePlansModal'
import { Header } from '../../shared/components/Header'
import { ImageSlider } from '../../shared/components/ImageSlider'
import { Footer } from '../../shared/components/Footer'

export default function Dashboard() {
  const { user, refreshUser, loading: authLoading } = useAuth()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check for success/canceled params from Stripe - MUST be before any early returns
  useEffect(() => {
    if (user) {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('success') === 'true') {
        // Refresh user data after successful payment
        refreshUser()
        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [user, refreshUser])

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    window.location.href = '/login'
    return null
  }

  const perfUsage = getRemainingUsage(user, 'performance')
  const buildUsage = getRemainingUsage(user, 'build')
  const imageUsage = getRemainingUsage(user, 'image')

  const tools = [
    {
      name: 'Performance Calculator',
      description: 'Estimate your car\'s performance with AI-powered calculations',
      path: '/performance-calculator',
      icon: '⚡',
      usage: perfUsage,
      type: 'performance' as const
    },
    {
      name: 'Build Planner',
      description: 'Plan your next automotive build with expert recommendations',
      path: '/build-planner',
      icon: '🔧',
      usage: buildUsage,
      type: 'build' as const
    },
    {
      name: 'On-Site Generator',
      description: 'Generate custom automotive images and visualizations',
      path: '/w/on-site/embed',
      icon: '🎨',
      usage: imageUsage,
      type: 'image' as const
    }
  ]

  const planInfo = PLAN_LIMITS[user.planCode as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE
  const isFreePlan = user.planCode === 'FREE'
  const isAdmin = user.planCode === 'ADMIN'

  const handleManageSubscription = async () => {
    if (isAdmin) {
      // Admins don't need to manage subscriptions
      return
    }

    if (isFreePlan) {
      setShowUpgradeModal(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to open billing portal')
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Header />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Plan Overview */}
        <div className="bg-secondary overflow-hidden shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-textPrimary">
                  Your {user.planCode} Plan
                </h3>
                <p className="mt-1 text-sm text-textSecondary">
                  Monthly usage resets on {new Date(user.resetDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
              {!isAdmin && (
                <button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    isFreePlan
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  {loading ? 'Loading...' : isFreePlan ? 'Upgrade Plan' : 'Manage Subscription'}
                </button>
              )}
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-divider overflow-hidden px-4 py-5 rounded-lg">
                <dt className="text-sm font-medium text-textSecondary truncate">Performance Calcs</dt>
                <dd className="mt-1 text-3xl font-semibold text-textPrimary">
                  {perfUsage.remaining} <span className="text-lg text-textSecondary">/ {perfUsage.limit}</span>
                </dd>
              </div>
              <div className="bg-divider overflow-hidden px-4 py-5 rounded-lg">
                <dt className="text-sm font-medium text-textSecondary truncate">Build Plans</dt>
                <dd className="mt-1 text-3xl font-semibold text-textPrimary">
                  {buildUsage.remaining} <span className="text-lg text-textSecondary">/ {buildUsage.limit}</span>
                </dd>
              </div>
              <div className="bg-divider overflow-hidden px-4 py-5 rounded-lg">
                <dt className="text-sm font-medium text-textSecondary truncate">Image Generations</dt>
                <dd className="mt-1 text-3xl font-semibold text-textPrimary">
                  {imageUsage.remaining} <span className="text-lg text-textSecondary">/ {imageUsage.limit}</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const hasUsage = tool.usage.remaining > 0

            return (
              <div
                key={tool.name}
                className={`bg-secondary overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow ${
                  hasUsage ? 'cursor-pointer' : 'opacity-75'
                }`}
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">{tool.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-textPrimary">
                        {tool.name}
                      </h3>
                      <p className="mt-1 text-sm text-textSecondary">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textSecondary">Usage this month</span>
                      <span className={`font-medium ${hasUsage ? 'text-success' : 'text-error'}`}>
                        {tool.usage.used} / {tool.usage.limit}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-divider rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${hasUsage ? 'bg-success' : 'bg-error'}`}
                        style={{
                          width: `${Math.min(100, (tool.usage.used / tool.usage.limit) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    {hasUsage ? (
                      <a
                        href={tool.path}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium text-center block"
                      >
                        Open Tool
                      </a>
                    ) : (
                      <div className="space-y-2">
                        <button
                          disabled
                          className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed"
                        >
                          Quota Exceeded
                        </button>
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-1 px-3 rounded text-xs font-medium"
                        >
                          Upgrade to Continue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Free Plan CTA */}
        {isFreePlan && (
          <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-xl">
            <div className="px-6 py-8 sm:px-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Ready to unlock more?
                  </h3>
                  <p className="mt-2 text-blue-100">
                    Upgrade to get more calculations, builds, and images each month
                  </p>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-md font-semibold"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Slider */}
        <ImageSlider />

        <UpgradePlansModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={user.planCode}
        />
      </div>

      <Footer />
    </div>
  )
}