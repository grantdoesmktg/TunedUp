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

    // Cancel subscription at period end (user keeps access until billing date)
    const canceledSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true
    })

    console.log('✅ Subscription will cancel at period end:', {
      subscriptionId: subscription.id,
      currentPeriodEnd: new Date((canceledSubscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (canceledSubscription as any).cancel_at_period_end
    })

    res.status(200).json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      currentPeriodEnd: new Date((canceledSubscription as any).current_period_end * 1000),
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

  const { customer, subscription, metadata } = session

  if (!metadata?.userId || !metadata?.plan) {
    console.error('❌ Missing metadata in checkout session:', { metadata })
    return
  }

  const planRenewsAt = new Date()
  planRenewsAt.setMonth(planRenewsAt.getMonth() + 1)

  try {
    const updatedUser = await prisma.user.update({
      where: { id: metadata.userId },
      data: {
        planCode: metadata.plan,
        stripeCustomerId: customer as string,
        planRenewsAt,
        // Reset usage when upgrading
        perfUsed: 0,
        buildUsed: 0,
        imageUsed: 0,
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

    // Update user plan in database (this is a new subscription, so reset usage)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        planCode: planCode,
        planRenewsAt,
        perfUsed: 0,
        buildUsed: 0,
        imageUsed: 0,
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
  const customer = await stripe.customers.retrieve(subscription.customer as string)

  if (!customer || customer.deleted) return

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: (customer as any).id }
  })

  if (!user) return

  const planRenewsAt = new Date((subscription as any).current_period_end * 1000)

  // Map subscription status to plan
  let planCode = 'FREE'
  if (subscription.status === 'active') {
    // Get plan from subscription metadata or line items
    const lineItem = subscription.items.data[0]
    if (lineItem && lineItem.price.metadata.plan) {
      planCode = lineItem.price.metadata.plan
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      planCode,
      planRenewsAt
    }
  })

  console.log(`Subscription updated for user ${user.id}: ${planCode}`)
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
  console.log('💰 Payment succeeded webhook received:', {
    invoiceId: invoice.id,
    customer: invoice.customer,
    subscription: invoice.subscription,
    amount: invoice.amount_paid
  })

  try {
    // Get the subscription to extract metadata
    if (!invoice.subscription) {
      console.log('⚠️ Invoice has no subscription, skipping user update')
      return
    }

    console.log('🔍 Retrieving subscription:', invoice.subscription)
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)

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

    // Update user plan in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        planCode: planCode,
        planRenewsAt,
        // Only reset usage on initial purchase or upgrade, not on monthly renewals
        ...(isUpgrade || isNewSubscription ? {
          perfUsed: 0,
          buildUsed: 0,
          imageUsed: 0,
          communityUsed: 0,
          resetDate: new Date()
        } : {})
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
