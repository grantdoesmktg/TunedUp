import { useEffect, useState } from 'react'

export default function AppDownload() {
  const [platform, setPlatform] = useState<'ios' | 'desktop'>('desktop')

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent || (window as any).opera

    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setPlatform('ios')
    } else {
      setPlatform('desktop')
    }
  }, [])

  const handleDownload = () => {
    // Replace with your actual App Store URL once published
    window.location.href = 'https://apps.apple.com/app/tunedup/YOURAPPID'
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center px-4">
      {/* Background gradient effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#07fef7]/20 to-[#d82c83]/20 rounded-full blur-3xl -z-10" />

      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-[#07fef7] to-[#d82c83] rounded-3xl shadow-2xl flex items-center justify-center text-6xl transform hover:scale-105 transition-transform">
            🔧
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#07fef7] to-[#d82c83] bg-clip-text text-transparent">
            TunedUp
          </h1>
          <p className="text-xl md:text-2xl text-textSecondary">
            Your Ultimate Car Performance Companion
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
          <div className="space-y-2">
            <div className="text-4xl">⚡</div>
            <h3 className="font-bold text-textPrimary">Performance Calc</h3>
            <p className="text-sm text-textSecondary">Calculate real-time performance metrics</p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl">🔧</div>
            <h3 className="font-bold text-textPrimary">Build Planner</h3>
            <p className="text-sm text-textSecondary">Plan your perfect car build</p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl">🎨</div>
            <h3 className="font-bold text-textPrimary">AI Generator</h3>
            <p className="text-sm text-textSecondary">Create stunning car images</p>
          </div>
        </div>

        {/* Download Button */}
        {platform === 'ios' && (
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors shadow-lg"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Download on the App Store
          </button>
        )}

        {platform === 'desktop' && (
          <div className="space-y-6">
            <p className="text-textSecondary">
              TunedUp is available on iOS
            </p>
            <a
              href="https://apps.apple.com/app/tunedup/YOURAPPID"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-black text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors shadow-lg"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download on the App Store
            </a>
          </div>
        )}

        {/* QR Code Section (optional) */}
        {platform === 'desktop' && (
          <div className="pt-8 border-t border-divider">
            <p className="text-sm text-textSecondary mb-4">
              Scan with your phone to download
            </p>
            {/* You can add a QR code generator here later */}
            <div className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center">
              <p className="text-gray-400 text-xs text-center px-4">
                QR Code<br/>Coming Soon
              </p>
            </div>
          </div>
        )}

        {/* Footer links */}
        <div className="pt-12 flex gap-6 justify-center text-sm text-textSecondary">
          <a href="/privacy-policy" className="hover:text-primary transition-colors">
            Privacy
          </a>
          <span>•</span>
          <a href="/terms-of-service" className="hover:text-primary transition-colors">
            Terms
          </a>
          <span>•</span>
          <a href="mailto:support@tunedup.dev" className="hover:text-primary transition-colors">
            Support
          </a>
        </div>
      </div>
    </div>
  )
}
