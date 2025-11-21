// NATIVE APP - Root component
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { QuotaProvider } from './src/contexts/QuotaContext';
import { ProfileBannerProvider } from './src/contexts/ProfileBannerContext'; // Import new provider
import { AppNavigator } from './src/navigation/AppNavigator';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SDTmp5rYqPF2MhhaWkd2ZSREADQMcc22Xn9mgkOQg97aqVKv13TpMj1GnGxX5t8tgDVrUXYges7ngDES0h5bi5D00scO1avGg';

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <SafeAreaProvider>
        <AuthProvider>
          <QuotaProvider>
            <ProfileBannerProvider>
              <AppNavigator />
              <StatusBar style="light" />
            </ProfileBannerProvider>
          </QuotaProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}
