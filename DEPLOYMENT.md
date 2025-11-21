# TunedUp Deployment Guide

## Vercel Configuration

### Required Settings in Vercel Dashboard

1. **Root Directory**: `.` (project root)
   - This allows Vercel to access both `/api` (backend) and `/apps/web` (frontend)

2. **Build Command**: Automatically detected from `vercel.json`
   - Runs: `cd apps/web && npm run build`

3. **Output Directory**: Automatically detected from `vercel.json`
   - Outputs to: `apps/web/.next`

### How to Update Root Directory in Vercel

1. Go to your project on Vercel dashboard
2. Navigate to **Settings** → **General**
3. Scroll to **Root Directory**
4. Click **Edit**
5. Clear the field (leave it empty or enter `.`)
6. Click **Save**
7. Trigger a new deployment

## Architecture

```
/
├── api/                    ← Backend API endpoints (Vercel serverless functions)
│   ├── auth.ts
│   ├── community.ts
│   ├── performance.ts
│   ├── build-plan.ts
│   ├── generate.ts
│   ├── profile.ts
│   ├── stripe.ts
│   ├── promotions.ts
│   ├── turbo-tycoon.ts
│   └── lib/
│       ├── auth.ts
│       ├── moderation.ts
│       └── prisma.js
├── apps/
│   ├── mobile/             ← iOS app (React Native/Expo)
│   └── web/                ← Landing page (Next.js 14)
└── prisma/                 ← Database schema
```

## API Endpoints

All endpoints are available at `https://www.tunedup.dev/api/[endpoint]`:

- `/api/auth` - Authentication (magic links, JWT)
- `/api/community` - Community images, likes, profiles
- `/api/performance` - Car performance calculator
- `/api/build-plan` - Build planner
- `/api/generate` - AI image generation
- `/api/profile` - User profile management
- `/api/stripe` - Payment processing
- `/api/promotions` - Promo code validation
- `/api/turbo-tycoon` - Turbo Tycoon game backend

## Environment Variables

Ensure these are set in Vercel:

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_URL` - Direct PostgreSQL URL

### Authentication
- `JWT_SECRET` - Secret for signing JWT tokens
- `RESEND_API_KEY` - Resend API key for emails

### AI Services
- `GEMINI_API_KEY` - Google Gemini API key

### Payment Processing
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `STRIPE_PRICE_FREE` - Free plan price ID
- `STRIPE_PRICE_BASIC` - Basic plan price ID
- `STRIPE_PRICE_PRO` - Pro plan price ID

### Storage
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

### Other
- `DOMAIN` - Production domain (www.tunedup.dev)

## Deployment Checklist

- [ ] Update Root Directory to `.` in Vercel dashboard
- [ ] Verify `vercel.json` points to `apps/web/.next`
- [ ] Ensure all environment variables are set
- [ ] Push changes to main branch
- [ ] Wait for Vercel deployment
- [ ] Test landing page at https://www.tunedup.dev
- [ ] Test API endpoint (e.g., https://www.tunedup.dev/api/auth?action=me)
- [ ] Verify mobile app can connect to production APIs
- [ ] Check Vercel deployment logs for errors

## Troubleshooting

### Landing page shows 404
- Check Root Directory is set to `.` (not `apps/web`)
- Verify Build Command includes `cd apps/web`
- Check Output Directory is `apps/web/.next`

### API endpoints return 404
- Verify Root Directory is `.` (not `apps/web`)
- Check `/api` folder exists at project root
- Verify API files have correct Vercel serverless function export

### Mobile app can't connect
- Check API endpoint URLs in mobile app config
- Verify CORS is properly configured in API handlers
- Check Vercel deployment logs for runtime errors
