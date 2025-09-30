import React, { useEffect, useRef } from 'react'

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
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let scrollPosition = 0
    const scrollSpeed = 0.5 // pixels per frame
    const imageWidth = 320 // approximate image width including gap
    const totalWidth = images.length * imageWidth

    const smoothScroll = () => {
      scrollPosition += scrollSpeed

      // Reset position when we've scrolled through all images
      if (scrollPosition >= totalWidth) {
        scrollPosition = 0
      }

      scrollContainer.scrollLeft = scrollPosition
      requestAnimationFrame(smoothScroll)
    }

    const animationFrame = requestAnimationFrame(smoothScroll)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images, ...images]

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-textPrimary mb-4 text-center">
        Generated with TunedUp
      </h3>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-hidden scrollbar-hide"
          style={{ scrollBehavior: 'auto' }}
        >
          {duplicatedImages.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="flex-shrink-0 w-80"
            >
              <div className="relative group">
                <img
                  src={image}
                  alt={`Generated automotive image ${(index % images.length) + 1}`}
                  className="w-full h-auto object-contain rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        {/* Gradient overlays for smooth edges */}
        <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  )
}