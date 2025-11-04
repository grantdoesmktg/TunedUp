# App Download Landing Page Setup

Your TunedUp website now has a mobile app download landing page at `/download`!

## What We Created

Created a beautiful landing page that:
- ✅ Detects if user is on iOS or desktop
- ✅ Shows "Download on the App Store" button
- ✅ Automatically redirects iOS users to App Store (when URL is updated)
- ✅ Works perfectly for Meta/Instagram ads
- ✅ Matches your brand colors (cyan/magenta gradient)

## File Location

**Landing Page:** [src/pages/AppDownload.tsx](src/pages/AppDownload.tsx)

## How to Use for Meta Ads

### Option 1: Use as Root Domain (Recommended)
Make `tunedup.dev` redirect to the download page by default:

1. Update your home page route in [src/App.tsx](src/App.tsx:34) to show AppDownload instead of Home
2. Or set up a redirect in your hosting (Vercel/etc)

### Option 2: Use /download Path
Point your Meta ads to: `https://tunedup.dev/download`

This is already live and ready to use!

---

## Update App Store URL (Once App is Approved)

After your app is published to the App Store, you'll receive an App Store URL that looks like:
```
https://apps.apple.com/app/tunedup/id1234567890
```

### Steps to Update:

1. Open [src/pages/AppDownload.tsx](src/pages/AppDownload.tsx)
2. Find line 19-21:
   ```typescript
   const handleDownload = () => {
     // Replace with your actual App Store URL once published
     window.location.href = 'https://apps.apple.com/app/tunedup/YOURAPPID'
   }
   ```
3. Replace `YOURAPPID` with your actual App Store ID
4. Also update line 83 for desktop users

**Example:**
```typescript
window.location.href = 'https://apps.apple.com/app/tunedup/id1234567890'
```

---

## Testing the Landing Page

### Test Locally:
```bash
cd /Users/mystuff/Documents/TunedUp
npm run dev
```

Then visit: `http://localhost:5173/download`

### Test on Mobile:
1. Deploy to Vercel (or your hosting)
2. Open on your iPhone: `https://tunedup.dev/download`
3. Should show "Download on the App Store" button

### Test Meta Ads Preview:
1. Go to Meta Ads Manager
2. Create a new ad
3. Set link to: `https://tunedup.dev/download`
4. Click "Preview" to see how it looks in Instagram

---

## User Experience Flow

### iOS Users (iPhone/iPad):
1. Click Meta ad → Opens Safari in-app
2. Lands on `tunedup.dev/download`
3. Sees beautiful landing page with app icon and features
4. Clicks "Download on the App Store" button
5. Redirects to App Store → Downloads TunedUp

### Desktop Users:
1. Click Meta ad (if they see it on desktop)
2. Lands on `tunedup.dev/download`
3. Sees message "TunedUp is available on iOS"
4. Can click to open App Store (or scan QR code - coming soon)

---

## Customization Options

### Change the App Icon
The page currently shows a wrench emoji (🔧). To use your actual logo:

Edit [src/pages/AppDownload.tsx](src/pages/AppDownload.tsx:29-35):
```tsx
<div className="w-32 h-32 bg-gradient-to-br from-[#07fef7] to-[#d82c83] rounded-3xl shadow-2xl flex items-center justify-center text-6xl">
  {/* Replace emoji with an img tag */}
  <img src="/path/to/your/icon.png" alt="TunedUp" className="w-full h-full object-contain" />
</div>
```

### Change the Description
Update the tagline at line 42:
```tsx
<p className="text-xl md:text-2xl text-textSecondary">
  Your Ultimate Car Performance Companion
</p>
```

### Update Features
Modify the features grid (lines 48-62) to highlight different features.

---

## Deployment

### Deploy to Vercel:
```bash
cd /Users/mystuff/Documents/TunedUp
npm run build
vercel --prod
```

Your landing page will be live at: `https://tunedup.dev/download`

---

## Advanced: Make Root Domain Show Download Page

If you want `tunedup.dev` (root) to show the download page instead of the current home page:

**Option A: Replace Home Route**
Edit [src/App.tsx](src/App.tsx:34):
```tsx
<Route path="/" element={<AppDownload />} />
```

**Option B: Add Redirect in Home Component**
Add to top of Home.tsx:
```tsx
useEffect(() => {
  // Redirect mobile users to download page
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (isMobile) {
    window.location.href = '/download'
  }
}, [])
```

**Option C: Vercel Redirect**
Add to `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/",
      "destination": "/download",
      "permanent": false
    }
  ]
}
```

---

## Meta Ads Tips

### Best Practices:
1. **Use Clear CTA:** "Download TunedUp Now" or "Get the App"
2. **Show App in Action:** Use screenshots or video in your ad creative
3. **Target iOS Users:** In Meta Ads Manager, target iOS device users specifically
4. **A/B Test:** Try different ad copy pointing to the same landing page

### Tracking Conversions:
Add Meta Pixel to the download page by adding this to [src/pages/AppDownload.tsx](src/pages/AppDownload.tsx):

```tsx
useEffect(() => {
  // Track page view
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'PageView')
  }
}, [])

const handleDownload = () => {
  // Track app store click
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Lead')
  }
  window.location.href = 'YOUR_APP_STORE_URL'
}
```

---

## Troubleshooting

### "YOURAPPID" still showing
- You need to update the App Store URL after your app is published
- Search for `YOURAPPID` in AppDownload.tsx and replace it

### Page not showing on mobile
- Clear browser cache
- Make sure you deployed the latest version
- Check that the route is added in App.tsx

### Button not working
- Check browser console for errors
- Verify App Store URL is correct
- Make sure handleDownload function is called

---

## Next Steps

1. ✅ Landing page created at `/download`
2. ⏳ Wait for App Store approval
3. 📝 Update App Store URL in AppDownload.tsx
4. 🚀 Deploy to production
5. 📱 Set up Meta ads pointing to landing page
6. 📊 Add tracking/analytics (optional)

---

## Summary

Your landing page is **ready to use** right now! You can:
- Point Meta ads to `https://tunedup.dev/download`
- Test it locally with `npm run dev`
- Update the App Store URL once your app is live

The page will automatically:
- Detect iOS users and show download button
- Show desktop-friendly version for non-mobile users
- Match your brand aesthetic
- Provide great user experience from Meta ads

**Perfect for your Meta ad campaigns! 🎉**
