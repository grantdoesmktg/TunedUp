import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { downloadImage } from '../utils';

interface ImageGalleryProps {
  images: GeneratedImage[];
  isLoading: boolean;
  currentImage?: string;
  user?: any;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, isLoading, currentImage, user }) => {
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDownload = (image: GeneratedImage) => {
    const filename = `tuned-up-${image.id}.png`;
    downloadImage(image.blob, filename);
  };

  const handleUploadToCommunity = async () => {
    if (!currentImage) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch('/api/community?action=upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: currentImage.startsWith('data:') ? currentImage : `data:image/png;base64,${currentImage}`,
          description: description.trim() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setUploadSuccess(true);
        setDescription('');
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="image-gallery">
      {isLoading && (
        <div className="loading-placeholder">
          <div className="loading-spinner"></div>
          <p>Generating your custom car image...</p>
        </div>
      )}
      
      {currentImage && !isLoading && (
        <div className="current-image">
          <img
            src={currentImage.startsWith('data:') ? currentImage : `data:image/png;base64,${currentImage}`}
            alt="Generated car"
            className="main-image"
          />
          <div className="image-actions">
            <button
              type="button"
              className="download-button"
              onClick={() => downloadImage(currentImage, `tuned-up-${Date.now()}.png`)}
            >
              Download PNG
            </button>

            {/* Community Upload Section */}
            <div className="community-upload-section">
              <h4>Share to Community</h4>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for your car (optional)..."
                className="description-input"
                rows={3}
                maxLength={200}
              />
              <div className="character-count">
                {description.length}/200 characters
              </div>

              {uploadSuccess && (
                <div className="upload-success">
                  ✅ Successfully shared to community!
                </div>
              )}

              {uploadError && (
                <div className="upload-error">
                  ❌ {uploadError}
                </div>
              )}

              <button
                type="button"
                className={`upload-button ${isUploading ? 'uploading' : ''}`}
                onClick={handleUploadToCommunity}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Share to Community 🔥'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {images.length > 0 && (
        <div className="gallery-section">
          <h3>Recent Generations</h3>
          <div className="gallery-grid">
            {images.slice(-3).reverse().map((image) => (
              <div key={image.id} className="gallery-item">
                <img 
                  src={image.blob.startsWith('data:') ? image.blob : `data:image/png;base64,${image.blob}`}
                  alt={`Generated on ${new Date(image.timestamp).toLocaleDateString()}`}
                  className="gallery-thumbnail"
                />
                <div className="gallery-item-overlay">
                  <button
                    type="button"
                    className="gallery-download-button"
                    onClick={() => handleDownload(image)}
                    title="Download PNG"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;