import React from 'react'
import { Header } from '../../shared/components/Header'
import { Footer } from '../../shared/components/Footer'
import { ImageSlider } from '../../shared/components/ImageSlider'
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-[#07fef7] to-[#d82c83] bg-clip-text text-transparent">
              AI-Powered Automotive Tools
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-textSecondary mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
              Plan, design, and visualize your perfect build with cutting-edge AI technology
            </p>
          </div>
        </div>

        {/* Gradient background effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#07fef7]/10 to-[#d82c83]/10 rounded-full blur-3xl -z-10" />
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
          {tools.map((tool) => (
            <a
              key={tool.path}
              href={tool.path}
              className="group bg-gradient-to-br from-secondary to-background rounded-xl p-6 sm:p-8 border-2 border-divider hover:border-primary transition-all hover:shadow-2xl hover:scale-105 cursor-pointer transform"
            >
              <div className={`text-5xl sm:text-6xl mb-3 sm:mb-4 bg-gradient-to-r ${tool.gradient} bg-clip-text text-transparent`}>
                {tool.icon}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-textPrimary group-hover:text-primary transition-colors">
                {tool.name}
              </h3>
              <p className="text-sm sm:text-base text-textSecondary mb-4 sm:mb-6">
                {tool.description}
              </p>
              <div className="inline-flex items-center justify-center w-full bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold group-hover:opacity-90 transition-all">
                Try it now
                <span className="ml-2 group-hover:ml-3 transition-all">→</span>
              </div>
            </a>
          ))}
        </div>

        {/* Feature highlights */}
        <div className="bg-secondary rounded-xl p-6 sm:p-8 border border-divider">
          <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Why TunedUp?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🚀</div>
              <h4 className="font-bold mb-1 sm:mb-2 text-textPrimary text-base sm:text-lg">Instant Results</h4>
              <p className="text-textSecondary text-xs sm:text-sm">
                Get AI-powered estimates and plans in seconds
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">💾</div>
              <h4 className="font-bold mb-1 sm:mb-2 text-textPrimary text-base sm:text-lg">Save Your Work</h4>
              <p className="text-textSecondary text-xs sm:text-sm">
                Create an account to save builds and track modifications
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🌟</div>
              <h4 className="font-bold mb-1 sm:mb-2 text-textPrimary text-base sm:text-lg">Share & Inspire</h4>
              <p className="text-textSecondary text-xs sm:text-sm">
                Join our community gallery and showcase your dream builds
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Gallery Section */}
      <div className="bg-gradient-to-r from-[#07fef7]/10 to-[#d82c83]/10 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Community Gallery</h2>
          <ImageSlider />
          <div className="text-center mt-6 sm:mt-8">
            <a
              href="/community"
              className="bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity text-base sm:text-lg inline-flex items-center gap-2"
            >
              View All Images
              <span>→</span>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
