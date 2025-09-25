# TunedUp SaaS Setup Guide

This guide will help you set up TunedUp as a complete SaaS product with authentication, payments, and user management.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Vercel account (for deployment)
- Stripe account
- Resend account (for emails)
- OpenAI API key
- Google AI (Gemini) API key

## 1. Database Setup

### Create PostgreSQL Database

Create a PostgreSQL database for the application:

```sql
CREATE DATABASE tunedup;
CREATE USER tunedup_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tunedup TO tunedup_user;
```

### Run Migrations

```bash
npm install
npx prisma migrate deploy
npx prisma generate
```

## 2. Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

### Required Environment Variables

#### Database
- `PRISMA_DATABASE_URL`: PostgreSQL connection string

#### Authentication
- `JWT_SECRET`: Random string for JWT tokens (generate with `openssl rand -hex 32`)

#### Email (Resend)
- `RESEND_API_KEY`: From your Resend dashboard

#### AI Services
- `OPENAI_API_KEY`: For performance calculations
- `VITE_OPENAI_API_KEY`: Same as above, for client-side access
- `GEMINI_API_KEY`: For image generation

#### Stripe
- `STRIPE_SECRET_KEY`: From Stripe dashboard
- `STRIPE_WEBHOOK_SECRET`: From Stripe webhook endpoint
- `STRIPE_PLUS_PRICE_ID`: Price ID for Plus plan ($4.99/month)
- `STRIPE_PRO_PRICE_ID`: Price ID for Pro plan ($9.99/month)
- `STRIPE_ULTRA_PRICE_ID`: Price ID for Ultra plan ($14.99/month)

#### Deployment
- `VERCEL_URL`: Your Vercel app domain (auto-set by Vercel)

## 3. Stripe Setup

### Create Products and Prices

In your Stripe dashboard, create three subscription products:

1. **Plus Plan** - $4.99/month
   - 10 Performance calculations
   - 10 Build plans
   - 25 Image generations

2. **Pro Plan** - $9.99/month (mark as popular)
   - 15 Performance calculations
   - 15 Build plans
   - 60 Image generations

3. **Ultra Plan** - $14.99/month
   - 25 Performance calculations
   - 25 Build plans
   - 100 Image generations

### Configure Webhook

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## 4. Resend Email Setup

### Configure Domain (Optional)

1. Add your domain in Resend dashboard
2. Update the "from" address in `/api/auth/send-link.ts`

### Email Templates

The magic link email template is built-in, but you can customize it in the send-link API route.

## 5. Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Key Routes

- `/` - Redirects to dashboard
- `/login` - Magic link authentication
- `/dashboard` - User dashboard with usage stats
- `/performance-calculator` - Performance calculator tool (requires auth)
- `/build-planner` - Build planner tool (requires auth)
- `/w/on-site/embed` - Image generator tool (requires auth)

## 6. Deployment

### Vercel Deployment

1. Connect your GitHub repo to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy

### Database Migration

Run migrations in production:

```bash
npx prisma migrate deploy
```

## 7. Testing

### Test Authentication Flow

1. Go to `/login`
2. Enter your email
3. Check email for magic link
4. Click link to sign in
5. Verify redirect to dashboard

### Test Payment Flow

1. Sign in and go to dashboard
2. Click "Upgrade Plan"
3. Select a plan
4. Complete Stripe checkout
5. Verify plan upgrade in dashboard

### Test Usage Quotas

1. Use tools until quota exceeded
2. Verify upgrade prompts appear
3. Test quota reset (30-day cycle)

## 8. Plan Limits

The application enforces these monthly limits:

| Plan | Performance | Build | Image |
|------|-------------|-------|-------|
| FREE | 1 | 1 | 3 |
| PLUS | 10 | 10 | 25 |
| PRO | 15 | 15 | 60 |
| ULTRA | 25 | 25 | 100 |

Limits reset every 30 days from user registration/upgrade.

## 9. Troubleshooting

### Database Connection Issues

- Verify `PRISMA_DATABASE_URL` is correct
- Check database server is running
- Ensure user has proper permissions

### Stripe Webhook Issues

- Verify webhook endpoint URL
- Check webhook signing secret
- Review Vercel function logs

### Email Not Sending

- Verify `RESEND_API_KEY` is correct
- Check domain verification status
- Review email content for spam triggers

### Authentication Issues

- Verify `JWT_SECRET` is set
- Check token expiration times
- Review cookie settings for production

## 10. Customization

### Adding New Plans

1. Create new Stripe price
2. Add to `PLAN_LIMITS` in `/shared/contexts/AuthContext.tsx`
3. Update `UpgradePlansModal` component
4. Add new environment variable for price ID

### Modifying Quotas

Update limits in `/lib/quota.js` and the AuthContext.

### Custom Email Templates

Modify the HTML template in `/api/auth/send-link.ts`.

## Support

For issues with this setup, check:

- Vercel function logs
- Browser network tab
- Database logs
- Stripe dashboard events

The application includes error handling and graceful degradation for most failure scenarios.