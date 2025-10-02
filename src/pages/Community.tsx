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
  const [likingImages, setLikingImages] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000) // Auto-hide after 4 seconds
  }

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
        showToast('Image liked! 🔥', 'success')
      } else {
        // Show error message briefly
        console.error('Failed to like image:', data.error)

        // Show user-friendly error messages
        if (response.status === 401) {
          showToast('Please log in to like images', 'warning')
        } else if (response.status === 400) {
          showToast('You have already liked this image', 'warning')
        } else {
          showToast('Failed to like image. Please try again.', 'error')
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

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
          toast.type === 'success' ? 'bg-success/20 border border-success text-success' :
          toast.type === 'warning' ? 'bg-highlight/20 border border-highlight text-highlight' :
          'bg-error/20 border border-error text-error'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌'}
            </span>
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-lg hover:opacity-70 transition-opacity"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#07fef7] to-[#d82c83] bg-clip-text text-transparent">
            Community Gallery
          </h1>
          <p className="text-xl text-textSecondary mb-8">
            Automotive images created by our community using TunedUp's AI Image Generator
          </p>

          <a
            href="/w/on-site/embed"
            className="bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity inline-block text-center"
          >
            Create & Share Image
          </a>
        </div>


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