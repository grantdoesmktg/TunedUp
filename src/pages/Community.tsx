import React, { useState, useEffect } from 'react'
import { Header } from '../../shared/components/Header'
import { Footer } from '../../shared/components/Footer'

interface CommunityImage {
  id: string
  imageUrl: string
  description?: string
  likesCount: number
  createdAt: string
  userEmail: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

export default function Community() {
  const [images, setImages] = useState<CommunityImage[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showRecentImages, setShowRecentImages] = useState(false)
  const [recentImages, setRecentImages] = useState<any[]>([])
  const [sharing, setSharing] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  const fetchImages = async (page: number = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/community?action=images&page=${page}&limit=12`)
      const data = await response.json()

      if (response.ok) {
        setImages(data.images)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch community images:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages(currentPage)
  }, [currentPage])

  const fetchRecentImages = () => {
    try {
      // Get recent images from localStorage (from image generator)
      const imageHistoryKey = 'tunedup_image_history'
      const storedHistory = localStorage.getItem(imageHistoryKey)

      if (storedHistory) {
        const history = JSON.parse(storedHistory)
        setRecentImages(Array.isArray(history) ? history.slice(-5) : []) // Last 5 images
      } else {
        setRecentImages([])
      }
    } catch (error) {
      console.error('Failed to fetch recent images:', error)
      setRecentImages([])
    }
  }

  const handleShareRecent = async (imageData: any, description: string = '') => {
    setSharing(true)
    setShareMessage('')

    try {
      const response = await fetch('/api/community?action=upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageData.blob,
          description: description || `Generated car image: ${imageData.timestamp ? new Date(imageData.timestamp).toLocaleDateString() : 'Recent'}`
        })
      })

      const data = await response.json()

      if (response.ok) {
        setShareMessage(data.message)
        setShowRecentImages(false)
        // Refresh images
        fetchImages(currentPage)
      } else {
        setShareMessage(data.error || 'Share failed')
      }
    } catch (error) {
      setShareMessage('Share failed. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#07fef7] to-[#d82c83] bg-clip-text text-transparent">
            Community Gallery
          </h1>
          <p className="text-xl text-textSecondary mb-8">
            Automotive images created by our community using TunedUp's AI Image Generator
          </p>

          <button
            onClick={() => {
              setShowRecentImages(!showRecentImages)
              if (!showRecentImages) {
                fetchRecentImages()
              }
            }}
            className="bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Share Recent Generation
          </button>
        </div>

        {showRecentImages && (
          <div className="max-w-4xl mx-auto mb-12 bg-secondary p-8 rounded-2xl border border-divider">
            <h2 className="text-2xl font-semibold mb-6 text-textPrimary">Share Recent Generations</h2>

            {shareMessage && (
              <div className={`p-4 rounded-lg mb-6 ${
                shareMessage.includes('successfully')
                  ? 'bg-success/20 border border-success text-success'
                  : 'bg-error/20 border border-error text-error'
              }`}>
                {shareMessage}
              </div>
            )}

            {recentImages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-textSecondary">No recent generations found. Create some images with the AI Image Generator first!</p>
                <a
                  href="/w/on-site/embed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-6 py-3 bg-primary text-background rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Generate Images
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-textSecondary">Select an image from your recent generations to share with the community:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentImages.map((image, index) => (
                    <div key={index} className="bg-background rounded-lg overflow-hidden border border-divider">
                      <img
                        src={image.blob}
                        alt="Recent generation"
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <p className="text-sm text-textSecondary mb-3">
                          Generated: {image.timestamp ? new Date(image.timestamp).toLocaleDateString() : 'Recently'}
                        </p>
                        <button
                          onClick={() => handleShareRecent(image)}
                          disabled={sharing}
                          className="w-full bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sharing ? 'Sharing...' : 'Share This Image'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowRecentImages(false)
                      setShareMessage('')
                    }}
                    className="px-6 py-3 border border-divider rounded-lg text-textSecondary hover:text-textPrimary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-textSecondary">Loading community images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-textSecondary text-lg">No community images yet. Be the first to share!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image) => (
                <div key={image.id} className="bg-secondary rounded-xl overflow-hidden border border-divider hover:border-primary transition-colors">
                  <div className="aspect-square">
                    <img
                      src={image.imageUrl}
                      alt={image.description || 'Community image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    {image.description && (
                      <p className="text-textPrimary text-sm mb-2 line-clamp-2">
                        {image.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-xs text-textSecondary">
                      <span>by {image.userEmail}</span>
                      <span>{formatDate(image.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 border border-divider rounded-lg text-textSecondary hover:text-textPrimary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <span className="text-textSecondary">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 border border-divider rounded-lg text-textSecondary hover:text-textPrimary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}