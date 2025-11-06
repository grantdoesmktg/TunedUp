// NATIVE APP - Stripe Payment Integration
import { Alert } from 'react-native';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlanCode } from '../types/quota';

/**
 * Stripe Configuration
 */
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SDTmp5rYqPF2MhhaWkd2ZSREADQMcc22Xn9mgkOQg97aqVKv13TpMj1GnGxX5t8tgDVrUXYges7ngDES0h5bi5D00scO1avGg';

/**
 * Stripe Price IDs for each plan
 */
export const STRIPE_PRICE_IDS: Record<Exclude<PlanCode, 'FREE' | 'ANONYMOUS' | 'ADMIN'>, string> = {
  PLUS: 'price_1SDU5l5rYqPF2MhhEcOgGw8E',   // $4.99/month - Plus Plan
  PRO: 'price_1SDU5z5rYqPF2Mhh2PAeNWdH',    // $9.99/month - Pro Plan
  ULTRA: 'price_1SDU6U5rYqPF2MhhDxJRyIBo',  // $14.99/month - Ultra Plan
};

/**
 * Initialize Stripe payment for a plan
 * This function is called when the user selects a plan
 */
export const initializeStripePayment = async (
  planCode: PlanCode,
  priceId: string,
  userEmail?: string
): Promise<void> => {
  try {
    console.log('🔄 Initializing Stripe payment:', { planCode, priceId, userEmail });

    // Get auth token
    const token = await AsyncStorage.getItem('auth_token');

    if (!token) {
      throw new Error('Please sign in to upgrade your plan');
    }

    // 1. Create payment intent on backend
    console.log('📡 Calling backend to create payment intent...');
    const response = await fetch('https://www.tunedup.dev/api/stripe?action=create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ priceId, planCode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Failed to create payment',
        supportMessage: 'Please contact support@tunedup.dev for assistance.'
      }));

      // Include support message in error if available
      const errorMessage = errorData.supportMessage
        ? `${errorData.error}\n\n${errorData.supportMessage}`
        : errorData.error || `HTTP ${response.status}`;

      throw new Error(errorMessage);
    }

    const { clientSecret, ephemeralKey, customer } = await response.json();

    console.log('✅ Payment intent created:', {
      hasClientSecret: !!clientSecret,
      hasEphemeralKey: !!ephemeralKey,
      customerId: customer
    });

    // 2. Initialize payment sheet
    console.log('🎨 Initializing payment sheet...');
    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: 'TunedUp',
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: clientSecret,
      allowsDelayedPaymentMethods: true,
      defaultBillingDetails: {
        email: userEmail,
      },
      appearance: {
        colors: {
          primary: '#00C2FF',
          background: '#121212',
          componentBackground: '#1F1F1F',
          componentBorder: '#2A2A2A',
          componentDivider: '#2A2A2A',
          primaryText: '#FFFFFF',
          secondaryText: '#AAAAAA',
          componentText: '#FFFFFF',
          placeholderText: '#666666',
        },
      },
    });

    if (initError) {
      console.error('❌ Payment sheet init error:', initError);
      throw new Error(initError.message);
    }

    console.log('✅ Payment sheet initialized');

    // 3. Present payment sheet
    console.log('📱 Presenting payment sheet...');
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      // User cancelled
      if (presentError.code === 'Canceled') {
        console.log('ℹ️ User cancelled payment');
        return;
      }
      console.error('❌ Payment sheet present error:', presentError);
      throw new Error(presentError.message);
    }

    // 4. Payment successful!
    console.log('🎉 Payment successful!');
    Alert.alert(
      'Success!',
      `Your ${planCode} subscription is now active! Enjoy your increased limits.`,
      [{ text: 'Awesome!' }]
    );

  } catch (error: any) {
    console.error('❌ Stripe payment error:', error);

    // Don't show alert if user cancelled
    if (error.message && !error.message.includes('cancel')) {
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to process payment. Please try again.',
        [{ text: 'OK' }]
      );
    }

    throw error;
  }
};

/**
 * Create a checkout session for web-based payment
 * Alternative approach using Stripe Checkout (redirects to Stripe hosted page)
 */
export const createCheckoutSession = async (
  planCode: PlanCode,
  priceId: string,
  userEmail?: string
): Promise<string> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');

    const response = await fetch('https://www.tunedup.dev/api/stripe?action=create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        plan: planCode,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { url } = await response.json();
    return url;
  } catch (error: any) {
    console.error('Create checkout session error:', error);
    throw error;
  }
};

/**
 * Handle subscription cancellation (cancel at period end)
 */
export const cancelSubscription = async (): Promise<{ currentPeriodEnd: string; cancelAtPeriodEnd: boolean }> => {
  try {
    console.log('🚫 Attempting to cancel subscription...');
    const token = await AsyncStorage.getItem('auth_token');
    console.log('🔑 Token retrieved:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

    console.log('📡 Calling cancel-subscription endpoint...');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add token if available (for native app users)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('https://www.tunedup.dev/api/stripe?action=cancel-subscription', {
      method: 'POST',
      headers,
      credentials: 'include', // Include cookies for web-based auth
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to cancel subscription' }));
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.error || 'Failed to cancel subscription');
    }

    const data = await response.json();
    console.log('✅ Cancellation successful:', data);
    return {
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd
    };
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
};

/**
 * Reactivate a cancelled subscription
 */
export const reactivateSubscription = async (): Promise<{ currentPeriodEnd: string; cancelAtPeriodEnd: boolean }> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add token if available (for native app users)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('https://www.tunedup.dev/api/stripe?action=reactivate-subscription', {
      method: 'POST',
      headers,
      credentials: 'include', // Include cookies for web-based auth
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to reactivate subscription' }));
      throw new Error(errorData.error || 'Failed to reactivate subscription');
    }

    const data = await response.json();
    return {
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd
    };
  } catch (error: any) {
    console.error('Reactivate subscription error:', error);
    throw error;
  }
};

/**
 * Get customer portal URL for managing subscription
 */
export const getCustomerPortalUrl = async (userEmail: string): Promise<string> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');

    const response = await fetch('https://www.tunedup.dev/api/stripe?action=portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        userEmail,
        returnUrl: 'tunedup://profile',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get customer portal URL');
    }

    const { url } = await response.json();
    return url;
  } catch (error: any) {
    console.error('Get customer portal error:', error);
    throw error;
  }
};

/**
 * Validate Stripe configuration
 */
export const validateStripeConfig = (): boolean => {
  if (!STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY.includes('pk_test_...')) {
    console.warn('Stripe publishable key not configured');
    return false;
  }

  const hasValidPriceIds = Object.values(STRIPE_PRICE_IDS).every(
    priceId => priceId.length > 20
  );

  if (!hasValidPriceIds) {
    console.warn('Stripe price IDs not configured');
    return false;
  }

  return true;
};
