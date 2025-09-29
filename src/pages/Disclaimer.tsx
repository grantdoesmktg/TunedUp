import React from 'react'
import { Header } from '../../shared/components/Header'
import { Footer } from '../../shared/components/Footer'

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Header />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-secondary rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-6">TunedUp Disclaimer</h1>
          <p className="text-textSecondary mb-8">Effective Date: September 29, 2025</p>

          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">Informational Use Only</h2>
            <p className="text-textPrimary mb-6">
              TunedUp's tools (Performance Calculator, Build Planner, Image Generator) are for educational and entertainment purposes only. Results, estimates, or outputs should not be considered professional advice.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">No Guarantee of Performance</h2>
            <p className="text-textPrimary mb-6">
              Vehicle modifications, performance predictions, and builds are simulated estimates and may not reflect real-world results. Always consult a qualified professional before making modifications.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">No Liability</h2>
            <p className="text-textPrimary mb-6">
              TunedUp is not responsible for any damages, costs, or risks that may arise from actions taken based on our Services.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">Third-Party Services</h2>
            <p className="text-textPrimary mb-6">
              We use third-party providers (e.g., Stripe, OpenAI, Google AI, Vercel) to deliver parts of our Services. We do not control and are not responsible for their actions.
            </p>

            <h2 className="text-2xl font-semibold text-textPrimary mt-8 mb-4">Your Responsibility</h2>
            <p className="text-textPrimary">
              Use your own judgment when relying on TunedUp outputs, and never operate a vehicle in an unsafe or unlawful manner.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}