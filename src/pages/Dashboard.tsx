import React, { useState, useEffect } from 'react'
import { useAuth, getRemainingUsage, PLAN_LIMITS } from '../../shared/contexts/AuthContext'
import { UpgradePlansModal } from '../../shared/components/UpgradePlansModal'
import { Header } from '../../shared/components/Header'
import { ImageSlider } from '../../shared/components/ImageSlider'
import { Footer } from '../../shared/components/Footer'

interface SavedCar {
  id: string
  name: string
  make: string
  model: string
  year: string
  trim?: string
  imageUrl?: string
  performanceData?: any
  buildPlanData?: any
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function Dashboard() {
  const { user, refreshUser, loading: authLoading } = useAuth()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savedCar, setSavedCar] = useState<SavedCar | null>(null)
  const [loadingCar, setLoadingCar] = useState(false)
  const [showImageUploadModal, setShowImageUploadModal] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  // Check for success/canceled params from Stripe - MUST be before any early returns
  useEffect(() => {
    if (user) {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('success') === 'true') {
        // Refresh user data after successful payment
        refreshUser()
        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }, [user, refreshUser])

  // Fetch saved car data
  useEffect(() => {
    if (user) {
      fetchSavedCar()
    }
  }, [user])

  const fetchSavedCar = async () => {
    setLoadingCar(true)
    try {
      const response = await fetch('/api/saved-cars', {
        headers: {
          'x-user-email': user?.email || ''
        }
      })

      if (response.ok) {
        const cars = await response.json()
        // Get the active car or the most recent one
        const activeCar = cars.find((car: SavedCar) => car.isActive) || cars[0]
        setSavedCar(activeCar || null)
      }
    } catch (error) {
      console.error('Failed to fetch saved car:', error)
    } finally {
      setLoadingCar(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!user?.email) {
      setUploadMessage('Please log in first')
      return
    }

    if (!savedCar) {
      setUploadMessage('Please save a car from Performance Calculator or Build Planner first')
      return
    }

    setUploadingImage(true)
    setUploadMessage(null)

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove the data:image/jpeg;base64, prefix
        }
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/upload-car-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          file: base64,
          filename: file.name
        })
      })

      const data = await response.json()

      if (response.ok) {
        setUploadMessage('Image uploaded successfully!')
        setShowImageUploadModal(false)
        // Refresh the saved car data to show the new image
        fetchSavedCar()
      } else {
        setUploadMessage(data.error || 'Failed to upload image')
      }
    } catch (error) {
      setUploadMessage('Network error. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    window.location.href = '/login'
    return null
  }

  const perfUsage = getRemainingUsage(user, 'performance')
  const buildUsage = getRemainingUsage(user, 'build')
  const imageUsage = getRemainingUsage(user, 'image')

  const tools = [
    {
      name: 'Performance Calculator',
      description: 'Estimate your car\'s performance with AI-powered calculations',
      path: '/performance-calculator',
      icon: '⚡',
      usage: perfUsage,
      type: 'performance' as const,
      savedData: savedCar?.performanceData
    },
    {
      name: 'On-Site Generator',
      description: 'Generate custom automotive images and visualizations',
      path: '/w/on-site/embed',
      icon: '🎨',
      usage: imageUsage,
      type: 'image' as const,
      savedData: null // Images are shown in My Car section
    },
    {
      name: 'Build Planner',
      description: 'Plan your next automotive build with expert recommendations',
      path: '/build-planner',
      icon: '🔧',
      usage: buildUsage,
      type: 'build' as const,
      savedData: savedCar?.buildPlanData
    }
  ]

  const planInfo = PLAN_LIMITS[user.planCode as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE
  const isFreePlan = user.planCode === 'FREE'
  const isAdmin = user.planCode === 'ADMIN'

  const handleManageSubscription = async () => {
    if (isAdmin) {
      // Admins don't need to manage subscriptions
      return
    }

    if (isFreePlan) {
      setShowUpgradeModal(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to open billing portal')
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Header />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* My Car Section - Two Separate Containers */}
        {loadingCar ? (
          <div className="bg-secondary overflow-hidden shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-textSecondary">Loading your car...</p>
              </div>
            </div>
          </div>
        ) : savedCar ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left Container - Car Stats */}
            <div className="bg-secondary overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-xl font-semibold text-textPrimary mb-4">{savedCar.name}</h3>

                {/* Car Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Make:</span>
                    <span className="text-textPrimary font-medium">{savedCar.make}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Year:</span>
                    <span className="text-textPrimary font-medium">{savedCar.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Model:</span>
                    <span className="text-textPrimary font-medium">{savedCar.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Trim:</span>
                    <span className="text-textPrimary font-medium">{savedCar.trim}</span>
                  </div>
                </div>

                {/* Performance Highlights */}
                {savedCar.performanceData && (
                  <div className="border-t border-divider pt-4">
                    <h4 className="font-medium text-textPrimary mb-3">Performance Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-textSecondary">0-60 MPH:</span>
                        <span className="text-primary font-bold">
                          {savedCar.performanceData.estimatedPerformance?.zeroToSixty || 'N/A'}s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-textSecondary">WHP:</span>
                        <span className="text-primary font-bold">
                          {savedCar.performanceData.estimatedPerformance?.whp || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Container - Image Upload */}
            <div className="bg-secondary overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h4 className="font-medium text-textPrimary mb-4">Car Image</h4>

                <div className="aspect-video bg-divider rounded-lg overflow-hidden mb-4">
                  {savedCar.imageUrl ? (
                    <img
                      src={savedCar.imageUrl}
                      alt={`${savedCar.year} ${savedCar.make} ${savedCar.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-textSecondary">
                      <div className="text-center">
                        <div className="text-4xl mb-3">📸</div>
                        <p className="text-sm font-medium">Go generate something cool 😉</p>
                        <p className="text-xs mt-1">Use the Image Generator below</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Options */}
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.href = '/w/on-site/embed'}
                    className="w-full bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white py-2 px-4 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Generate Image
                  </button>
                  <button
                    onClick={() => setShowImageUploadModal(true)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                  >
                    Upload Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left Container - No Car Stats */}
            <div className="bg-secondary overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-textPrimary mb-2">No Car Stats</h3>
                  <p className="text-textSecondary text-sm mb-4">
                    Save a performance calculation to see your car's stats here
                  </p>
                  <button
                    onClick={() => window.location.href = '/performance-calculator'}
                    className="bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Calculate Performance
                  </button>
                </div>
              </div>
            </div>

            {/* Right Container - No Image */}
            <div className="bg-secondary overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📸</div>
                  <h3 className="text-lg font-semibold text-textPrimary mb-2">Go generate something cool 😉</h3>
                  <p className="text-textSecondary text-sm mb-4">
                    Create or upload an image of your dream car
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => window.location.href = '/w/on-site/embed'}
                      className="w-full bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white py-2 px-4 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Generate Image
                    </button>
                    <button
                      onClick={() => setShowImageUploadModal(true)}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                    >
                      Upload Image
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tools Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const hasUsage = tool.usage.remaining > 0

            return (
              <div
                key={tool.name}
                className="bg-secondary overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">{tool.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-textPrimary">
                        {tool.name}
                      </h3>
                      <p className="mt-1 text-sm text-textSecondary">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  {/* Show saved data instead of quota */}
                  <div className="mt-4 bg-background rounded-lg p-3">
                    {tool.savedData ? (
                      <div className="text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-textSecondary">Latest Save</span>
                          <span className="text-success text-xs">✓ Saved</span>
                        </div>
                        {tool.type === 'performance' && tool.savedData.estimatedPerformance && (
                          <div className="text-xs text-textSecondary">
                            {tool.savedData.estimatedPerformance.horsepower}HP, {tool.savedData.estimatedPerformance.zeroToSixty}s 0-60
                          </div>
                        )}
                        {tool.type === 'build' && tool.savedData.plan && (
                          <div className="text-xs text-textSecondary line-clamp-2">
                            {tool.savedData.plan.slice(0, 80)}...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-textSecondary">
                        <div className="flex items-center justify-between">
                          <span>No saved data</span>
                          <span className="text-xs">Use tool to save</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Usage indicator */}
                  <div className="mt-3 text-xs text-textSecondary">
                    Usage this month: {tool.usage.used} / {tool.usage.limit}
                  </div>

                  <div className="mt-4">
                    {hasUsage ? (
                      <a
                        href={tool.path}
                        className="w-full bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white py-2 px-4 rounded-md text-sm font-medium text-center block hover:opacity-90 transition-opacity"
                      >
                        Open Tool
                      </a>
                    ) : (
                      <div className="space-y-2">
                        <button
                          disabled
                          className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed"
                        >
                          Quota Exceeded
                        </button>
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-1 px-3 rounded text-xs font-medium"
                        >
                          Upgrade to Continue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Free Plan CTA */}
        {isFreePlan && (
          <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-xl">
            <div className="px-6 py-8 sm:px-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Ready to unlock more?
                  </h3>
                  <p className="mt-2 text-blue-100">
                    Upgrade to get more calculations, builds, and images each month
                  </p>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-md font-semibold"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Slider */}
        <div className="text-center">
          <ImageSlider />
          <div className="mt-6">
            <a
              href="/community"
              className="inline-flex items-center gap-2 text-primary hover:text-[#d82c83] transition-colors font-medium"
            >
              <span>🎨</span>
              View Community Gallery
              <span>→</span>
            </a>
          </div>
        </div>

        <UpgradePlansModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={user.planCode}
        />

        {/* Image Upload Modal */}
        {showImageUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Car Image</h3>
                <button
                  onClick={() => {
                    setShowImageUploadModal(false)
                    setUploadMessage(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file)
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Supports JPG, PNG, WebP files up to 5MB
                </p>
              </div>

              {uploadMessage && (
                <div className={`mb-4 p-3 rounded-md text-sm ${
                  uploadMessage.includes('success')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {uploadMessage}
                </div>
              )}

              {uploadingImage && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Uploading image...</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowImageUploadModal(false)
                    setUploadMessage(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={uploadingImage}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}