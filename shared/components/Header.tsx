import React from 'react'
import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  toolName?: string
}

export const Header: React.FC<HeaderProps> = ({ toolName }) => {
  const { user, logout } = useAuth()

  if (!user) return null

  const isFreePlan = user.planCode === 'FREE'
  const isAdmin = user.planCode === 'ADMIN'

  return (
    <div className="bg-secondary shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <a
              href="/dashboard"
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img
                src="/TunedUp Horiztonal.png"
                alt="TunedUp"
                className="h-8"
              />
            </a>
            {toolName && (
              <>
                <span className="text-textSecondary">/</span>
                <span className="text-lg text-textPrimary">{toolName}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-textSecondary">Welcome, </span>
              <span className="font-semibold text-textPrimary">{user.email}</span>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isAdmin ? 'bg-highlight/20 text-highlight' :
              isFreePlan ? 'bg-divider text-textSecondary' : 'bg-primary/20 text-primary'
            }`}>
              {user.planCode} {isAdmin ? '🔥' : 'Plan'}
            </span>
            <button
              onClick={logout}
              className="text-textSecondary hover:text-textPrimary text-sm font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}