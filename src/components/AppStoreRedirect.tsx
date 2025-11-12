import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const APP_STORE_URL = 'https://apps.apple.com/us/app/tunedup-garage/id6755053244';

const AppStoreRedirect = () => {
  const location = useLocation();
  const [shouldShow, setShouldShow] = useState(false);

  // Pages that should NOT show the overlay
  const allowedPaths = ['/terms-of-service', '/privacy-policy'];

  // Detect if user is on a mobile device
  const isMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  };

  useEffect(() => {
    // Check if current path is allowed
    const isAllowed = allowedPaths.includes(location.pathname);

    // If on mobile and not on an allowed path, redirect immediately to App Store
    if (!isAllowed && isMobileDevice()) {
      window.location.href = APP_STORE_URL;
      return;
    }

    setShouldShow(!isAllowed);
  }, [location.pathname]);

  if (!shouldShow) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 15, 35, 0.98)',
        backdropFilter: 'blur(10px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '24px',
          padding: '48px 32px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            width: '100px',
            height: '100px',
            margin: '0 auto 24px',
            background: 'linear-gradient(45deg, #07fef7, #d82c83)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
          }}
        >
          🏁
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #07fef7, #d82c83)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
          }}
        >
          TunedUp Garage
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '18px',
            color: '#e5e7eb',
            marginBottom: '32px',
            lineHeight: '1.6',
          }}
        >
          The web version has been deprecated. Download our new mobile app for the best experience!
        </p>

        {/* Features */}
        <div
          style={{
            textAlign: 'left',
            marginBottom: '32px',
            padding: '24px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '16px',
          }}
        >
          <div style={{ color: '#07fef7', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
            NEW IN THE APP:
          </div>
          <div style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.8' }}>
            • AI-Powered Performance Calculator<br />
            • Advanced Build Planner<br />
            • Custom Car Image Generator<br />
            • Community Feed & Profiles<br />
            • Save Your Builds & More
          </div>
        </div>

        {/* Download Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* App Store Button */}
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '16px 32px',
              background: '#000000',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1a1a1a';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#000000';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Download on the App Store
            </div>
          </a>

          {/* Google Play Button - Coming Soon */}
          <div
            style={{
              padding: '16px 32px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#6b7280',
              borderRadius: '12px',
              fontSize: '14px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            Android Version Coming Soon
          </div>
        </div>

        {/* Footer Links */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px' }}>
            <a
              href="/privacy-policy"
              style={{ color: '#9ca3af', textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#07fef7'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              Privacy Policy
            </a>
            <span style={{ color: '#4b5563' }}>•</span>
            <a
              href="/terms-of-service"
              style={{ color: '#9ca3af', textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#07fef7'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppStoreRedirect;
