#!/usr/bin/env node

// Test script to verify Stripe configuration
require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

async function testStripe() {
  console.log('🔍 Testing Stripe Configuration...\n')

  // Check environment variables
  console.log('📋 Environment Variables:')
  console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing')
  console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing')
  console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Missing')
  console.log('')

  console.log('📋 Price IDs:')
  console.log('STRIPE_PRICE_PLUS:', process.env.STRIPE_PRICE_PLUS || '❌ Missing')
  console.log('STRIPE_PRICE_PRO:', process.env.STRIPE_PRICE_PRO || '❌ Missing')
  console.log('STRIPE_PRICE_ULTRA:', process.env.STRIPE_PRICE_ULTRA || '❌ Missing')
  console.log('')

  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('❌ STRIPE_SECRET_KEY is missing. Cannot continue.')
    return
  }

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  try {
    console.log('🔗 Testing Stripe API Connection...')

    // Test API connection by listing products
    const products = await stripe.products.list({ limit: 5 })
    console.log(`✅ Connected to Stripe! Found ${products.data.length} products`)

    // Show products
    products.data.forEach(product => {
      console.log(`  - ${product.name} (${product.id})`)
    })
    console.log('')

    // Test each price ID
    console.log('💰 Testing Price IDs...')
    const priceIds = {
      PLUS: process.env.STRIPE_PRICE_PLUS,
      PRO: process.env.STRIPE_PRICE_PRO,
      ULTRA: process.env.STRIPE_PRICE_ULTRA
    }

    for (const [plan, priceId] of Object.entries(priceIds)) {
      if (priceId) {
        try {
          const price = await stripe.prices.retrieve(priceId)
          console.log(`✅ ${plan}: ${priceId} - ${price.unit_amount/100} ${price.currency.toUpperCase()}/${price.recurring?.interval}`)
        } catch (error) {
          console.log(`❌ ${plan}: ${priceId} - ${error.message}`)
        }
      } else {
        console.log(`❌ ${plan}: Price ID not set`)
      }
    }
    console.log('')

    // Test creating a test checkout session
    console.log('🛒 Testing Checkout Session Creation...')
    try {
      const testSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_PRO,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: 'https://www.tunedup.dev/success',
        cancel_url: 'https://www.tunedup.dev/cancel',
        metadata: {
          test: 'true'
        }
      })

      console.log('✅ Test checkout session created successfully!')
      console.log(`   Session ID: ${testSession.id}`)
      console.log(`   URL: ${testSession.url}`)

      // Clean up - expire the test session
      await stripe.checkout.sessions.expire(testSession.id)
      console.log('✅ Test session cleaned up')

    } catch (error) {
      console.log('❌ Failed to create test checkout session:')
      console.log(`   Error: ${error.message}`)
      if (error.code) {
        console.log(`   Code: ${error.code}`)
      }
    }

  } catch (error) {
    console.log('❌ Stripe API Error:')
    console.log(`   Error: ${error.message}`)
    if (error.code) {
      console.log(`   Code: ${error.code}`)
    }
  }
}

// Run the test
testStripe().catch(console.error)