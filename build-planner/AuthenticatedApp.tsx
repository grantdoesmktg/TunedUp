import React from 'react'
import { AuthenticatedWidget } from '../shared/components/AuthenticatedWidget'
import { getRemainingUsage } from '../shared/contexts/AuthContext'
import BuildPlannerApp from './App'

export default function AuthenticatedBuildPlanner() {
  return (
    <AuthenticatedWidget
      toolType="build"
      widgetName="Build Planner"
    >
      {({ user, hasUsage, onUseQuota, isAuthenticated }) => {
        if (!hasUsage) {
          const usage = getRemainingUsage(user, 'build')

          return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="text-6xl mb-4">🔧</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Build Planner
                </h2>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-orange-800 font-semibold">Quota Exceeded</p>
                  <p className="text-orange-700 text-sm mt-1">
                    You've used {usage.used}/{usage.limit} build plans this month on your {user.planCode} plan.
                  </p>
                </div>

                <p className="text-gray-600 mb-6">
                  Upgrade your plan to continue using the Build Planner
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
          <BuildPlannerApp
            onUseQuota={onUseQuota}
            user={user}
          />
        )
      }}
    </AuthenticatedWidget>
  )
}