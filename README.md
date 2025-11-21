# TunedUp - AI-Powered Automotive Tools

## Project Overview

TunedUp is an AI-powered automotive tool suite for car enthusiasts. It consists of a React Native iOS mobile application and a simple Next.js landing page.

### Features

1. **Performance Calculator** - AI-powered estimates for horsepower, torque, and 0-60 times based on modifications
2. **Build Planner** - Detailed upgrade plans with parts recommendations and cost estimates
3. **AI Image Generator** - Generate stunning visuals of cars using AI
4. **Community Feed** - Share and discover builds from other enthusiasts
5. **Turbo Tycoon** - Idle clicker mini-game for earning tokens

---

## Repository Structure

This is a **monorepo** with the following structure:

```
TunedUp/
├── apps/
│   ├── mobile/          # React Native iOS app (Expo SDK 54)
│   └── web/             # Next.js landing page
├── api/                 # Vercel serverless functions (backend)
│   ├── turbo-tycoon.ts  # Game API endpoint
│   └── lib/             # Shared backend utilities
├── lib/                 # Shared libraries
│   └── turboTycoon/     # Game logic and configuration
├── prisma/              # Database schema (PostgreSQL)
├── assets/              # Shared assets (icons, backgrounds)
├── android/             # Android native configuration
├── ios/                 # iOS native configuration
└── [config files]       # Root-level configuration
```

---

## Tech Stack

### Mobile App ([apps/mobile](apps/mobile))
- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Stack Navigator)
- **State**: Context API (Auth, Quota, ProfileBanner)
- **UI**: React Native core components, Expo Linear Gradient
- **Payments**: Stripe
- **Testing**: Xcode simulator and physical iPhone via USB

### Landing Page ([apps/web](apps/web))
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Backend ([api/](api))
- **Platform**: Vercel serverless functions (Node.js 20.x)
- **Database**: PostgreSQL with Prisma ORM (via Prisma Accelerate)
- **Authentication**: Magic link email auth (JWT tokens via Resend)
- **AI Provider**: Google Gemini API
- **Storage**: Vercel Blob for images
- **Payments**: Stripe

---

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Xcode (for iOS development)
- iOS Simulator or physical iPhone

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd TunedUp
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install mobile app dependencies**
   ```bash
   cd apps/mobile
   npm install
   cd ../..
   ```

4. **Install web app dependencies**
   ```bash
   cd apps/web
   npm install
   cd ../..
   ```

5. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `POSTGRES_URL` - PostgreSQL connection string
   - `PRISMA_DATABASE_URL` - Prisma Accelerate proxy URL
   - `JWT_SECRET` - Secret for JWT token signing
   - `RESEND_API_KEY` - Resend email service API key
   - `GEMINI_API_KEY` - Google Gemini API key
   - `STRIPE_SECRET_KEY` - Stripe secret key
   - `VERCEL_BLOB_TOKEN` - Vercel Blob storage token

---

## Development

### Run the Mobile App

```bash
# Start Expo development server
npm run dev:mobile

# Or run directly on iOS
npm run ios
```

### Run the Landing Page

```bash
# Start Next.js development server
npm run dev:web

# Build for production
npm run build:web

# Start production server
npm run start:web
```

### API Development

API endpoints are in the `/api` directory. They are deployed as Vercel serverless functions.

To test API endpoints locally, use the Vercel CLI:
```bash
vercel dev
```

---

## API Endpoints

The mobile app depends on the following backend endpoints:

### Authentication
- `POST /api/auth?action=send-link` - Send magic link email
- `POST /api/auth?action=verify` - Verify code and get JWT token
- `GET /api/auth?action=me` - Get current user info
- `POST /api/auth?action=logout` - Logout user

### Tools
- `POST /api/performance` - Calculate car performance
- `POST /api/build-plan` - Generate build plan
- `POST /api/generate` - Generate car images

### Community
- `GET /api/community?action=images` - Get community images
- `GET /api/community?action=random` - Get random images
- `POST /api/community?action=like` - Like an image
- `GET /api/community?action=public-profile` - Get public profile
- `POST /api/community?action=upload` - Upload community image

### Profile & Data
- `GET /api/profile?action=quota-info` - Get user's quota info
- `POST /api/profile?action=quota-check` - Check if user can use tool
- `GET /api/profile?action=get-all` - Get all profile data
- `POST /api/profile?action=update-profile` - Update profile
- `GET /api/saved-cars` - Get saved cars
- `POST /api/saved-cars` - Save a car

### Game
- `POST /api/turbo-tycoon` - Turbo Tycoon idle clicker game

**Note:** Only `/api/turbo-tycoon.ts` currently exists in this repo. Other endpoints may be deployed separately or need to be implemented.

---

## Database

The app uses PostgreSQL with Prisma ORM. The schema is defined in [prisma/schema.prisma.turbo](prisma/schema.prisma.turbo).

### Main Tables

- **User** - User accounts with tokens, plans, and profile info
- **VerificationCode** - Magic link verification codes
- **CommunityImage** - User-uploaded car images
- **SavedCars, SavedPerformance, SavedImages** - User's saved data
- **TurboTycoonState** - Game state for Turbo Tycoon
- **TurboPartProgress** - Part upgrades in Turbo Tycoon

---

## Deployment

### Web Landing Page

The landing page is automatically deployed to Vercel when pushing to the main branch.

**Live URL**: [https://www.tunedup.dev](https://www.tunedup.dev)

Configuration is in [vercel.json](vercel.json).

### Mobile App

The iOS app is distributed via the App Store.

**App Store**: [https://apps.apple.com/us/app/tunedup-garage/id6755053244](https://apps.apple.com/us/app/tunedup-garage/id6755053244)

To build for production:
```bash
cd apps/mobile
eas build --platform ios
```

---

## Project History

### Previous Structure

TunedUp originally started as a web-based widget application built with React + Vite. The project has since evolved into:

1. A full-featured native iOS app (primary product)
2. A simple landing page for marketing
3. A robust backend API supporting both

The old web app artifacts have been removed, and the repository has been refactored into a clean monorepo structure.

---

## License

All rights reserved © 2024 TunedUp Garage

---

## Contact & Support

- **App Store**: [TunedUp Garage](https://apps.apple.com/us/app/tunedup-garage/id6755053244)
- **Website**: [www.tunedup.dev](https://www.tunedup.dev)
