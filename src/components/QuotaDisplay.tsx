// NATIVE APP - Quota Display Component
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuota } from '../contexts/QuotaContext';
import { useAuth } from '../contexts/AuthContext';
import { PricingModal } from './PricingModal';
import { initializeStripePayment } from '../services/stripe';
import { colors } from '../theme/colors';
import type { ToolType, PlanCode } from '../types/quota';
import { getToolName, getPlanName } from '../types/quota';

interface QuotaDisplayProps {
  toolType: ToolType;
  onUpgradePress?: () => void;
  showPricingModal?: boolean; // If true, shows pricing modal instead of navigating
}

export const QuotaDisplay: React.FC<QuotaDisplayProps> = ({
  toolType,
  onUpgradePress,
  showPricingModal = true
}) => {
  const { quotaInfo, getRemainingUses, getUsagePercentage } = useQuota();
  const { user, isAuthenticated } = useAuth();
  const [pricingModalVisible, setPricingModalVisible] = useState(false);

  if (!quotaInfo) return null;

  const handleUpgradePress = () => {
    if (showPricingModal) {
      setPricingModalVisible(true);
    } else if (onUpgradePress) {
      onUpgradePress();
    }
  };

  const handleSelectPlan = async (planCode: PlanCode, priceId: string) => {
    // Initialize Stripe payment flow
    await initializeStripePayment(planCode, priceId, user?.email);
  };

  const remaining = getRemainingUses(toolType);
  const percentage = getUsagePercentage(toolType);
  const toolName = getToolName(toolType);

  // Get used and limit based on tool type
  let used = 0;
  let limit = 0;
  switch (toolType) {
    case 'performance':
      used = quotaInfo.perfUsed;
      limit = quotaInfo.perfLimit;
      break;
    case 'build':
      used = quotaInfo.buildUsed;
      limit = quotaInfo.buildLimit;
      break;
    case 'image':
      used = quotaInfo.imageUsed;
      limit = quotaInfo.imageLimit;
      break;
    case 'community':
      used = quotaInfo.communityUsed;
      limit = quotaInfo.communityLimit;
      break;
  }

  // Determine color based on usage percentage
  const getStatusColor = () => {
    if (percentage >= 90) return colors.error;
    if (percentage >= 70) return '#FFA500'; // Orange
    return colors.success;
  };

  const isLimitReached = remaining === 0;
  const isUnlimited = limit === Infinity;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.planText}>
          {getPlanName(quotaInfo.planCode)} Plan
        </Text>
        {!isUnlimited && (
          <Text style={[styles.usageText, { color: getStatusColor() }]}>
            {used} / {limit === Infinity ? '∞' : limit} {toolName} uses
          </Text>
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
                You've reached your monthly limit for {toolName}
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

          {!isLimitReached && remaining <= 2 && (
            <Text style={styles.warningText}>
              Only {remaining} {toolName} use{remaining !== 1 ? 's' : ''} remaining this month
            </Text>
          )}
        </>
      )}

      {quotaInfo.planCode === 'ANONYMOUS' && !isLimitReached && (
        <TouchableOpacity
          style={styles.signInPrompt}
          onPress={handleUpgradePress}
        >
          <Text style={styles.signInPromptText}>
            Sign in for more credits!
          </Text>
        </TouchableOpacity>
      )}

      {/* Pricing Modal */}
      <PricingModal
        visible={pricingModalVisible}
        onClose={() => setPricingModalVisible(false)}
        currentPlan={quotaInfo.planCode}
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
});
