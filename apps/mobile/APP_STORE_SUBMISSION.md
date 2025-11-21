# App Store Submission Guide

## Status: Apple Developer Account APPROVED ✅ - Ready to Register App!

**Last Updated:** November 7, 2025

Your TunedUp app is configured and your Apple Developer account was approved this morning! Time to register your app and prepare for submission.

---

## ✅ Completed Setup

### 1. Apple Developer Account
- **Status:** ✅ **APPROVED** (November 7, 2025)
- You can now access App Store Connect and register apps!

### 2. App Icons
- Created all required iOS icon sizes (1024x1024 down to 20x20)
- Located in: `assets/icons/`
- Installed in Xcode project: `ios/TunedUp/Images.xcassets/AppIcon.appiconset/`

### 3. Bundle Identifier
- Updated to: `dev.tunedup.app`
- Changed in:
  - `app.json`
  - iOS native project (via expo prebuild)
  - CocoaPods configuration

### 4. iOS Dependencies
- CocoaPods installed and updated
- All native modules linked
- Production build configuration ready

### 5. Stripe Payment Integration
- ✅ Stripe webhook working correctly
- ✅ Mobile payments functional
- ✅ Plan upgrades tested and working

---

## 📋 Next Steps - YOUR CURRENT STATUS

### ~~Step 1: Wait for Apple Developer Account Approval~~
**Status:** ✅ **COMPLETE** - Approved November 7, 2025!

### Step 2: Register Your App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click the **+** button and select "New App"
3. Fill in the details:
   - **Platform:** iOS
   - **Name:** TunedUp
   - **Primary Language:** English (US)
   - **Bundle ID:** Select `dev.tunedup.app` from dropdown
   - **SKU:** tunedup-app (or any unique identifier)
   - **User Access:** Full Access

### Step 3: Take App Screenshots

You need 3-6 screenshots for the App Store listing. Recommended sizes:
- **iPhone 6.7" (iPhone 15 Pro Max):** 1290 x 2796 pixels
- **iPhone 6.5" (iPhone 11 Pro Max):** 1284 x 2778 pixels

**How to capture:**
1. Run your app: `cd /Users/mystuff/Documents/TunedUp/TunedUpNative && npx expo start`
2. Open in iOS Simulator
3. Take screenshots: `Cmd + S` in simulator
4. Screenshots save to Desktop

**Screens to capture:**
- Home screen with your garage
- Build Planner in action
- Performance Calculator
- Image Generator showing a custom car
- Community feed
- Profile/Settings screen

### Step 4: Build Your iOS App

Once your Apple Developer account is approved:

```bash
cd /Users/mystuff/Documents/TunedUp/TunedUpNative

# Clean any previous builds
cd ios && xcodebuild clean && cd ..

# Open Xcode
open ios/TunedUp.xcworkspace
```

**In Xcode:**

1. **Select Target Device:**
   - At the top, select "Any iOS Device (arm64)" from the device dropdown

2. **Configure Signing:**
   - Click on "TunedUp" project in left sidebar
   - Select "TunedUp" under TARGETS
   - Go to "Signing & Capabilities" tab
   - Check "Automatically manage signing"
   - Select your Team (your Apple Developer account)
   - Verify Bundle Identifier shows: `dev.tunedup.app`

3. **Archive the App:**
   - Menu: Product → Archive
   - Wait for build to complete (5-10 minutes)
   - Archive window will open automatically

4. **Upload to App Store:**
   - In Archive window, click "Distribute App"
   - Select "App Store Connect"
   - Click "Upload"
   - Select "Automatically manage signing"
   - Click "Upload"
   - Wait for upload to complete

### Step 5: Complete App Store Listing

Back in App Store Connect:

1. **App Information:**
   - Category: Utilities or Entertainment
   - Content Rights: You own all rights

2. **Pricing:**
   - Price: Free (with in-app purchases for Stripe subscriptions)
   - Availability: All countries

3. **App Privacy:**
   - Data Collection: Yes (user accounts, payment info via Stripe)
   - Click "Get Started" and answer privacy questionnaire

4. **Version Information:**
   - **Description:** Write compelling app description (see template below)
   - **Keywords:** tuning, car, performance, build, calculator, automotive
   - **Support URL:** https://tunedup.dev
   - **Marketing URL:** (optional) https://tunedup.dev
   - **Promotional Text:** (optional) Short tagline

5. **Screenshots:**
   - Upload your 3-6 screenshots

6. **App Review Information:**
   - **Contact Info:** Your email and phone
   - **Demo Account:** If your app requires login, provide test credentials
   - **Notes:** Mention that the app includes Stripe integration for subscriptions

7. **Version Release:**
   - Select "Automatically release this version"
   - Or "Manually release this version" if you want control

8. **Submit for Review:**
   - Click "Submit for Review"
   - Review typically takes 1-3 days

---

## 📱 App Description Template

```
TunedUp - Your Ultimate Car Performance Companion

Build. Calculate. Create.

TunedUp is the complete toolkit for car enthusiasts and tuners. Whether you're planning your next build, calculating performance metrics, or sharing your dream setup with the community, TunedUp has you covered.

FEATURES:

🔧 Build Planner
Plan your perfect car build with our comprehensive parts selection tool. Choose from hundreds of real parts and see how they come together.

📊 Performance Calculator
Calculate real-time performance metrics including:
• Horsepower & Torque
• 0-60 times
• Quarter mile times
• Top speed estimates

🎨 AI Image Generator
Create stunning visualizations of your dream car using advanced AI technology. Turn your ideas into reality.

👥 Community
Connect with fellow enthusiasts, share your builds, and get inspired by the community's creations.

💾 Save Your Garage
Store unlimited builds and access them anytime, anywhere.

SUBSCRIPTION OPTIONS:
• Free: Access basic features with limited credits
• Pro: Unlimited builds, performance calculations, and AI generations
• Premium: Everything in Pro plus exclusive features

Download TunedUp today and take your car enthusiasm to the next level!
```

---

## 🔑 Important Notes

### Required Apple Developer Account Settings

Before you can upload:
1. Ensure your account is "Active" status
2. Agree to all contracts in App Store Connect
3. Set up banking/tax information for paid features (if applicable)

### Build Version Numbers

- **Version:** 1.0.0 (already set in app.json)
- **Build Number:** 1 (auto-increments with each upload)

### Testing Before Submission

**TestFlight (Recommended):**
After uploading to App Store Connect, you can test via TestFlight:
1. Wait for build to process (30-60 minutes)
2. Go to TestFlight tab in App Store Connect
3. Add yourself as an internal tester
4. Download TestFlight app on your iPhone
5. Test your app before submitting for review

### Common Rejection Reasons (Avoid These!)

1. **Crashes:** Test thoroughly on TestFlight first
2. **Placeholder content:** Make sure all screens have real content
3. **Broken links:** Verify all external links work
4. **Privacy policy:** Ensure it's accessible and complete
5. **Missing demo account:** If app requires login, provide test credentials

---

## 🆘 Troubleshooting

### "Failed to register bundle identifier"
- Go to https://developer.apple.com/account/resources/identifiers/list
- Manually register `dev.tunedup.app`

### "No provisioning profiles found"
- In Xcode, go to Preferences → Accounts
- Select your Apple ID
- Click "Download Manual Profiles"

### Build fails with code signing error
- Ensure "Automatically manage signing" is checked
- Verify your Apple Developer account is active
- Try cleaning: Product → Clean Build Folder (Shift+Cmd+K)

### Upload stuck at "Processing"
- This is normal! Processing takes 30-60 minutes
- You'll receive an email when it's ready

---

## 📞 Support Resources

- **Apple Developer Support:** https://developer.apple.com/contact/
- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Expo Documentation:** https://docs.expo.dev/
- **React Native Docs:** https://reactnative.dev/docs/publishing-to-app-store

---

## 🎉 You're Almost There!

Your app is production-ready. Once your Apple Developer account is approved:
1. Take screenshots (30 minutes)
2. Build and upload (1 hour)
3. Complete App Store listing (1 hour)
4. Submit for review (1-3 days)

**Total timeline: ~3-5 days from now to App Store approval!**

Good luck! 🚀
