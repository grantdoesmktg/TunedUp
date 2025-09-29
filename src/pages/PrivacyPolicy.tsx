import React from 'react'
import { Header } from '../../shared/components/Header'
import { Footer } from '../../shared/components/Footer'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Header />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-secondary rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-6">TunedUp Privacy Policy</h1>
          <p className="text-textSecondary mb-8">Effective Date: September 29, 2025</p>

          <div className="prose prose-invert max-w-none">
            <p className="text-textPrimary mb-6">
              TunedUp ("TunedUp," "we," "us," or "our") respects your privacy. This Privacy Policy explains what we
              collect, how we use it, and the choices you have.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">1) Information We Collect</h2>
            <p className="text-textPrimary mb-4">We collect only what we need to run the product:</p>
            <ul className="list-disc list-inside text-textPrimary mb-6 space-y-2">
              <li>Account info: name, email, password (hashed).</li>
              <li>Payment info: handled by Stripe. We do not store full card numbers.</li>
              <li>Usage data: tool activity (e.g., generation counts, quotas, error logs) to enforce plan limits and improve reliability.</li>
              <li>Support communications: messages you send us (e.g., email) and related metadata.</li>
            </ul>
            <p className="text-textPrimary mb-6">
              No cookies or tracking scripts are used at this time. If we add them later, we'll update this policy.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">2) How We Use Information</h2>
            <p className="text-textPrimary mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-textPrimary mb-6 space-y-2">
              <li>Provide, maintain, and improve TunedUp.</li>
              <li>Track and enforce quotas and plan features.</li>
              <li>Process payments via Stripe.</li>
              <li>Communicate important service updates and respond to support requests.</li>
              <li>Marketing to registered users: we may send product updates, feature announcements, and promotions to people who created an account. You can opt out anytime.</li>
            </ul>
            <p className="text-textPrimary mb-6">We do not sell your personal data.</p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">3) Third-Party Services (Processors)</h2>
            <p className="text-textPrimary mb-4">We rely on trusted vendors to deliver the service:</p>
            <ul className="list-disc list-inside text-textPrimary mb-6 space-y-2">
              <li>Stripe – payments.</li>
              <li>Vercel (hosting) & Vercel Postgres – app hosting and database.</li>
              <li>Model APIs (e.g., OpenAI, Google AI) – power certain features.</li>
              <li>Email provider – to send account and support emails.</li>
            </ul>
            <p className="text-textPrimary mb-6">
              Note: We used "Claude" (Anthropic) as a development tool while building the product. That does not
              mean your production data is shared with Claude. We do not transmit your account or usage data to
              Anthropic unless you explicitly share something with us via support and we use a tool to analyze that
              text.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">4) Your Choices & Rights</h2>
            <ul className="list-disc list-inside text-textPrimary mb-6 space-y-2">
              <li>Access / Export: Request a copy of your data.</li>
              <li>Delete: Request deletion of your account and associated personal data (subject to legal/transaction record requirements).</li>
              <li>Email Preferences: Opt out of marketing emails at any time (links in emails or by contacting us).</li>
            </ul>
            <p className="text-textPrimary mb-6">
              To make a request, email support@tunedup.com. We aim to respond within 30 days.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">5) California Privacy (CCPA)</h2>
            <p className="text-textPrimary mb-4">If you are a California resident, you may request:</p>
            <ul className="list-disc list-inside text-textPrimary mb-6 space-y-2">
              <li>Disclosure of categories of personal information we collect, use, or disclose.</li>
              <li>Access to specific pieces of personal information we hold about you.</li>
              <li>Deletion of personal information (subject to certain exceptions).</li>
            </ul>
            <p className="text-textPrimary mb-6">
              We do not sell personal information. Submit requests via the contact info below.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">6) Data Security</h2>
            <p className="text-textPrimary mb-6">
              We use reasonable administrative, technical, and physical safeguards to protect your data. No method
              of transmission or storage is 100% secure, but we work to protect your information.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">7) Children's Privacy</h2>
            <p className="text-textPrimary mb-6">
              TunedUp is not intended for children under 13, and we do not knowingly collect data from children.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">8) Changes to This Policy</h2>
            <p className="text-textPrimary mb-6">
              We may update this Policy from time to time. If we make material changes, we'll notify you via email or
              an in-app notice.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">9) Contact Us</h2>
            <div className="text-textPrimary">
              <p>TunedUp</p>
              <p>21 Gramercy Park Dr, APT 1616</p>
              <p>Bryan, Texas 77802</p>
              <p>Email: support@tunedup.com</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}