import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export const Footer: React.FC = () => {
  const { user } = useAuth()
  return (
    <footer className="bg-secondary border-t border-divider mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <a href="/dashboard" className="text-textSecondary hover:text-textPrimary transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/performance-calculator" className="text-textSecondary hover:text-textPrimary transition-colors">
                  Performance Calculator
                </a>
              </li>
              <li>
                <a href="/build-planner" className="text-textSecondary hover:text-textPrimary transition-colors">
                  Build Planner
                </a>
              </li>
              <li>
                <a href="/w/on-site/embed" className="text-textSecondary hover:text-textPrimary transition-colors">
                  Image Generator
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="/privacy-policy" className="text-textSecondary hover:text-textPrimary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms-of-service" className="text-textSecondary hover:text-textPrimary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/disclaimer" className="text-textSecondary hover:text-textPrimary transition-colors">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Info */}
          <div>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@tunedup.dev" className="text-textSecondary hover:text-textPrimary transition-colors">
                  support@tunedup.dev
                </a>
              </li>
              <li className="text-textSecondary">
                Made with ❤️ in Texas
              </li>
              <li className="text-textSecondary">
                We'd love to hear your feedback!
              </li>
              <li>
                <a href="mailto:support@tunedup.dev" className="text-textSecondary hover:text-textPrimary transition-colors">
                  Send us your requests
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-divider mt-8 pt-8 text-center">
          <p className="text-textSecondary">
            © 2025 TunedUp. All rights reserved.
          </p>

          {/* Admin Dev Button - Only show for grantdoesmktg@gmail.com */}
          {user?.email === 'grantdoesmktg@gmail.com' && (
            <div className="mt-4">
              <a
                href="/admin"
                className="inline-flex items-center px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                dev
              </a>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}