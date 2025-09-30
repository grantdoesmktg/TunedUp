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
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')

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

  const handleUpload = async () => {
    if (!uploadFile) return

    setUploading(true)
    setUploadMessage('')

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string

        const response = await fetch('/api/community?action=upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            image: base64,
            description: uploadDescription
          })
        })

        const data = await response.json()

        if (response.ok) {
          setUploadMessage(data.message)
          setUploadFile(null)
          setUploadDescription('')
          setShowUpload(false)
        } else {
          setUploadMessage(data.error || 'Upload failed')
        }
      }
      reader.readAsDataURL(uploadFile)
    } catch (error) {
      setUploadMessage('Upload failed. Please try again.')
    } finally {
      setUploading(false)
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
            onClick={() => setShowUpload(!showUpload)}
            className="bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Share Your Creation
          </button>
        </div>

        {showUpload && (
          <div className="max-w-2xl mx-auto mb-12 bg-secondary p-8 rounded-2xl border border-divider">
            <h2 className="text-2xl font-semibold mb-6 text-textPrimary">Upload Your Image</h2>

            {uploadMessage && (
              <div className={`p-4 rounded-lg mb-6 ${
                uploadMessage.includes('successfully')
                  ? 'bg-success/20 border border-success text-success'
                  : 'bg-error/20 border border-error text-error'
              }`}>
                {uploadMessage}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-textPrimary">
                  Select Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-background border border-divider rounded-lg text-textPrimary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-textPrimary">
                  Description (optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Tell us about your creation..."
                  className="w-full px-4 py-3 bg-background border border-divider rounded-lg text-textPrimary placeholder-textSecondary resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="flex-1 bg-gradient-to-r from-[#07fef7] to-[#d82c83] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <button
                  onClick={() => {
                    setShowUpload(false)
                    setUploadFile(null)
                    setUploadDescription('')
                    setUploadMessage('')
                  }}
                  className="px-6 py-3 border border-divider rounded-lg text-textSecondary hover:text-textPrimary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
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