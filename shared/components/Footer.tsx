import React from 'react'

export const Footer: React.FC = () => {
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
              <li className="flex gap-4 mt-4">
                <a
                  href="https://www.facebook.com/people/TunedUp/61581814164413/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-textSecondary hover:text-primary transition-colors"
                  aria-label="Visit our Facebook page"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/tunedupdev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-textSecondary hover:text-primary transition-colors"
                  aria-label="Visit our Instagram page"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
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
        </div>
      </div>
    </footer>
  )
}