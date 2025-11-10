// NATIVE APP - Pricing Modal Component
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { PLAN_LIMITS, getPlanName } from '../types/quota';
import { STRIPE_PRICE_IDS, cancelSubscription, reactivateSubscription } from '../services/stripe';
import type { PlanCode } from '../types/quota';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// Debug: Log Stripe price IDs on module load
console.log('💰 STRIPE_PRICE_IDS loaded:', {
  PLUS: STRIPE_PRICE_IDS.PLUS,
  PRO: STRIPE_PRICE_IDS.PRO,
  ULTRA: STRIPE_PRICE_IDS.ULTRA
});

interface PricingModalProps {
  visible: boolean;
  onClose: () => void;
  currentPlan?: PlanCode;
  onSelectPlan?: (planCode: PlanCode, priceId: string) => Promise<void>;
}

interface PlanTier {
  code: PlanCode;
  name: string;
  price: string;
  priceId: string; // Stripe price ID
  period: string;
  popular?: boolean;
  features: string[];
  gradient: string[];
}

const PLAN_TIERS: PlanTier[] = [
  {
    code: 'FREE',
    name: 'Free',
    price: '$0',
    priceId: '', // No Stripe price ID for free
    period: 'Forever',
    features: [
      '30 Tokens/month',
      'Resets Monthly (No Carryover)',
      'Performance Calculator (3 tokens)',
      'Build Planner (2 tokens)',
      'Image Generator (5 tokens)',
      'Unlimited Community Posts',
    ],
    gradient: [colors.secondary, colors.divider],
  },
  {
    code: 'PLUS',
    name: 'Plus',
    price: '$4.99',
    priceId: STRIPE_PRICE_IDS.PLUS,
    period: 'per month',
    features: [
      '100 Tokens/month',
      '50% Token Carryover',
      'All Tools Included',
      'Priority Support',
      'Early Access Features',
    ],
    gradient: ['#3B82F6', '#06B6D4'],
  },
  {
    code: 'PRO',
    name: 'Pro',
    price: '$9.99',
    priceId: STRIPE_PRICE_IDS.PRO,
    period: 'per month',
    popular: true,
    features: [
      '250 Tokens/month',
      '50% Token Carryover',
      'All Tools Included',
      'Premium Support',
      'Exclusive Features',
    ],
    gradient: ['#A855F7', '#EC4899'],
  },
  {
    code: 'ULTRA',
    name: 'Ultra',
    price: '$14.99',
    priceId: STRIPE_PRICE_IDS.ULTRA,
    period: 'per month',
    features: [
      '500 Tokens/month',
      '50% Token Carryover',
      'All Tools Included',
      'VIP Support',
      'Shape Future Development',
    ],
    gradient: ['#FF6C00', '#FF3366'],
  },
];

export const PricingModal: React.FC<PricingModalProps> = ({
  visible,
  onClose,
  currentPlan = 'FREE',
  onSelectPlan,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { refreshUser } = useAuth();

  // Debug: Check token when modal opens
  React.useEffect(() => {
    if (visible) {
      AsyncStorage.getItem('auth_token').then(token => {
        console.log('💳 PricingModal opened - Token status:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      });
    }
  }, [visible]);

  const handleSelectPlan = async (plan: PlanTier) => {
    console.log('🎯 handleSelectPlan called with plan:', {
      code: plan.code,
      name: plan.name,
      priceId: plan.priceId,
      hasPriceId: !!plan.priceId
    });

    // Handle FREE plan (cancellation)
    if (plan.code === 'FREE') {
      if (currentPlan === 'FREE' || currentPlan === 'ANONYMOUS') {
        Alert.alert('Current Plan', 'You are already on the Free plan.');
        return;
      }

      // Show confirmation dialog
      Alert.alert(
        'Switch to Free Plan',
        'This will cancel your subscription at the end of your current billing period. You\'ll keep access until then.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: 'destructive',
            onPress: async () => {
              setLoading('FREE');
              try {
                const result = await cancelSubscription();
                const endDate = new Date(result.currentPeriodEnd).toLocaleDateString();

                await refreshUser();

                Alert.alert(
                  'Subscription Cancelled',
                  `Your subscription will end on ${endDate}. You'll keep ${getPlanName(currentPlan)} access until then.`,
                  [{ text: 'OK', onPress: onClose }]
                );
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to cancel subscription');
              } finally {
                setLoading(null);
              }
            },
          },
        ]
      );
      return;
    }

    if (plan.code === currentPlan) {
      Alert.alert('Current Plan', 'This is your current plan.');
      return;
    }

    if (!onSelectPlan) {
      Alert.alert('Coming Soon', 'Payment integration is being set up. Please check back soon!');
      return;
    }

    console.log('💳 About to call onSelectPlan with:', {
      planCode: plan.code,
      priceId: plan.priceId
    });

    setLoading(plan.code);
    try {
      await onSelectPlan(plan.code, plan.priceId);
      Alert.alert('Success', `Successfully upgraded to ${plan.name} plan!`);
      onClose();
    } catch (error: any) {
      console.error('❌ Payment error in handleSelectPlan:', error);
      Alert.alert('Error', error.message || 'Failed to process payment');
    } finally {
      setLoading(null);
    }
  };

  const renderPlanCard = (plan: PlanTier) => {
    const isCurrentPlan = plan.code === currentPlan;
    const isLoading = loading === plan.code;

    return (
      <View
        key={plan.code}
        style={[
          styles.planCard,
          plan.popular && styles.popularCard,
        ]}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}

        <LinearGradient
          colors={plan.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planHeader}
        >
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planPeriod}>{plan.period}</Text>
        </LinearGradient>

        <View style={styles.planBody}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={[
              styles.selectButton,
              isCurrentPlan && styles.currentPlanButton,
              isLoading && styles.loadingButton,
            ]}
            onPress={() => handleSelectPlan(plan)}
            disabled={isCurrentPlan || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.selectButtonText}>
                {isCurrentPlan ? 'Current Plan' : `Choose ${plan.name}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Your Plan</Text>
            <Text style={styles.modalSubtitle}>
              Upgrade to unlock more features and get the most out of TunedUp
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Current Plan Indicator */}
          {currentPlan && currentPlan !== 'ANONYMOUS' && (
            <View style={styles.currentPlanBanner}>
              <Text style={styles.currentPlanText}>
                Current Plan: <Text style={styles.currentPlanHighlight}>{getPlanName(currentPlan)}</Text>
              </Text>
            </View>
          )}

          {/* Plan Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plansContainer}
            snapToInterval={width * 0.75 + 16}
            decelerationRate="fast"
          >
            {PLAN_TIERS.map(renderPlanCard)}
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Text style={styles.footerText}>
              All plans include monthly quota resets and access to all tools
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 24,
    maxHeight: height * 0.85,
    width: '100%',
    paddingTop: 24,
  },
  modalHeader: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  currentPlanBanner: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  currentPlanText: {
    fontSize: 14,
    color: colors.background,
    textAlign: 'center',
  },
  currentPlanHighlight: {
    fontWeight: 'bold',
  },
  plansContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  planCard: {
    width: width * 0.75,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.divider,
  },
  popularCard: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  popularBadge: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    alignItems: 'center',
  },
  popularText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.background,
    letterSpacing: 1,
  },
  planHeader: {
    padding: 24,
    alignItems: 'center',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 14,
    color: colors.textPrimary,
    opacity: 0.8,
  },
  planBody: {
    padding: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkmark: {
    fontSize: 16,
    color: colors.success,
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  currentPlanButton: {
    backgroundColor: colors.divider,
    opacity: 0.5,
  },
  loadingButton: {
    opacity: 0.7,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
