// NATIVE APP - Token Balance Display Component
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuota } from '../contexts/QuotaContext';
import { useAuth } from '../contexts/AuthContext';
import { PricingModal } from './PricingModal';
import { initializeStripePayment } from '../services/stripe';
import { TokenDisplay } from './TokenIcon';
import { colors } from '../theme/colors';
import type { PlanCode } from '../types/quota';
import { getPlanName, getPlanTokens } from '../types/quota';

interface QuotaDisplayProps {
  onUpgradePress?: () => void;
  showPricingModal?: boolean;
  navigation?: any;
}

export const QuotaDisplay: React.FC<QuotaDisplayProps> = ({
  onUpgradePress,
  showPricingModal = true,
  navigation
}) => {
  const { tokenInfo, getRemainingTokens } = useQuota();
  const { user, isAuthenticated } = useAuth();
  const [pricingModalVisible, setPricingModalVisible] = useState(false);

  if (!tokenInfo) return null;

  const handleUpgradePress = () => {
    // For anonymous users, navigate to login
    if (!isAuthenticated && navigation) {
      navigation.navigate('Login');
      return;
    }

    // Show pricing modal for paid users wanting to upgrade
    if (showPricingModal) {
      setPricingModalVisible(true);
      return;
    }

    // Fallback to onUpgradePress if provided
    if (onUpgradePress) {
      onUpgradePress();
    }
  };

  const handleSelectPlan = async (planCode: PlanCode, priceId: string) => {
    console.log('📋 QuotaDisplay handleSelectPlan received:', {
      planCode,
      priceId,
      userEmail: user?.email,
      hasUser: !!user
    });
    await initializeStripePayment(planCode, priceId, user?.email);
  };

  const remaining = getRemainingTokens();
  const planTokens = getPlanTokens(tokenInfo.planCode);
  const percentage = tokenInfo.planCode === 'ADMIN' ? 0 : ((planTokens - remaining) / planTokens) * 100;

  // Determine color based on remaining tokens
  const getStatusColor = () => {
    if (remaining === Infinity) return colors.success;
    const percentUsed = ((planTokens - remaining) / planTokens) * 100;
    if (percentUsed >= 90) return colors.error;
    if (percentUsed >= 70) return '#FFA500'; // Orange
    return colors.success;
  };

  const isLimitReached = remaining === 0;
  const isUnlimited = tokenInfo.planCode === 'ADMIN';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.planText}>
          {getPlanName(tokenInfo.planCode)} Plan
        </Text>
        {!isUnlimited && (
          <TokenDisplay amount={remaining} size="medium" />
        )}
        {isUnlimited && (
          <Text style={[styles.usageText, { color: colors.success }]}>
            Unlimited ∞
          </Text>
        )}
      </View>

      {!isUnlimited && (
        <>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: getStatusColor()
                }
              ]}
            />
          </View>

          {isLimitReached && (
            <View style={styles.limitReachedContainer}>
              <Text style={styles.limitReachedText}>
                You've run out of tokens
              </Text>
              {!isAuthenticated ? (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgradePress}
                >
                  <Text style={styles.upgradeButtonText}>Sign In for More</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgradePress}
                >
                  <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!isLimitReached && remaining <= 5 && (
            <Text style={styles.warningText}>
              Only {remaining} token{remaining !== 1 ? 's' : ''} remaining this month
            </Text>
          )}
        </>
      )}

      {tokenInfo.planCode === 'ANONYMOUS' && !isLimitReached && (
        <TouchableOpacity
          style={styles.signInPrompt}
          onPress={handleUpgradePress}
        >
          <Text style={styles.signInPromptText}>
            Sign in for more tokens!
          </Text>
        </TouchableOpacity>
      )}

      {(tokenInfo.planCode === 'FREE' || tokenInfo.planCode === 'PLUS') && !isLimitReached && (
        <TouchableOpacity
          style={styles.upgradePrompt}
          onPress={handleUpgradePress}
        >
          <Text style={styles.upgradePromptText}>
            Upgrade for more tokens
          </Text>
        </TouchableOpacity>
      )}

      {/* Pricing Modal */}
      <PricingModal
        visible={pricingModalVisible}
        onClose={() => setPricingModalVisible(false)}
        currentPlan={tokenInfo.planCode}
        onSelectPlan={handleSelectPlan}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  usageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  limitReachedContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  limitReachedText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 4,
  },
  upgradeButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 13,
    color: '#FFA500',
    textAlign: 'center',
    marginTop: 8,
  },
  signInPrompt: {
    marginTop: 8,
    alignItems: 'center',
  },
  signInPromptText: {
    fontSize: 13,
    color: colors.accent,
    textAlign: 'center',
  },
  upgradePrompt: {
    marginTop: 8,
    alignItems: 'center',
  },
  upgradePromptText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
