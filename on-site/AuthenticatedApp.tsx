import React from 'react'
import { AuthenticatedWidget } from '../shared/components/AuthenticatedWidget'
import { getRemainingUsage } from '../shared/contexts/AuthContext'
import { Header } from '../shared/components/Header'
import OnSiteApp from './App'

export default function AuthenticatedOnSite() {
  return (
    <AuthenticatedWidget
      toolType="image"
      widgetName="On-Site Generator"
    >
      {({ user, hasUsage, onUseQuota, isAuthenticated }) => {
        // Only show authenticated quota exceeded screen if user is logged in
        if (!hasUsage && isAuthenticated && user) {
          const usage = getRemainingUsage(user, 'image')

          return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  On-Site Generator
                </h2>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-orange-800 font-semibold">Quota Exceeded</p>
                  <p className="text-orange-700 text-sm mt-1">
                    You've used {usage.used}/{usage.limit} image generations this month on your {user.planCode} plan.
                  </p>
                </div>

                <p className="text-gray-600 mb-6">
                  Upgrade your plan to continue using the On-Site Generator
                </p>

                <div className="space-y-3">
                  <a
                    href="/dashboard"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
                  >
                    Upgrade Plan
                  </a>
                  <a
                    href="/dashboard"
                    className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm"
                  >
                    Back to Dashboard
                  </a>
                </div>
              </div>
            </div>
          )
        }

        return (
          <div className="min-h-screen bg-background text-textPrimary">
            <Header toolName="On-Site Generator" />
            <OnSiteApp
              onUseQuota={onUseQuota}
              user={user}
            />
          </div>
        )
      }}
    </AuthenticatedWidget>
  )
}