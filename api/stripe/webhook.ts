import { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const prisma = new PrismaClient()
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(checkoutSession)
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
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })

  } catch (error) {
    console.error('Webhook handler error:', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { customer, subscription, metadata } = session

  if (!metadata?.userId || !metadata?.plan) {
    console.error('Missing metadata in checkout session')
    return
  }

  const planRenewsAt = new Date()
  planRenewsAt.setMonth(planRenewsAt.getMonth() + 1)

  await prisma.user.update({
    where: { id: metadata.userId },
    data: {
      planCode: metadata.plan,
      stripeCustomerId: customer as string,
      planRenewsAt,
      // Reset usage when upgrading
      perfUsed: 0,
      buildUsed: 0,
      imageUsed: 0,
      resetDate: new Date()
    }
  })

  console.log(`Plan upgraded for user ${metadata.userId} to ${metadata.plan}`)
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
  // Payment succeeded - subscription continues
  console.log(`Payment succeeded for customer ${invoice.customer}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Payment failed - might want to send notification email
  console.log(`Payment failed for customer ${invoice.customer}`)
}