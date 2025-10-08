import React from 'react'
import { Header } from '../../shared/components/Header'
import { Footer } from '../../shared/components/Footer'
import { useAuth } from '../../shared/contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  // If logged in, redirect to dashboard
  if (user) {
    window.location.href = '/dashboard'
    return null
  }

  const tools = [
    {
      name: 'Performance Calculator',
      description: 'Get AI-powered performance estimates for your car with planned modifications',
      path: '/performance-calculator',
      icon: '⚡',
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      name: 'Build Planner',
      description: 'Plan your perfect build with AI-generated modification roadmaps',
      path: '/build-planner',
      icon: '🔧',
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      name: 'AI Image Generator',
      description: 'Generate stunning automotive images for your dream build',
      path: '/w/on-site/embed',
      icon: '🎨',
      gradient: 'from-purple-400 to-pink-500'
    }
  ]

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Header />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#07fef7] to-[#d82c83] bg-clip-text text-transparent">
              AI-Powered Automotive Tools
            </h1>
            <p className="text-xl md:text-2xl text-textSecondary mb-8 max-w-3xl mx-auto">
              Plan, design, and visualize your perfect build with cutting-edge AI technology
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/performance-calculator"
                className="bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity text-lg"
              >
                Try Performance Calculator Free
              </a>
              <a
                href="/community"
                className="bg-secondary border border-primary text-textPrimary px-8 py-4 rounded-lg font-semibold hover:bg-primary hover:bg-opacity-10 transition-all text-lg"
              >
                View Community Gallery
              </a>
            </div>
          </div>
        </div>

        {/* Gradient background effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#07fef7]/10 to-[#d82c83]/10 rounded-full blur-3xl -z-10" />
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Start Building for <span className="text-success">Free</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {tools.map((tool) => (
            <a
              key={tool.path}
              href={tool.path}
              className="group bg-secondary rounded-xl p-8 border border-divider hover:border-primary transition-all hover:shadow-xl"
            >
              <div className={`text-6xl mb-4 bg-gradient-to-r ${tool.gradient} bg-clip-text text-transparent`}>
                {tool.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3 text-textPrimary group-hover:text-primary transition-colors">
                {tool.name}
              </h3>
              <p className="text-textSecondary mb-6">
                {tool.description}
              </p>
              <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
                Try it now
                <span className="ml-1 group-hover:ml-2 transition-all">→</span>
              </div>
            </a>
          ))}
        </div>

        {/* Feature highlights */}
        <div className="bg-secondary rounded-xl p-8 border border-divider">
          <h3 className="text-2xl font-bold mb-6 text-center">Why TunedUp?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h4 className="font-bold mb-2 text-textPrimary">Instant Results</h4>
              <p className="text-textSecondary text-sm">
                Get AI-powered estimates and plans in seconds, no signup required
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💾</div>
              <h4 className="font-bold mb-2 text-textPrimary">Save Your Work</h4>
              <p className="text-textSecondary text-sm">
                Create a free account to save builds and track modifications
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🌟</div>
              <h4 className="font-bold mb-2 text-textPrimary">Share & Inspire</h4>
              <p className="text-textSecondary text-sm">
                Join our community gallery and showcase your dream builds
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#07fef7]/10 to-[#d82c83]/10 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your Dream Car?</h2>
          <p className="text-xl text-textSecondary mb-8">
            Start for free, no credit card required
          </p>
          <a
            href="/performance-calculator"
            className="bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white px-10 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity text-lg inline-block"
          >
            Get Started Now
          </a>
        </div>
      </div>

      <Footer />
    </div>
  )
}
