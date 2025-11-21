# Stripe Integration Setup Guide

This guide will help you complete the Stripe payments setup for the TunedUp Native app.

## ✅ Already Configured

Your Stripe account is already set up with:
- **Live Mode** keys configured
- **Products created** in Stripe Dashboard
- **Price IDs** already added to the code
- **Publishable Key** ready to use

### Your Stripe Configuration

**Keys:**
- ✅ Publishable Key: `pk_live_51SDTmp5rYqPF2Mhh...` (configured in `src/services/stripe.ts`)
- ✅ Secret Key: `sk_live_51SDTmp5rYqPF2Mhh...` (for backend use only)
- ✅ Webhook Secret: `whsec_pr0nQ1HqWyTM...` (for backend use only)

**Price IDs (Already in Code):**
- ✅ Plus Plan ($9.99/mo): `price_1SDU5l5rYqPF2MhhEcOgGw8E`
- ✅ Pro Plan ($19.99/mo): `price_1SDU5z5rYqPF2Mhh2PAeNWdH`
- ✅ Ultra Plan ($29.99/mo): `price_1SDU6U5rYqPF2MhhDxJRyIBo`

## Step 1: Add Environment Variable

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

The publishable key is already set in the code as a fallback, but using `.env` is best practice:

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SDTmp5rYqPF2MhhaWkd2ZSREADQMcc22Xn9mgkOQg97aqVKv13TpMj1GnGxX5t8tgDVrUXYges7ngDES0h5bi5D00scO1avGg
```

## Step 2: Install Stripe React Native SDK

```bash
npm install @stripe/stripe-react-native
```

Or with Expo:

```bash
npx expo install @stripe/stripe-react-native
```

## Step 3: Implement Payment Flow in Mobile App

Open `src/services/stripe.ts` and uncomment the payment sheet implementation in the `initializeStripePayment()` function. The structure is already there, you just need to:

1. Import the Stripe hook at the top of the file
2. Call your backend to create a payment intent
3. Initialize and present the payment sheet

Example implementation is provided in the comments.

## Step 4: Backend Implementation

Your backend at `https://www.tunedup.dev` needs these endpoints:

### 1. Create Payment Intent Endpoint

**POST** `/api/stripe/create-payment-intent`

```javascript
import Stripe from 'stripe';
const stripe = new Stripe('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');

// Request body: { priceId, userEmail }
export async function createPaymentIntent(req, res) {
  const { priceId, userEmail } = req.body;

  // Get or create Stripe customer
  let customer;
  const existingCustomers = await stripe.customers.list({
    email: userEmail,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0];
  } else {
    customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userEmail },
    });
  }

  // Create subscription (not one-time payment)
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });

  const paymentIntent = subscription.latest_invoice.payment_intent;

  // Create ephemeral key for customer
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: '2023-10-16' }
  );

  res.json({
    clientSecret: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    subscriptionId: subscription.id,
  });
}
```

### 2. Webhook Handler

**POST** `/api/stripe/webhook`

```javascript
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe('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');
const prisma = new PrismaClient();
const WEBHOOK_SECRET = 'whsec_pr0nQ1HqWyTMpQn01VyzaqKbznrIcuwf';

export async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
    case 'invoice.payment_succeeded': {
      const session = event.data.object;

      // Get customer email and subscription
      const customer = await stripe.customers.retrieve(session.customer);
      const subscription = await stripe.subscriptions.retrieve(session.subscription);

      // Determine plan from price ID
      const priceId = subscription.items.data[0].price.id;
      let planCode = 'FREE';

      if (priceId === 'price_1SDU5l5rYqPF2MhhEcOgGw8E') planCode = 'PLUS';
      else if (priceId === 'price_1SDU5z5rYqPF2Mhh2PAeNWdH') planCode = 'PRO';
      else if (priceId === 'price_1SDU6U5rYqPF2MhhDxJRyIBo') planCode = 'ULTRA';

      // Update user in database
      await prisma.user.update({
        where: { email: customer.email },
        data: {
          planCode: planCode,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
        },
      });

      console.log(`✅ Updated ${customer.email} to ${planCode} plan`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);

      // Downgrade to FREE plan
      await prisma.user.update({
        where: { email: customer.email },
        data: {
          planCode: 'FREE',
          stripeSubscriptionId: null,
        },
      });

      console.log(`⬇️ Downgraded ${customer.email} to FREE plan`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customer = await stripe.customers.retrieve(invoice.customer);

      console.log(`❌ Payment failed for ${customer.email}`);
      // Optionally send email notification
      break;
    }
  }

  res.json({ received: true });
}
```

### 3. Customer Portal Endpoint (Optional)

**POST** `/api/stripe/customer-portal`

```javascript
export async function createCustomerPortal(req, res) {
  const { userEmail } = req.body;

  // Find customer
  const customers = await stripe.customers.list({
    email: userEmail,
    limit: 1,
  });

  if (customers.data.length === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: customers.data[0].id,
    return_url: 'https://www.tunedup.dev/profile',
  });

  res.json({ url: session.url });
}
```

## Step 5: Set Up Webhooks in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://www.tunedup.dev/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Your webhook secret is already configured: `whsec_pr0nQ1HqWyTM...`

## Step 6: Test the Integration

Since you're using **LIVE** keys, be careful with testing:

1. **Test Mode**: Consider switching to test mode first
   - Use test keys: `pk_test_...` and `sk_test_...`
   - Use test cards: `4242 4242 4242 4242`

2. **Live Mode Testing**:
   - Use a real card (will charge real money)
   - Test with small amounts
   - Cancel subscription immediately after testing

3. **Verify Flow**:
   - User selects plan → Modal shows
   - Click "Choose Plan" → Payment sheet appears
   - Enter payment info → Processes payment
   - Webhook fires → Database updates
   - User plan updates → Quota increases

## Current Status

✅ **Completed:**
- Price IDs configured in code
- Pricing modal UI complete
- Quota tracking integrated
- Frontend scaffolding done

⏳ **Remaining:**
- Install Stripe React Native SDK
- Implement payment sheet in `initializeStripePayment()`
- Create backend endpoints
- Set up webhooks in Stripe Dashboard
- Test payment flow

## Quick Start Commands

```bash
# 1. Install Stripe SDK
npm install @stripe/stripe-react-native

# 2. Create .env file
cp .env.example .env

# 3. Start your app
npm start
```

## Support

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Docs**: https://stripe.com/docs/payments/accept-a-payment?platform=react-native
- **Stripe Support**: https://support.stripe.com

---

**⚠️ Security Notes:**
- Never commit `.env` files with real keys
- Never expose secret keys in client-side code
- Always verify webhooks with signature
- Use HTTPS for all webhook endpoints
