import React from 'react'
import { useLocation } from 'react-router-dom'

export const BottomNav: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', icon: '🏠', label: 'Home' },
    { path: '/build-planner', icon: '🔧', label: 'Plan' },
    { path: '/performance-calculator', icon: '⚡', label: 'Calculate' },
    { path: '/w/on-site/embed', icon: '🎨', label: 'Visualize' },
    { path: '/community', icon: '👥', label: 'Community' }
  ]

  const isActive = (path: string) => {
    // Home button is active on / or /dashboard
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    return location.pathname === path
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-secondary border-t border-divider z-50"
      style={{
        paddingBottom: 'var(--safe-area-inset-bottom)',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      <div className="flex justify-around items-center px-2">
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors ${
              isActive(item.path)
                ? 'text-primary'
                : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium truncate">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
