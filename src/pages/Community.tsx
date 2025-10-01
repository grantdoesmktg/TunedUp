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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [customDescription, setCustomDescription] = useState('')
  const [likingImages, setLikingImages] = useState<Set<string>>(new Set())

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
        setSelectedImageIndex(null)
        setCustomDescription('')
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

  const handleSelectImage = (index: number) => {
    setSelectedImageIndex(index)
    setCustomDescription('')
    setShareMessage('')
  }

  const handleConfirmShare = () => {
    if (selectedImageIndex !== null) {
      handleShareRecent(recentImages[selectedImageIndex], customDescription.trim())
    }
  }

  const handleLike = async (imageId: string) => {
    console.log('handleLike called with imageId:', imageId)

    if (likingImages.has(imageId)) {
      console.log('Like already in progress for:', imageId)
      return // Prevent multiple clicks
    }

    console.log('Starting like process for:', imageId)
    setLikingImages(prev => new Set(prev).add(imageId))

    try {
      console.log('Making API request to like image:', imageId)
      const response = await fetch('/api/community?action=like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageId })
      })

      console.log('Like API response status:', response.status)
      const data = await response.json()
      console.log('Like API response data:', data)

      if (response.ok) {
        console.log('Like successful, updating UI with new count:', data.likesCount)
        // Update the local images state with new like count
        setImages(prev => prev.map(img =>
          img.id === imageId
            ? { ...img, likesCount: data.likesCount }
            : img
        ))
      } else {
        // Show error message briefly
        console.error('Failed to like image:', data.error)

        // Show user-friendly error messages
        if (response.status === 401) {
          alert('Please log in to like images')
        } else if (response.status === 400) {
          alert('You have already liked this image')
        } else {
          alert('Failed to like image. Please try again.')
        }
      }
    } catch (error) {
      console.error('Like error:', error)
    } finally {
      console.log('Removing like loading state for:', imageId)
      setLikingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })
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
            ) : selectedImageIndex === null ? (
              <div className="space-y-6">
                <p className="text-textSecondary">Select an image from your recent generations to share with the community:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentImages.map((image, index) => (
                    <div key={index} className="bg-background rounded-lg overflow-hidden border border-divider hover:border-primary transition-colors cursor-pointer">
                      <img
                        src={image.blob}
                        alt="Recent generation"
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          console.error('Grid image failed to load:', image.blob?.substring(0, 100));
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {!image.blob?.startsWith('data:image') && (
                        <div className="w-full h-48 flex items-center justify-center bg-gray-200">
                          <p className="text-gray-500 text-sm">Preview unavailable</p>
                        </div>
                      )}
                      <div className="p-4">
                        <p className="text-sm text-textSecondary mb-3">
                          Generated: {image.timestamp ? new Date(image.timestamp).toLocaleDateString() : 'Recently'}
                        </p>
                        <button
                          onClick={() => handleSelectImage(index)}
                          className="w-full bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        >
                          Select This Image
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowRecentImages(false)
                      setSelectedImageIndex(null)
                      setCustomDescription('')
                      setShareMessage('')
                    }}
                    className="px-6 py-3 border border-divider rounded-lg text-textSecondary hover:text-textPrimary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setSelectedImageIndex(null)}
                    className="text-textSecondary hover:text-textPrimary transition-colors"
                  >
                    ← Back to selection
                  </button>
                  <h3 className="text-lg font-semibold text-textPrimary">Add Description</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-background rounded-lg overflow-hidden border border-divider">
                    <img
                      src={recentImages[selectedImageIndex].blob}
                      alt="Selected image"
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', recentImages[selectedImageIndex].blob?.substring(0, 100));
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully');
                      }}
                    />
                    {!recentImages[selectedImageIndex].blob?.startsWith('data:image') && (
                      <div className="w-full h-64 flex items-center justify-center bg-gray-200">
                        <p className="text-gray-500">Image preview not available</p>
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-sm text-textSecondary">
                        Generated: {recentImages[selectedImageIndex].timestamp ? new Date(recentImages[selectedImageIndex].timestamp).toLocaleDateString() : 'Recently'}
                      </p>
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-gray-400 mt-2 truncate">
                          Debug: {recentImages[selectedImageIndex].blob?.substring(0, 50)}...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-textPrimary">
                        Description for Community
                      </label>
                      <textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="Describe your car generation... (optional)"
                        className="w-full px-4 py-3 bg-background border border-divider rounded-lg text-textPrimary placeholder-textSecondary resize-none focus:border-primary focus:outline-none"
                        rows={4}
                      />
                      <p className="text-xs text-textSecondary mt-2">
                        Leave empty to use a default description based on generation date
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleConfirmShare}
                        disabled={sharing}
                        className="flex-1 bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sharing ? 'Sharing...' : 'Share to Community'}
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(null)}
                        disabled={sharing}
                        className="px-6 py-3 border border-divider rounded-lg text-textSecondary hover:text-textPrimary transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
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
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        {image.description && (
                          <p className="text-textPrimary text-sm mb-2 line-clamp-2">
                            {image.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          console.log('Like button clicked for image:', image.id)
                          handleLike(image.id)
                        }}
                        disabled={likingImages.has(image.id)}
                        className="ml-3 flex flex-col items-center gap-1 text-xs hover:scale-110 transition-all cursor-pointer bg-transparent border-0 p-1 rounded disabled:opacity-50"
                        type="button"
                        title="Like this image"
                      >
                        <span className="text-orange-500 text-lg pointer-events-none">🔥</span>
                        <span className="text-textSecondary font-medium pointer-events-none">
                          {image.likesCount || 0}
                        </span>
                      </button>
                    </div>
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