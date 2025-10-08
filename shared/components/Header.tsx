import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { UpgradePlansModal } from './UpgradePlansModal'

interface HeaderProps {
  toolName?: string
}

export const Header: React.FC<HeaderProps> = ({ toolName }) => {
  const { user, logout } = useAuth()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const isFreePlan = user?.planCode === 'FREE'
  const isAdmin = user?.planCode === 'ADMIN'

  return (
    <div className="bg-secondary shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <a
              href={user ? "/dashboard" : "/"}
              className="hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
            >
              <img
                src="/TunedUp Horiztonal.png"
                alt="TunedUp"
                className="h-6 sm:h-8"
              />
            </a>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <a
                href="/build-planner"
                className="px-3 py-2 rounded-md text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-divider transition-colors"
              >
                Plan
              </a>
              <a
                href="/performance-calculator"
                className="px-3 py-2 rounded-md text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-divider transition-colors"
              >
                Calculate
              </a>
              <a
                href="/w/on-site/embed"
                className="px-3 py-2 rounded-md text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-divider transition-colors"
              >
                Visualize
              </a>
              <a
                href="/community"
                className="px-3 py-2 rounded-md text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-divider transition-colors"
              >
                Community
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <>
                <div className="text-sm hidden lg:block">
                  <span className="text-textSecondary">Welcome, </span>
                  <span className="font-semibold text-textPrimary">{user.email}</span>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80 cursor-pointer flex-shrink-0 ${
                    isAdmin ? 'bg-highlight/20 text-highlight' :
                    isFreePlan ? 'bg-divider text-textSecondary' : 'bg-primary/20 text-primary'
                  }`}
                >
                  {user.planCode}
                  {user.planCode === 'PLUS' && <span className="text-sm">⭐</span>}
                  {user.planCode === 'PRO' && <span className="text-sm">💎</span>}
                  {user.planCode === 'ULTRA' && <span className="text-sm">👑</span>}
                  {user.planCode === 'ADMIN' ? <span className="text-sm">🔥</span> : ' Plan'}
                </button>
                <button
                  onClick={logout}
                  className="text-textSecondary hover:text-textPrimary text-sm font-medium flex-shrink-0"
                >
                  Sign out
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>

      {user && (
        <UpgradePlansModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={user.planCode}
        />
      )}
    </div>
  )
}