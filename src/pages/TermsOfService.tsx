import React from 'react'
import { Header } from '../../shared/components/Header'
import { Footer } from '../../shared/components/Footer'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Header />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-secondary rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-6">TunedUp Terms of Service</h1>
          <p className="text-textSecondary mb-8">Effective Date: September 29, 2025</p>

          <div className="prose prose-invert max-w-none">
            <p className="text-textPrimary mb-6">
              Welcome to TunedUp! These Terms of Service ("Terms") govern your use of our website, tools, and services ("Services"). By using TunedUp, you agree to these Terms.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">1. Use of Services</h2>
            <ul className="list-disc list-inside text-textPrimary mb-6 space-y-2">
              <li>You must be at least 13 years old to use TunedUp.</li>
              <li>You agree to use TunedUp only for lawful purposes.</li>
              <li>You are responsible for keeping your account login credentials secure.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">2. Accounts & Subscriptions</h2>
            <ul className="list-disc list-inside text-textPrimary mb-6 space-y-2">
              <li>Some features require an account and/or a paid plan.</li>
              <li>All payments are processed securely by Stripe.</li>
              <li>We may adjust quotas, pricing, or features. If we do, we'll notify you in advance.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">3. Intellectual Property</h2>
            <ul className="list-disc list-inside text-textPrimary mb-6 space-y-2">
              <li>All content, code, and design of TunedUp are owned by us.</li>
              <li>You retain rights to the content you create using our tools, subject to the limits of the underlying APIs (e.g., OpenAI, Gemini).</li>
            </ul>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">4. Disclaimer of Warranties</h2>
            <ul className="list-disc list-inside text-textPrimary mb-6 space-y-2">
              <li>TunedUp is provided "as is" and "as available."</li>
              <li>We make no guarantees about accuracy, availability, or fitness for a particular purpose.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">5. Limitation of Liability</h2>
            <p className="text-textPrimary mb-6">
              To the fullest extent permitted by law, TunedUp is not liable for any damages that may result from using our Services.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">6. Termination</h2>
            <ul className="list-disc list-inside text-textPrimary mb-6 space-y-2">
              <li>You may close your account anytime.</li>
              <li>We may suspend or terminate accounts that abuse the Services or violate these Terms.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">7. Changes</h2>
            <p className="text-textPrimary mb-6">
              We may update these Terms from time to time. If we make significant changes, we'll notify you by email or an in-app notice.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">8. Contact</h2>
            <p className="text-textPrimary">
              Questions? Email us at support@tunedup.com
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}