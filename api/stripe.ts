import { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { jwtVerify } from 'jose'
import { getToken } from './lib/auth.js'
import { prisma } from './lib/prisma.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_IDS = {
  PLUS: process.env.STRIPE_PRICE_PLUS!,
  PRO: process.env.STRIPE_PRICE_PRO!,
  ULTRA: process.env.STRIPE_PRICE_ULTRA!
}

// Webhook needs special body parsing config
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query

  // Route based on action query parameter
  if (action === 'create-payment-intent') {
    return handleCreatePaymentIntent(req, res)
  } else if (action === 'create-checkout') {
    return handleCreateCheckout(req, res)
  } else if (action === 'portal') {
    return handlePortal(req, res)
  } else if (action === 'cancel-subscription') {
    return handleCancelSubscription(req, res)
  } else if (action === 'reactivate-subscription') {
    return handleReactivateSubscription(req, res)
  } else if (action === 'webhook') {
    return handleWebhook(req, res)
  } else {
    return res.status(400).json({ error: 'Invalid action parameter' })
  }
}

// MOBILE: Create payment intent for React Native
async function handleCreatePaymentIntent(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('📱 Mobile payment intent request received:', {
    body: req.body,
    headers: {
      authorization: !!req.headers.authorization,
      fingerprint: req.headers['x-fingerprint']
    }
  })

  // Define variables outside try block for error logging
  let email: string | undefined
  let priceId: string | undefined
  let planCode: string | undefined
  let user: any

  try {
    // Get user email from JWT token (Authorization header for mobile)
    const token = await getToken(req)
    email = token?.email as string

    if (!email) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Get request body params
    priceId = req.body.priceId
    planCode = req.body.planCode

    if (!priceId || !planCode) {
      return res.status(400).json({ error: 'Missing priceId or planCode' })
    }

    // Validate price ID matches plan
    const expectedPriceId = PRICE_IDS[planCode as keyof typeof PRICE_IDS]
    if (priceId !== expectedPriceId) {
      return res.status(400).json({ error: 'Invalid price ID for plan' })
    }

    console.log('✅ Authenticated user:', email, 'Plan:', planCode)

    // Get or create user
    user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          planCode: 'FREE'
        }
      })
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId

    if (!customerId) {
      console.log('📝 Creating new Stripe customer...')
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId: user.id,
          email
        }
      })

      customerId = customer.id

      await prisma.user.update({
        where: { email },
        data: { stripeCustomerId: customerId }
      })
      console.log('✅ New customer created:', customerId)
    } else {
      // Verify the customer still exists in Stripe
      try {
        await stripe.customers.retrieve(customerId)
        console.log('✅ Existing customer verified:', customerId)
      } catch (error) {
        console.log('❌ Stored customer ID invalid, creating new customer...')
        const customer = await stripe.customers.create({
          email,
          metadata: {
            userId: user.id,
            email
          }
        })

        customerId = customer.id

        await prisma.user.update({
          where: { email },
          data: { stripeCustomerId: customerId }
        })
        console.log('✅ Replacement customer created:', customerId)
      }
    }

    // Check for existing active subscriptions and cancel them
    console.log('🔍 Checking for existing subscriptions...')
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10
    })

    if (existingSubscriptions.data.length > 0) {
      console.log('⚠️ Found existing subscriptions, canceling them...')
      for (const sub of existingSubscriptions.data) {
        console.log('🗑️ Canceling subscription:', sub.id)
        await stripe.subscriptions.cancel(sub.id)
      }
    }

    // Remove any default payment method to force payment_intent creation
    console.log('🧹 Clearing default payment method...')
    try {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: null as any
        }
      })
    } catch (err) {
      console.log('⚠️ Could not clear default payment method:', err)
    }

    // Create subscription with payment intent - try with explicit settings
    console.log('💳 Creating subscription with payment intent...')
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card']
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id,
        plan: planCode,
        email
      }
    })

    console.log('📋 Subscription created:', {
      id: subscription.id,
      status: subscription.status,
      latest_invoice: typeof subscription.latest_invoice
    })

    // Get the invoice
    const invoice = subscription.latest_invoice as any

    if (!invoice) {
      throw new Error('Subscription created but no invoice found')
    }

    console.log('📄 Invoice details:', {
      id: invoice.id,
      status: invoice.status,
      payment_intent: invoice.payment_intent,
      payment_intent_type: typeof invoice.payment_intent
    })

    // Handle payment_intent - it might be a string ID or null
    let fullPaymentIntent: Stripe.PaymentIntent

    if (!invoice.payment_intent) {
      // No payment intent at all - invoice might be paid or draft
      console.log('⚠️ No payment_intent on invoice, checking invoice status...')

      if (invoice.status === 'paid') {
        throw new Error('Invoice already paid - customer may have default payment method')
      }

      // Invoice is open/draft but no payment intent - manually create one
      console.log('🔨 Manually creating payment intent for invoice...')
      fullPaymentIntent = await stripe.paymentIntents.create({
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer: customerId,
        metadata: {
          userId: user.id,
          plan: planCode,
          email,
          invoiceId: invoice.id,
          subscriptionId: subscription.id
        }
      })

      console.log('✅ Manual payment intent created:', {
        id: fullPaymentIntent.id,
        status: fullPaymentIntent.status
      })
    } else if (typeof invoice.payment_intent === 'string') {
      // Payment intent is a string ID - retrieve it
      console.log('⚠️ Payment intent is string ID, retrieving...')
      fullPaymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent)
      console.log('✅ Retrieved payment intent:', {
        id: fullPaymentIntent.id,
        status: fullPaymentIntent.status
      })
    } else {
      // Payment intent is already expanded object
      fullPaymentIntent = invoice.payment_intent as Stripe.PaymentIntent
      console.log('✅ Payment intent already expanded:', {
        id: fullPaymentIntent.id,
        status: fullPaymentIntent.status
      })
    }

    if (!fullPaymentIntent.client_secret) {
      throw new Error(`Payment intent missing client_secret. ID: ${fullPaymentIntent.id}, Status: ${fullPaymentIntent.status}`)
    }

    // Create ephemeral key for customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-11-20.acacia' }
    )

    console.log('✅ Payment intent created:', {
      subscriptionId: subscription.id,
      paymentIntentId: fullPaymentIntent.id,
      clientSecret: fullPaymentIntent.client_secret?.substring(0, 20) + '...'
    })

    // Return data for mobile payment sheet
    res.status(200).json({
      clientSecret: fullPaymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customerId,
      subscriptionId: subscription.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    })

  } catch (error) {
    console.error('❌ Create payment intent error:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: user?.id,
      email: user?.email,
      priceId,
      planCode
    })

    // User-friendly error message with support contact
    const errorMessage = error instanceof Error ? error.message : 'Payment processing error'
    res.status(500).json({
      error: errorMessage,
      supportMessage: 'If this issue persists, please contact support@tunedup.dev for assistance.',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// WEB: Create checkout session
async function handleCreateCheckout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🔄 Create checkout request received:', {
    body: req.body,
    hasStripePrices: {
      PLUS: !!process.env.STRIPE_PRICE_PLUS,
      PRO: !!process.env.STRIPE_PRICE_PRO,
      ULTRA: !!process.env.STRIPE_PRICE_ULTRA
    }
  })

  try {
    // Get session from cookie (web)
    const cookies = req.headers.cookie?.split(';') || []
    const sessionCookie = cookies
      .find(c => c.trim().startsWith('_vercel_jwt=') || c.trim().startsWith('session='))
      ?.split('=')[1]

    if (!sessionCookie) {
      console.log('No session cookie found. Available cookies:', req.headers.cookie)
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Verify session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(sessionCookie, secret)
    const email = payload.email as string

    if (!email) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    const { plan } = req.body

    if (!plan || !PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      return res.status(400).json({ error: 'Invalid plan' })
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          planCode: 'FREE'
        }
      })
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId

    if (!customerId) {
      console.log('📝 No customer ID found, creating new customer...')
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId: user.id
        }
      })

      customerId = customer.id

      await prisma.user.update({
        where: { email },
        data: { stripeCustomerId: customerId }
      })
      console.log('✅ New customer created:', customerId)
    } else {
      // Verify the customer still exists in Stripe
      try {
        await stripe.customers.retrieve(customerId)
        console.log('✅ Existing customer verified:', customerId)
      } catch (error) {
        console.log('❌ Stored customer ID invalid, creating new customer...')
        const customer = await stripe.customers.create({
          email,
          metadata: {
            userId: user.id
          }
        })

        customerId = customer.id

        await prisma.user.update({
          where: { email },
          data: { stripeCustomerId: customerId }
        })
        console.log('✅ Replacement customer created:', customerId)
      }
    }

    // Create checkout session
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.tunedup.dev'
      : 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[plan as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
      },
    })

    res.status(200).json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('❌ Create checkout error:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      priceIds: PRICE_IDS
    })

    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// WEB: Create billing portal session
async function handlePortal(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session from cookie (web)
    const cookies = req.headers.cookie?.split(';') || []
    const sessionCookie = cookies
      .find(c => c.trim().startsWith('_vercel_jwt=') || c.trim().startsWith('session='))
      ?.split('=')[1]

    if (!sessionCookie) {
      console.log('No session cookie found. Available cookies:', req.headers.cookie)
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Verify session token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(sessionCookie, secret)
    const email = payload.email as string

    if (!email) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({ error: 'No subscription found' })
    }

    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://www.tunedup.dev'
      : 'http://localhost:3000'

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard`,
    })

    res.status(200).json({
      url: portalSession.url
    })

  } catch (error) {
    console.error('Create portal error:', error)
    res.status(500).json({
      error: 'Failed to create portal session'
    })
  }
}

// Cancel subscription at period end (user keeps access until billing date)
async function handleCancelSubscription(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user email from JWT token
    const token = await getToken(req)
    const email = token?.email as string

    if (!email) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    console.log('🚫 Cancel subscription request for:', email)

    console.log('📝 Step 1: Looking up user in database...')
    const user = await prisma.user.findUnique({
      where: { email }
    })
    console.log('✅ User found:', user ? {
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId
    } : 'null')

    if (!user) {
      console.error('❌ User not found')
      return res.status(400).json({ error: 'User not found' })
    }

    // Check if we have a stored subscription ID
    if (user.stripeSubscriptionId) {
      console.log('📝 Step 2: Using stored subscription ID:', user.stripeSubscriptionId)

      try {
        // Retrieve the subscription to verify it exists and check its status
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
        console.log('✅ Subscription found:', { id: subscription.id, status: subscription.status })

        // Check if subscription is already canceled/expired
        if (subscription.status === 'canceled') {
          console.log('ℹ️ Subscription already canceled')
          return res.status(200).json({
            success: true,
            alreadyCanceled: true,
            message: 'Your subscription has already been canceled and you are on the Free plan.',
            userMessage: 'You are already on the Free plan. No active subscription to cancel.'
          })
        }

        if (subscription.status === 'incomplete_expired' || subscription.status === 'unpaid') {
          console.log('ℹ️ Subscription expired/unpaid - user already on Free plan')
          return res.status(200).json({
            success: true,
            alreadyCanceled: true,
            message: 'Your subscription has expired and you are on the Free plan.',
            userMessage: 'You are already on the Free plan. Your previous subscription expired.'
          })
        }

        // Check if already scheduled to cancel
        if ((subscription as any).cancel_at_period_end) {
          const periodEnd = (subscription as any).current_period_end
          const currentPeriodEnd = periodEnd && typeof periodEnd === 'number'
            ? new Date(periodEnd * 1000)
            : null

          console.log('ℹ️ Subscription already scheduled to cancel at:', currentPeriodEnd)
          return res.status(200).json({
            success: true,
            alreadyScheduled: true,
            currentPeriodEnd: currentPeriodEnd?.toISOString(),
            message: 'Your subscription is already scheduled to cancel.',
            userMessage: `Your subscription will end on ${currentPeriodEnd?.toLocaleDateString()}. You'll keep your current plan benefits until then.`
          })
        }

        // Allow cancellation for active, trialing, or incomplete (paid but not yet activated) subscriptions
        if (subscription.status !== 'active' && subscription.status !== 'trialing' && subscription.status !== 'incomplete') {
          console.error('❌ Subscription cannot be cancelled:', subscription.status)
          return res.status(400).json({
            error: `Cannot cancel subscription with status: ${subscription.status}`,
            userMessage: 'Unable to cancel this subscription. Please contact support if you need assistance.'
          })
        }

        // Cancel subscription at period end
        console.log('📝 Step 3: Updating subscription to cancel at period end...')
        const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true
        })

        // Get current_period_end safely
        const periodEnd = (canceledSubscription as any).current_period_end
        const currentPeriodEnd = periodEnd && typeof periodEnd === 'number'
          ? new Date(periodEnd * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Fallback: 30 days from now

        console.log('✅ Subscription will cancel at period end:', {
          subscriptionId: subscription.id,
          currentPeriodEnd,
          cancelAtPeriodEnd: (canceledSubscription as any).cancel_at_period_end
        })

        res.status(200).json({
          success: true,
          message: 'Subscription will be canceled at the end of the billing period',
          currentPeriodEnd: currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: (canceledSubscription as any).cancel_at_period_end
        })
        return
      } catch (error: any) {
        console.error('❌ Error retrieving stored subscription:', error.message)
        // Fall through to search for subscriptions by customer ID
      }
    }

    // Fallback: Search for subscriptions by customer ID
    if (!user.stripeCustomerId) {
      console.error('❌ No Stripe customer ID or subscription ID')
      return res.status(400).json({ error: 'No subscription found' })
    }

    console.log('📝 Step 2 (Fallback): Fetching subscriptions from Stripe for customer:', user.stripeCustomerId)
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      limit: 10
    })
    console.log('✅ Found subscriptions:', subscriptions.data.length, subscriptions.data.map(s => ({ id: s.id, status: s.status })))

    // Find a subscription that can be canceled
    // Include 'incomplete' status for subscriptions that were paid but haven't transitioned to 'active' yet
    const cancelableSubscription = subscriptions.data.find(s =>
      (s.status === 'active' || s.status === 'trialing' || s.status === 'incomplete') &&
      !(s as any).cancel_at_period_end
    )

    if (!cancelableSubscription) {
      console.error('❌ No cancelable subscriptions found. Statuses:', subscriptions.data.map(s => s.status))

      // Check if user already has canceled/expired subscriptions
      const hasCanceledOrExpired = subscriptions.data.some(s =>
        s.status === 'canceled' || s.status === 'incomplete_expired' || s.status === 'unpaid'
      )

      if (hasCanceledOrExpired) {
        return res.status(200).json({
          success: true,
          alreadyCanceled: true,
          message: 'You are already on the Free plan.',
          userMessage: 'You are already on the Free plan. No active subscription to cancel.'
        })
      }

      return res.status(400).json({
        error: 'No active subscription found',
        userMessage: 'No active subscription found. You may already be on the Free plan.'
      })
    }

    // Cancel subscription at period end (user keeps access until billing date)
    console.log('📝 Step 3: Updating subscription to cancel at period end...', { id: cancelableSubscription.id, status: cancelableSubscription.status })
    const canceledSubscription = await stripe.subscriptions.update(cancelableSubscription.id, {
      cancel_at_period_end: true
    })

    // Get current_period_end safely
    const periodEnd = (canceledSubscription as any).current_period_end
    const currentPeriodEnd = periodEnd && typeof periodEnd === 'number'
      ? new Date(periodEnd * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Fallback: 30 days from now

    console.log('✅ Subscription will cancel at period end:', {
      subscriptionId: cancelableSubscription.id,
      currentPeriodEnd,
      cancelAtPeriodEnd: (canceledSubscription as any).cancel_at_period_end
    })

    res.status(200).json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: (canceledSubscription as any).cancel_at_period_end
    })

  } catch (error) {
    console.error('❌ Cancel subscription error:', error)
    res.status(500).json({
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Reactivate a subscription that was set to cancel at period end
async function handleReactivateSubscription(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user email from JWT token
    const token = await getToken(req)
    const email = token?.email as string

    if (!email) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    console.log('🔄 Reactivate subscription request for:', email)

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({ error: 'No subscription found' })
    }

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1
    })

    if (subscriptions.data.length === 0) {
      return res.status(400).json({ error: 'No active subscription found' })
    }

    const subscription = subscriptions.data[0]

    if (!subscription.cancel_at_period_end) {
      return res.status(400).json({ error: 'Subscription is not scheduled for cancellation' })
    }

    // Reactivate subscription by removing cancel_at_period_end
    const reactivatedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false
    })

    console.log('✅ Subscription reactivated:', {
      subscriptionId: subscription.id,
      currentPeriodEnd: new Date((reactivatedSubscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (reactivatedSubscription as any).cancel_at_period_end
    })

    res.status(200).json({
      success: true,
      message: 'Subscription has been reactivated',
      currentPeriodEnd: new Date((reactivatedSubscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (reactivatedSubscription as any).cancel_at_period_end
    })

  } catch (error) {
    console.error('❌ Reactivate subscription error:', error)
    res.status(500).json({
      error: 'Failed to reactivate subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Stripe webhook handler
async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature'] as string
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!
  let event: Stripe.Event

  try {
    // Get raw body buffer for signature verification
    const chunks = []
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    const body = Buffer.concat(chunks)

    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    console.log('✅ Webhook signature verified successfully')
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    console.log(`🔔 Webhook received: ${event.type}`, {
      eventId: event.id,
      created: new Date(event.created * 1000),
      livemode: event.livemode
    })

    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(checkoutSession)
        break

      case 'customer.subscription.created':
        const createdSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(createdSubscription)
        break

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(updatedSubscription)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(deletedSubscription)
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(failedInvoice)
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent)
        break

      default:
        console.log(`❓ Unhandled event type: ${event.type}`)
    }

    // Always return 200 to Stripe to prevent retries
    res.status(200).json({ received: true })

  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Event type:', event?.type)
    console.error('❌ Event ID:', event?.id)

    // Still return 200 to prevent Stripe from retrying
    // We've logged the error for debugging
    res.status(200).json({
      received: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Webhook helper functions
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Checkout completed webhook received:', {
    sessionId: session.id,
    customer: session.customer,
    metadata: session.metadata
  })

  const { customer, metadata } = session

  if (!metadata?.userId || !metadata?.plan) {
    console.error('❌ Missing metadata in checkout session:', { metadata })
    return
  }

  const planRenewsAt = new Date()
  planRenewsAt.setMonth(planRenewsAt.getMonth() + 1)

  try {
    // Get token amount for the plan
    const { PLAN_TOKENS } = await import('../lib/tokens.js')
    const tokens = PLAN_TOKENS[metadata.plan as keyof typeof PLAN_TOKENS] || PLAN_TOKENS.FREE

    const updatedUser = await prisma.user.update({
      where: { id: metadata.userId },
      data: {
        planCode: metadata.plan,
        stripeCustomerId: customer as string,
        planRenewsAt,
        tokens, // Set tokens based on plan
        communityUsed: 0,
        resetDate: new Date()
      }
    })

    console.log(`✅ Plan upgraded for user ${metadata.userId} to ${metadata.plan}`, {
      userId: updatedUser.id,
      email: updatedUser.email,
      newPlan: updatedUser.planCode
    })
  } catch (error) {
    console.error('❌ Failed to update user plan:', error)
    throw error
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🎉 Subscription created webhook received:', {
    subscriptionId: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    metadata: subscription.metadata
  })

  try {
    // Get user from database using stripe customer ID
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: subscription.customer as string }
    })

    if (!user) {
      console.error('❌ User not found for customer:', subscription.customer)
      return
    }

    // Extract plan from subscription metadata
    const planCode = subscription.metadata.plan

    if (!planCode) {
      console.error('❌ No plan in subscription metadata')
      return
    }

    // Calculate renewal date - check if current_period_end exists
    let planRenewsAt: Date | null = null
    const periodEnd = (subscription as any).current_period_end
    if (periodEnd && typeof periodEnd === 'number') {
      planRenewsAt = new Date(periodEnd * 1000)
    } else {
      // Fallback: set to 1 month from now
      planRenewsAt = new Date()
      planRenewsAt.setMonth(planRenewsAt.getMonth() + 1)
    }

    console.log('📅 Setting planRenewsAt to:', planRenewsAt)

    // Get token amount for the plan
    const { setTokensForPlan } = await import('../lib/tokens.js')

    // Update user plan in database (this is a new subscription, so reset tokens)
    const updatedUser = await setTokensForPlan(user.email, planCode)

    // Also update subscription metadata
    await prisma.user.update({
      where: { id: user.id },
      data: {
        planRenewsAt,
        stripeSubscriptionId: subscription.id,
        communityUsed: 0,
        resetDate: new Date()
      }
    })

    console.log(`✅ New subscription created for user ${user.id} - Plan: ${planCode}`, {
      userId: updatedUser.id,
      email: updatedUser.email,
      newPlan: updatedUser.planCode,
      renewsAt: updatedUser.planRenewsAt
    })
  } catch (error) {
    console.error('❌ handleSubscriptionCreated error:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated webhook received:', {
    subscriptionId: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
  })

  const customer = await stripe.customers.retrieve(subscription.customer as string)

  if (!customer || customer.deleted) {
    console.log('⚠️ Customer not found or deleted')
    return
  }

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: (customer as any).id }
  })

  if (!user) {
    console.log('⚠️ User not found for customer:', (customer as any).id)
    return
  }

  // Handle date safely
  let planRenewsAt: Date | null = null
  const periodEnd = (subscription as any).current_period_end
  if (periodEnd && typeof periodEnd === 'number') {
    planRenewsAt = new Date(periodEnd * 1000)
  }

  // Determine plan code based on subscription status
  let planCode = user.planCode // Keep current plan by default

  if (subscription.status === 'active' || subscription.status === 'trialing' || subscription.status === 'incomplete') {
    // Subscription is active - get plan from metadata
    if (subscription.metadata.plan) {
      planCode = subscription.metadata.plan
    } else {
      // Fallback: try to get from line items
      const lineItem = subscription.items.data[0]
      if (lineItem && lineItem.price.metadata?.plan) {
        planCode = lineItem.price.metadata.plan
      }
    }
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    // Subscription ended - downgrade to FREE
    planCode = 'FREE'
    planRenewsAt = null
  }

  // If subscription is set to cancel at period end, keep the current plan until then
  if ((subscription as any).cancel_at_period_end && planRenewsAt) {
    console.log(`⏳ Subscription will cancel at period end (${planRenewsAt}), keeping current plan`)
    // Don't change the plan yet, just update the renewal date
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      planCode,
      planRenewsAt,
      stripeSubscriptionId: subscription.id
    }
  })

  console.log(`✅ Subscription updated for user ${user.id}:`, {
    planCode,
    planRenewsAt,
    cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer as string)

  if (!customer || customer.deleted) return

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: (customer as any).id }
  })

  if (!user) return

  await prisma.user.update({
    where: { id: user.id },
    data: {
      planCode: 'FREE',
      planRenewsAt: null
    }
  })

  console.log(`Subscription canceled for user ${user.id}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceAny = invoice as any
  console.log('💰 Payment succeeded webhook received:', {
    invoiceId: invoice.id,
    customer: invoice.customer,
    subscription: invoiceAny.subscription,
    amount: invoice.amount_paid
  })

  try {
    // Get the subscription to extract metadata
    if (!invoiceAny.subscription) {
      console.log('⚠️ Invoice has no subscription, skipping user update')
      return
    }

    console.log('🔍 Retrieving subscription:', invoiceAny.subscription)
    const subscription = await stripe.subscriptions.retrieve(invoiceAny.subscription as string)

    console.log('📋 Subscription details:', {
      id: subscription.id,
      status: subscription.status,
      metadata: subscription.metadata
    })

    // Get user from database using stripe customer ID
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: invoice.customer as string }
    })

    if (!user) {
      console.error('❌ User not found for customer:', invoice.customer)
      return
    }

    // Extract plan from subscription metadata
    const planCode = subscription.metadata.plan

    if (!planCode) {
      console.error('❌ No plan in subscription metadata')
      return
    }

    // Calculate renewal date
    const planRenewsAt = new Date((subscription as any).current_period_end * 1000)

    // Check if this is an upgrade (plan change) or renewal (same plan)
    const isUpgrade = user.planCode !== planCode
    const isNewSubscription = !user.planRenewsAt
    const isMonthlyRenewal = !isUpgrade && !isNewSubscription

    // Get token amount for the plan
    const { PLAN_TOKENS, calculateMonthlyRefill } = await import('../lib/tokens.js')
    const tokens = PLAN_TOKENS[planCode as keyof typeof PLAN_TOKENS] || PLAN_TOKENS.FREE

    // Calculate new token amount
    let newTokens = tokens
    if (isMonthlyRenewal) {
      // Monthly renewal - apply carryover rules
      newTokens = calculateMonthlyRefill(user.planCode, user.tokens)
      console.log(`💰 Monthly renewal: ${user.tokens} tokens → ${newTokens} tokens (with ${Math.floor(user.tokens * 0.5)} carryover)`)
    } else {
      // New subscription or upgrade - full token grant
      newTokens = tokens
      console.log(`🎉 New subscription/upgrade: Granting ${newTokens} tokens`)
    }

    // Update user plan in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        planCode: planCode,
        planRenewsAt,
        stripeSubscriptionId: subscription.id,
        tokens: newTokens,
        communityUsed: 0,
        resetDate: new Date()
      }
    })

    console.log(`✅ Plan upgraded for user ${user.id} to ${planCode}`, {
      userId: updatedUser.id,
      email: updatedUser.email,
      newPlan: updatedUser.planCode,
      renewsAt: updatedUser.planRenewsAt
    })
  } catch (error) {
    console.error('❌ handlePaymentSucceeded error:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Payment failed - might want to send notification email
  console.log(`Payment failed for customer ${invoice.customer}`)
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('💳 Payment intent succeeded webhook received:', {
    paymentIntentId: paymentIntent.id,
    customer: paymentIntent.customer,
    amount: paymentIntent.amount,
    metadata: paymentIntent.metadata
  })

  try {
    // Check if this payment intent is associated with an invoice/subscription
    const invoiceId = paymentIntent.invoice as string | null

    if (!invoiceId) {
      console.log('⚠️ Payment intent has no invoice, skipping')
      return
    }

    console.log('🔍 Retrieving invoice:', invoiceId)
    const invoice = await stripe.invoices.retrieve(invoiceId)

    if (!invoice.subscription) {
      console.log('⚠️ Invoice has no subscription, skipping')
      return
    }

    console.log('🔍 Retrieving subscription:', invoice.subscription)
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)

    console.log('📋 Subscription status:', subscription.status)

    // If subscription is incomplete, it means payment just succeeded and we should activate it
    if (subscription.status === 'incomplete') {
      console.log('🚀 Activating incomplete subscription after successful payment...')

      // The subscription should automatically transition to active after payment succeeds
      // But let's check and ensure it's properly set up
      const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id)

      console.log('✅ Subscription after payment:', {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: (updatedSubscription as any).current_period_end
      })

      // Update user in database with subscription details
      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: subscription.customer as string }
      })

      if (!user) {
        console.error('❌ User not found for customer:', subscription.customer)
        return
      }

      const planCode = subscription.metadata.plan
      if (!planCode) {
        console.error('❌ No plan in subscription metadata')
        return
      }

      // Get the period end date safely
      let planRenewsAt: Date | null = null
      const periodEnd = (updatedSubscription as any).current_period_end
      if (periodEnd && typeof periodEnd === 'number') {
        planRenewsAt = new Date(periodEnd * 1000)
      } else {
        // Fallback: set to 1 month from now
        planRenewsAt = new Date()
        planRenewsAt.setMonth(planRenewsAt.getMonth() + 1)
      }

      // Update user with subscription info
      await prisma.user.update({
        where: { id: user.id },
        data: {
          planCode,
          planRenewsAt,
          stripeSubscriptionId: subscription.id
        }
      })

      console.log('✅ User plan updated after payment intent success:', {
        userId: user.id,
        email: user.email,
        planCode,
        planRenewsAt,
        subscriptionId: subscription.id,
        subscriptionStatus: updatedSubscription.status
      })
    } else {
      console.log(`ℹ️ Subscription already in ${subscription.status} status, no action needed`)
    }

  } catch (error) {
    console.error('❌ handlePaymentIntentSucceeded error:', error)
  }
}
