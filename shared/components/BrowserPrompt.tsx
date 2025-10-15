import React, { useState, useEffect } from 'react';

export const BrowserPrompt: React.FC = () => {
  const [showInAppPrompt, setShowInAppPrompt] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || '';

    // Detect platform
    const iOS = /iPhone|iPad|iPod/.test(ua);
    const android = /Android/.test(ua);
    setIsIOS(iOS);
    setIsAndroid(android);

    // Detect in-app browser (Instagram, Facebook, TikTok, etc.)
    const isInAppBrowser =
      ua.includes('FBAN') ||
      ua.includes('FBAV') ||
      ua.includes('Instagram') ||
      ua.includes('FB_IAB') ||
      ua.includes('FBIOS') ||
      ua.includes('TikTok');

    // Check if opened with external browser parameter
    const params = new URLSearchParams(window.location.search);
    const forceExternal = params.get('openExternalBrowser') === '1';

    if (isInAppBrowser || forceExternal) {
      setShowInAppPrompt(true);
    } else if ((iOS || android) && !isStandalone()) {
      // Show install prompt for mobile users not in standalone mode
      // Only show after dismissing in-app prompt or if not in-app
      const dismissed = localStorage.getItem('tunedup_install_prompt_dismissed');
      if (!dismissed && !isInAppBrowser) {
        // Delay showing install prompt slightly
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    }

    // Listen for PWA install prompt (Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Check if app is in standalone mode (already installed)
  const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('tunedup_install_prompt_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt for Android Chrome
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowInstallPrompt(false);
        localStorage.setItem('tunedup_install_prompt_dismissed', 'true');
      }

      setDeferredPrompt(null);
    }
  };

  const copyLink = () => {
    const url = window.location.href.replace('?openExternalBrowser=1', '');
    navigator.clipboard.writeText(url);
    alert('✅ Link copied! Paste it in Safari or Chrome');
  };

  if (showInAppPrompt) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
        color: 'white'
      }}>
        <button
          onClick={() => setShowInAppPrompt(false)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)'
          }}
        >
          ×
        </button>
        <div style={{
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚀</div>
          <h1 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: 'bold' }}>
            One More Step!
          </h1>
          <p style={{ fontSize: '18px', marginBottom: '30px', opacity: 0.95 }}>
            For the best experience, please open TunedUp in your browser:
          </p>

          {isIOS && (
            <ol style={{
              textAlign: 'left',
              fontSize: '16px',
              lineHeight: '1.8',
              background: 'rgba(255,255,255,0.1)',
              padding: '20px 20px 20px 40px',
              borderRadius: '12px',
              marginBottom: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <li>Tap the <strong>⋯</strong> menu (top right)</li>
              <li>Select <strong>"Open in Safari"</strong></li>
              <li>Enjoy full functionality!</li>
            </ol>
          )}

          {isAndroid && (
            <ol style={{
              textAlign: 'left',
              fontSize: '16px',
              lineHeight: '1.8',
              background: 'rgba(255,255,255,0.1)',
              padding: '20px 20px 20px 40px',
              borderRadius: '12px',
              marginBottom: '24px',
              backdropFilter: 'blur(10px)'
            }}>
              <li>Tap the <strong>⋮</strong> menu (top right)</li>
              <li>Select <strong>"Open in Chrome"</strong> or <strong>"Open in Browser"</strong></li>
              <li>Enjoy full functionality!</li>
            </ol>
          )}

          <button
            onClick={copyLink}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            📋 Copy Link
          </button>

          <p style={{
            marginTop: '20px',
            fontSize: '14px',
            opacity: 0.8
          }}>
            Then paste the link in {isIOS ? 'Safari' : 'Chrome'}
          </p>

          <button
            onClick={() => setShowInAppPrompt(false)}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              fontSize: '14px',
              background: 'transparent',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Continue Anyway (Not Recommended)
          </button>
        </div>
      </div>
    );
  }

  if (showInstallPrompt) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        background: 'linear-gradient(to right, #07fef7, #d82c83)',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        zIndex: 9999,
        animation: 'slideUp 0.3s ease-out',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <button
          onClick={dismissInstallPrompt}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255,255,255,0.3)',
            border: 'none',
            color: 'white',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>

        <div style={{ color: 'white' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📱</div>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            Add TunedUp to Your Home Screen
          </h3>
          <p style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.95 }}>
            Get instant access and a better experience!
          </p>

          {isIOS && (
            <ol style={{
              fontSize: '14px',
              lineHeight: '1.6',
              paddingLeft: '20px',
              marginBottom: '12px'
            }}>
              <li>Tap the <strong>Share</strong> button (bottom of screen)</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> in the top right</li>
            </ol>
          )}

          {isAndroid && (
            <ol style={{
              fontSize: '14px',
              lineHeight: '1.6',
              paddingLeft: '20px',
              marginBottom: '12px'
            }}>
              <li>Tap the <strong>⋮</strong> menu (top right)</li>
              <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
              <li>Tap <strong>"Add"</strong> or <strong>"Install"</strong></li>
            </ol>
          )}

          <p style={{ fontSize: '12px', opacity: 0.8 }}>
            ✨ Works offline • 🚀 Faster loading • 📲 App-like experience
          </p>

          {isAndroid && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: 'rgba(255,255,255,0.9)',
                color: '#d82c83',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              📲 Install Now
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};
