import React, { useState } from 'react'

interface UpgradePlansModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
}

export const UpgradePlansModal: React.FC<UpgradePlansModalProps> = ({
  isOpen,
  onClose,
  currentPlan
}) => {
  const [loading, setLoading] = useState<string | null>(null)

  if (!isOpen) return null

  const plans = [
    {
      code: 'PLUS',
      name: 'Plus',
      price: '$4.99',
      features: [
        '10 Performance calculations',
        '10 Build plans',
        '25 Image generations',
        '10 Community posts',
        '30 character custom details'
      ],
      popular: false
    },
    {
      code: 'PRO',
      name: 'Pro',
      price: '$9.99',
      features: [
        '15 Performance calculations',
        '15 Build plans',
        '60 Image generations',
        '20 Community posts',
        '50 character custom details'
      ],
      popular: true
    },
    {
      code: 'ULTRA',
      name: 'Ultra',
      price: '$14.99',
      features: [
        '25 Performance calculations',
        '25 Build plans',
        '100 Image generations',
        '30 Community posts',
        '250 character custom details'
      ],
      popular: false
    }
  ]

  const handleUpgrade = async (planCode: string) => {
    if (planCode === currentPlan) return

    setLoading(planCode)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: planCode })
      })

      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        console.error('Failed to create checkout:', data.error)
        alert('Failed to start checkout process')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Network error occurred')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Upgrade Your Plan</h2>
              <p className="mt-2 text-gray-600">Choose the perfect plan for your automotive needs</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = plan.code === currentPlan
              const isLoading = loading === plan.code

              return (
                <div
                  key={plan.code}
                  className={`relative border rounded-lg p-6 ${
                    plan.popular
                      ? 'border-blue-500 shadow-lg bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                      {plan.name}
                      {plan.code === 'PLUS' && <span className="text-2xl">⭐</span>}
                      {plan.code === 'PRO' && <span className="text-2xl">💎</span>}
                      {plan.code === 'ULTRA' && <span className="text-2xl">👑</span>}
                    </h3>
                    <div className="mt-4 flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-lg text-gray-600 ml-1">/month</span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-3 text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-md text-sm font-medium cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.code)}
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                          plan.popular
                            ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                            : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400'
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        ) : (
                          `Upgrade to ${plan.name}`
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              All plans include unlimited access to all tools. Cancel anytime.
            </p>
            <p className="text-xs text-gray-400">
              Powered by Stripe • Secure payments • 30-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}