# TunedUp - Native iOS Application

## Project Overview

TunedUp is an AI-powered automotive tool suite for car enthusiasts. This is a **React Native (Expo)** iOS application that provides three main tools:

1. **Performance Calculator** - AI-powered estimates for horsepower, torque, and 0-60 times based on modifications
2. **Build Planner** - Detailed upgrade plans with parts recommendations and cost estimates
3. **AI Image Generator** - Generate stunning visuals of cars using AI image generation

## Project History & Context

### Web App (Deprecated)
- **Location**: `/Users/mystuff/Documents/TunedUp/`
- **Status**: ⚠️ **DEPRECATED** - No longer actively developed
- **Technology**: React + Vite web app with iframe widgets
- **Why Deprecated**: We pivoted from a web-based widget approach to a full native iOS application for better user experience and performance

The web app still exists in the codebase and represents the **general scope and functionality** that we're building into the native app, but all active development is now on the iOS application.

### Native iOS App (Current Focus)
- **Location**: `/Users/mystuff/Documents/TunedUpNative/`
- **Status**: ✅ **ACTIVE DEVELOPMENT**
- **Technology**: React Native with Expo (SDK 54)
- **Testing**: Xcode simulator and physical iPhone via USB connection
- **Backend**: Shared backend API at `tunedup.dev` (also handles web app)

## Tech Stack

### Frontend (Native App)
- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Stack Navigator)
- **UI Components**: React Native core components, Expo Linear Gradient
- **Image Handling**: expo-file-system, expo-media-library
- **Forms**: @react-native-picker/picker for dropdowns

### Backend (Shared)
- **Platform**: Vercel (Node.js serverless functions)
- **AI Provider**: Google Gemini API (gemini-2.0-flash-exp, gemini-2.5-flash-image-preview)
- **Database**: Prisma + PostgreSQL (via Prisma Accelerate)
- **Authentication**: Magic link email auth (via Resend)
- **Storage**: Vercel Blob for image storage
- **Payments**: Stripe for premium subscriptions

### Development Tools
- **IDE**: VS Code with Claude Code
- **Build Tool**: Xcode (for iOS builds)
- **Testing**: Physical iPhone via USB, Xcode simulator
- **Version Control**: Git

## Project Structure

```
/Users/mystuff/Documents/
├── TunedUp/                          # ⚠️ DEPRECATED WEB APP
│   ├── api/                          # Backend API (ACTIVE - shared with native)
│   │   ├── performance.ts            # Performance calculator endpoint
│   │   ├── build-plan.ts             # Build planner endpoint
│   │   └── generate.ts               # Image generation endpoint
│   ├── lib/                          # Backend utilities
│   │   ├── quota.js                  # Usage quota management
│   │   ├── analytics.js              # Tool usage logging
│   │   └── promotions.js             # Promo code system
│   ├── performance-calculator/       # Web widget (deprecated)
│   └── prisma/                       # Database schema
│       └── schema.prisma             # User, Build, Analytics tables
│
└── TunedUpNative/                    # ✅ ACTIVE iOS APP
    ├── src/
    │   ├── screens/                  # Main app screens
    │   │   ├── HomeScreen.tsx        # Landing page with tool cards
    │   │   ├── ToolsScreen.tsx       # Tools list
    │   │   ├── CommunityScreen.tsx   # Community feed
    │   │   ├── ProfileScreen.tsx     # User profile & settings
    │   │   ├── LoginScreen.tsx       # Magic link login
    │   │   ├── VerifyCodeScreen.tsx  # 6-digit code verification
    │   │   ├── PerformanceCalculatorScreen.tsx
    │   │   ├── PerformanceResultsScreen.tsx
    │   │   ├── BuildPlannerScreen.tsx
    │   │   ├── BuildPlanResultsScreen.tsx
    │   │   ├── ImageGeneratorScreen.tsx
    │   │   └── ImageResultsScreen.tsx
    │   ├── navigation/
    │   │   └── AppNavigator.tsx      # Root, Stack, Tab navigators
    │   ├── contexts/
    │   │   └── AuthContext.tsx       # JWT auth state management
    │   ├── services/
    │   │   └── api.ts                # API client with all endpoints
    │   ├── theme/
    │   │   └── colors.ts             # App color theme
    │   └── types/
    │       └── index.ts              # TypeScript interfaces
    ├── App.tsx                       # Root component with AuthProvider
    ├── app.json                      # Expo configuration
    └── package.json                  # Dependencies
```

## Features & Functionality

### 1. Performance Calculator
- **Input**: Car make, model, year, trim, modifications
- **Output**: Stock vs modified HP/WHP/0-60 times with AI explanation
- **Backend**: `/api/performance` using Gemini 2.0 Flash
- **Quota**: Free tier 3/month, PLUS tier 10/month, PRO 15/month, ULTRA 25/month

### 2. Build Planner
- **Input**: Car specs + build goal (e.g., "$5000 power-focused build")
- **Output**: Parts list with pricing (Parts/DIY/Professional), timeframe, difficulty, warnings
- **Backend**: `/api/build-plan` using Gemini 2.0 Flash
- **Quota**: Same as Performance Calculator

### 3. AI Image Generator
- **Input**: Car specs + scene settings (20 locations, 4 times, 4 styles, 10 palettes)
- **Output**: AI-generated car image (1024x1024)
- **Backend**: `/api/generate` using Gemini 2.5 Flash Image
- **Features**: Save to photos, share, de-badging, chrome delete, add model
- **Quota**: Free tier 5/month, PLUS 25/month, PRO 60/month, ULTRA 100/month

### 4. Community Feed
- **Display**: User-submitted car photos and builds
- **Backend**: Fetches from `/api/community`
- **Features**: Scroll through community content

### 5. User Authentication
- **Method**: Magic link email (passwordless)
- **Flow**: Email → 6-digit code → JWT token → AsyncStorage
- **Backend**: `/api/auth/send-link`, `/api/auth/verify/[token]`
- **Plans**: FREE, PLUS ($9.99), PRO ($19.99), ULTRA ($29.99)

### 6. Usage Quota System
- **Storage**: PostgreSQL via Prisma
- **Tracking**: Per-user monthly limits with auto-reset
- **Anonymous**: Currently unlimited (TODO: device fingerprinting)
- **Backend**: `lib/quota.js` - checkQuota, incrementUsage

## Navigation Structure

```
RootNavigator (Stack)
├── MainTabs (Bottom Tabs)
│   ├── Home Tab → HomeScreen
│   ├── Tools Tab → ToolsScreen
│   ├── Community Tab → CommunityScreen
│   └── Profile Tab → ProfileScreen
├── Login (Modal) → LoginScreen
├── VerifyCode (Modal) → VerifyCodeScreen
├── PerformanceCalculator (Modal) → PerformanceCalculatorScreen
├── PerformanceResults (Modal) → PerformanceResultsScreen
├── BuildPlanner (Modal) → BuildPlannerScreen
├── BuildPlanResults (Modal) → BuildPlanResultsScreen
├── ImageGenerator (Modal) → ImageGeneratorScreen
└── ImageResults (Modal) → ImageResultsScreen
```

## Data Flow

### Authentication Flow
1. User enters email → `authAPI.sendMagicLink(email)`
2. User receives email with 6-digit code
3. User enters code → `authAPI.verifyCode(email, code)`
4. Backend returns JWT token
5. Token stored in AsyncStorage → `@auth_token`
6. Token sent as `Authorization: Bearer <token>` on all API calls
7. `authAPI.getMe()` fetches user data (email, planCode, usage counts)

### Tool Usage Flow
1. User fills form → Clicks "Generate/Calculate"
2. Check local JWT token → Get user email (if logged in)
3. API call with `x-user-email` header
4. Backend checks quota via `checkQuota(email, toolType)`
5. If allowed: Process with Gemini AI → `incrementUsage(email, toolType)`
6. Return results → Navigate to results screen
7. Call `refreshUser()` to update usage counts in UI

### Anonymous User Flow
- No JWT token → Empty `x-user-email` header
- Backend allows unlimited usage (for now)
- TODO: Implement device fingerprinting for anonymous quota

## Environment Variables

### Backend (`/TunedUp/.env.local`)
```bash
GEMINI_API_KEY=              # Google Gemini API key
DATABASE_URL=                # Prisma Accelerate connection
DIRECT_URL=                  # Direct PostgreSQL connection
JWT_SECRET=                  # JWT signing secret
RESEND_API_KEY=              # Email service for magic links
STRIPE_SECRET_KEY=           # Stripe payments
STRIPE_WEBHOOK_SECRET=       # Stripe webhook signature
BLOB_READ_WRITE_TOKEN=       # Vercel Blob storage
```

### Native App
- No environment variables needed
- All API calls go to `https://tunedup.dev`
- API key stored in backend only

## Development Workflow

### Starting Development
```bash
cd /Users/mystuff/Documents/TunedUpNative
npm install
npx expo start
```

### Building for iOS (Xcode)
1. Connect iPhone via USB
2. Open Xcode project: `/Users/mystuff/Documents/TunedUpNative/ios/TunedUpNative.xcworkspace`
3. Select your iPhone as build target
4. Click Run (▶️)
5. App installs and launches on physical device

### Testing Changes
1. Make code changes in VS Code
2. Metro bundler auto-reloads
3. Changes appear on phone automatically (Fast Refresh)
4. For native changes: Rebuild in Xcode

### Backend Development
```bash
cd /Users/mystuff/Documents/TunedUp
npm run dev          # Start Vercel dev server (localhost:3000)
npx prisma studio    # Open database GUI (localhost:5555)
```

## Database Schema

### User Table
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  planCode      String   @default("FREE")  // FREE, PLUS, PRO, ULTRA, ADMIN
  perfUsed      Int      @default(0)       // Performance calculations used
  buildUsed     Int      @default(0)       // Build plans used
  imageUsed     Int      @default(0)       // Images generated
  communityUsed Int      @default(0)       // Community posts
  resetDate     DateTime @default(now())   // Monthly reset date
  stripeCustomerId String?
  createdAt     DateTime @default(now())
}
```

### Build Table
```prisma
model Build {
  id          String   @id @default(cuid())
  userEmail   String
  carDetails  Json     // Make, model, year, etc.
  results     Json     // AI results
  createdAt   DateTime @default(now())
}
```

### Analytics Table
```prisma
model Analytics {
  id          String   @id @default(cuid())
  tool        String   // "performance", "build", "image"
  userEmail   String?
  fingerprint String?
  success     Boolean
  error       String?
  timestamp   DateTime @default(now())
}
```

## Known Issues & TODOs

### High Priority
- [ ] **Anonymous user quota tracking**: Implement device fingerprinting to limit anonymous users (1 perf, 1 build, 3 images)
- [ ] **Image generation testing**: Gemini 2.5 Flash Image is experimental, may need fallback
- [ ] **Community screen**: Currently just displays data, needs post creation flow

### Medium Priority
- [ ] **Build saving**: Allow users to save/load build plans (like web app)
- [ ] **Profile editing**: Add ability to edit profile picture, banner, bio
- [ ] **Payment integration**: Implement Stripe checkout flow for plan upgrades
- [ ] **Push notifications**: Notify users when quota resets monthly

### Low Priority
- [ ] **Dark mode**: Add theme switcher
- [ ] **Offline mode**: Cache recent results for offline viewing
- [ ] **Share to social**: Deep link to share results on Twitter/Instagram

## API Endpoints Reference

### Authentication
- `POST /api/auth/send-link` - Send magic link email
- `GET /api/auth/verify/[token]` - Verify code and return JWT
- `GET /api/auth/me` - Get current user info (requires JWT)
- `POST /api/auth/logout` - Invalidate JWT token

### Tools
- `POST /api/performance` - Calculate performance (requires car input)
- `POST /api/build-plan` - Generate build plan (requires vehicle spec)
- `POST /api/generate` - Generate AI image (requires prompt spec)

### Community
- `GET /api/community` - Fetch community posts
- `POST /api/community` - Create new post (requires JWT)

### Payments
- `POST /api/stripe/create-checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe events

## Color Theme

```typescript
colors = {
  background: '#0A0E27',      // Dark navy
  primary: '#FF6B35',         // Orange accent
  secondary: '#1A1F3A',       // Lighter navy
  textPrimary: '#FFFFFF',     // White
  textSecondary: '#8B92B0',   // Light gray
  divider: '#2A2F4A',         // Border color
  success: '#4CAF50',         // Green
  error: '#F44336',           // Red
  performance: {
    start: '#FF6B35',
    end: '#FF8C42',
  },
  build: {
    start: '#6C5CE7',
    end: '#A29BFE',
  },
  image: {
    start: '#00B894',
    end: '#55EFC4',
  },
}
```

## Package Dependencies

### Core
- `expo` - Expo SDK framework
- `react` - React library
- `react-native` - Native components

### Navigation
- `@react-navigation/native` - Navigation core
- `@react-navigation/bottom-tabs` - Tab navigator
- `@react-navigation/native-stack` - Stack navigator

### UI & Styling
- `expo-linear-gradient` - Gradient backgrounds
- `@react-native-picker/picker` - Dropdown pickers

### Storage & Media
- `@react-native-async-storage/async-storage` - JWT storage
- `expo-file-system` - File operations
- `expo-media-library` - Save to photo library

### API
- Custom API client using `fetch()` - No external library

## Testing Checklist

### Before Each Test Build
- [ ] Kill any running Metro bundlers: `lsof -ti:8081 | xargs kill -9`
- [ ] Clear Metro cache: `npx expo start --clear`
- [ ] Clean Xcode build: Product → Clean Build Folder
- [ ] Rebuild in Xcode

### Test Coverage Needed
- [ ] Performance Calculator: Stock & modified calculations
- [ ] Build Planner: Multiple budget levels ($5k, $10k, $20k+)
- [ ] Image Generator: All 20 locations, all styles
- [ ] Login flow: Magic link email delivery
- [ ] Quota limits: Test QUOTA_EXCEEDED errors
- [ ] Anonymous users: Unlimited usage (for now)
- [ ] Profile screen: Usage display, plan upgrade CTA

## Support & Resources

- **Backend API**: `https://tunedup.dev`
- **Database**: Prisma Studio at `localhost:5555`
- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **Gemini API**: https://ai.google.dev/docs

## Notes for AI Assistants

### Important Context
1. **Web app is deprecated** - Don't suggest changes to `/TunedUp/` frontend code
2. **Backend is shared** - API changes affect both web and native apps
3. **Test on real device** - Simulator can't test camera, notifications, etc.
4. **Gemini API is used** - Not OpenAI (despite what old docs say)

### Common Issues
- **"No script URL"**: Metro bundler not running → `npx expo start`
- **Module not found**: Run `npm install` in TunedUpNative directory
- **Xcode build fails**: Clean build folder and rebuild
- **Changes not appearing**: Clear Metro cache with `--clear` flag

### Code Style
- TypeScript strict mode enabled
- Use functional components with hooks
- Props drilling for state (no Redux/MobX)
- Async/await for API calls (no .then chains)
- Color constants from `theme/colors.ts`
