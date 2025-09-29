import React, { useState, useEffect } from 'react'

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

export const ImageSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-slide every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  // Show 3 images at a time, with smooth transitions
  const getVisibleImages = () => {
    const visibleImages = []
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % images.length
      visibleImages.push({
        src: images[index],
        index: index
      })
    }
    return visibleImages
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-textPrimary mb-4 text-center">
        Generated with TunedUp
      </h3>
      <div className="relative overflow-hidden">
        <div className="flex gap-4 transition-transform duration-500 ease-in-out">
          {getVisibleImages().map((image) => (
            <div
              key={`${image.index}-${currentIndex}`}
              className="flex-shrink-0 w-1/3"
            >
              <div className="relative group">
                <img
                  src={image.src}
                  alt={`Generated automotive image ${image.index + 1}`}
                  className="w-full h-auto object-contain rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-4 space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-primary' : 'bg-textSecondary'
            }`}
          />
        ))}
      </div>
    </div>
  )
}