import React from 'react';
import { GeneratedImage } from '../types';
import { downloadImage } from '../utils';

interface ImageGalleryProps {
  images: GeneratedImage[];
  isLoading: boolean;
  currentImage?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, isLoading, currentImage }) => {
  const handleDownload = (image: GeneratedImage) => {
    const filename = `tuned-up-${image.id}.png`;
    downloadImage(image.blob, filename);
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
          <button
            type="button"
            className="download-button"
            onClick={() => downloadImage(currentImage, `tuned-up-${Date.now()}.png`)}
          >
            Download PNG
          </button>
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