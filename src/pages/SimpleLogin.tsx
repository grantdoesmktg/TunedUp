import React, { useState } from 'react'
import { useAuth } from '../../shared/contexts/AuthContext'
import { Footer } from '../../shared/components/Footer'

export default function SimpleLogin() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setMessage('')

    try {
      const result = await login(email)
      setMessage(result.message)
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const images = [
    '/images/tuned-up-1757711926260.png',
    '/images/tuned-up-1757971587243.png',
    '/images/tuned-up-1757972409148.png',
    '/images/tuned-up-1757972682787.png',
    '/images/tuned-up-1759177229575.png',
    '/images/tuned-up-1759177523593.png',
    '/images/tuned-up-1759177607642.png',
    '/images/tuned-up-img_1759177390609_9632m64x3.png'
  ]

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#07fef7]/20 to-[#d82c83]/20 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <img
              src="/TunedUp Horiztonal.png"
              alt="TunedUp"
              className="h-16 mx-auto mb-8"
            />
            <h1 className="text-5xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-[#07fef7] to-[#d82c83] bg-clip-text text-transparent leading-loose pb-2">
              Supercharge Your Build
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-textSecondary max-w-3xl mx-auto">
              AI-powered automotive tools to optimize performance, plan builds, and visualize your dream ride
            </p>

            {/* Login Form */}
            <div className="max-w-md mx-auto bg-secondary p-8 rounded-2xl shadow-2xl border border-divider">
              <h2 className="text-2xl font-semibold mb-6 text-textPrimary">
                Get Started Free
              </h2>

              {message && (
                <div className={`p-4 rounded-lg mb-6 ${
                  message.includes('sent')
                    ? 'bg-success/20 border border-success text-success'
                    : 'bg-error/20 border border-error text-error'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-textPrimary">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-background border border-divider rounded-lg text-textPrimary placeholder-textSecondary focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>

              <p className="text-sm text-textSecondary mt-4">
                Start with <strong>1</strong> performance calc, <strong>1</strong> build plan, <strong>3</strong> images free
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-textPrimary">
              Precision Tools for Automotive Excellence
            </h2>
            <p className="text-xl text-textSecondary max-w-2xl mx-auto">
              From performance calculations to build planning and visualization - everything you need in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-8 rounded-2xl border border-divider hover:border-primary transition-colors">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-semibold mb-4 text-textPrimary">Performance Calculator</h3>
              <p className="text-textSecondary mb-6">
                AI-powered analysis of your modifications. Get accurate horsepower, torque, and 0-60 predictions with confidence scoring.
              </p>
              <ul className="space-y-2 text-sm text-textSecondary">
                <li>• Real-world performance estimates</li>
                <li>• Modification impact analysis</li>
                <li>• Power-to-weight optimization</li>
              </ul>
            </div>

            <div className="bg-background p-8 rounded-2xl border border-divider hover:border-primary transition-colors">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-2xl font-semibold mb-4 text-textPrimary">Build Planner</h3>
              <p className="text-textSecondary mb-6">
                Expert recommendations for your next automotive project. Plan modifications with budget-conscious, performance-focused advice.
              </p>
              <ul className="space-y-2 text-sm text-textSecondary">
                <li>• Curated modification recommendations</li>
                <li>• Budget and timeline planning</li>
                <li>• Compatibility verification</li>
              </ul>
            </div>

            <div className="bg-background p-8 rounded-2xl border border-divider hover:border-primary transition-colors">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-2xl font-semibold mb-4 text-textPrimary">AI Image Generator</h3>
              <p className="text-textSecondary mb-6">
                Visualize your dream build before you start. Generate stunning automotive imagery and custom visualizations.
              </p>
              <ul className="space-y-2 text-sm text-textSecondary">
                <li>• Custom automotive imagery</li>
                <li>• Build visualization concepts</li>
                <li>• High-quality render outputs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Section */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-textPrimary">
              Generated with TunedUp
            </h2>
            <p className="text-xl text-textSecondary">
              Real examples of automotive imagery created by our AI tools
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group overflow-hidden rounded-xl">
                <img
                  src={image}
                  alt={`Generated automotive image ${index + 1}`}
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-br from-[#07fef7] to-[#d82c83]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Transform Your Build?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join the community of builders using AI to optimize their automotive projects
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">1000+</div>
              <div className="text-sm opacity-90">Performance Calculations</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm opacity-90">Build Plans Created</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-3xl font-bold">2000+</div>
              <div className="text-sm opacity-90">Images Generated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sign Up Section */}
      <div className="py-16 bg-secondary border-t border-divider">
        <div className="max-w-2xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4 text-textPrimary">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-textSecondary mb-8">
            Join thousands of builders optimizing their automotive projects with AI
          </p>
          <button
            onClick={() => {
              document.querySelector('h1')?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              })
            }}
            className="bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Sign Up Free - Get Started Now
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}