// NATIVE APP - Quota Context for usage tracking and limits
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quotaAPI } from '../services/api';
import { useAuth } from './AuthContext';
import type { QuotaInfo, ToolType, PlanCode, QuotaStatus } from '../types/quota';
import { PLAN_LIMITS, getPlanLimits } from '../types/quota';

const ANONYMOUS_QUOTA_KEY = '@tunedUp_anonymousQuota';

interface QuotaContextType {
  quotaInfo: QuotaInfo | null;
  isLoading: boolean;
  checkQuota: (toolType: ToolType) => Promise<QuotaStatus>;
  refreshQuota: () => Promise<void>;
  getUsagePercentage: (toolType: ToolType) => number;
  getRemainingUses: (toolType: ToolType) => number;
  incrementAnonymousUsage: (toolType: ToolType) => Promise<void>;
}

const QuotaContext = createContext<QuotaContextType | undefined>(undefined);

export const QuotaProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load quota info when user changes
  useEffect(() => {
    if (user) {
      loadQuotaFromUser();
    } else {
      loadAnonymousQuota();
    }
  }, [user, isAuthenticated]);

  // Load quota info from authenticated user
  const loadQuotaFromUser = () => {
    if (!user) return;

    const planCode = (user.planCode as PlanCode) || 'FREE';
    const limits = getPlanLimits(planCode);

    console.log('Loading quota from user:', {
      planCode,
      perfUsed: user.perfUsed,
      buildUsed: user.buildUsed,
      imageUsed: user.imageUsed,
      communityUsed: user.communityUsed,
    });

    setQuotaInfo({
      planCode,
      perfUsed: user.perfUsed || 0,
      perfLimit: limits.perf,
      buildUsed: user.buildUsed || 0,
      buildLimit: limits.build,
      imageUsed: user.imageUsed || 0,
      imageLimit: limits.image,
      communityUsed: user.communityUsed || 0,
      communityLimit: limits.community,
      resetDate: user.resetDate || new Date(),
    });
  };

  // Load quota info for anonymous users from local storage
  const loadAnonymousQuota = async () => {
    try {
      const storedQuota = await AsyncStorage.getItem(ANONYMOUS_QUOTA_KEY);
      const limits = PLAN_LIMITS.ANONYMOUS;

      if (storedQuota) {
        const parsed = JSON.parse(storedQuota);
        setQuotaInfo({
          planCode: 'ANONYMOUS',
          perfUsed: parsed.perfUsed || 0,
          perfLimit: limits.perf,
          buildUsed: parsed.buildUsed || 0,
          buildLimit: limits.build,
          imageUsed: parsed.imageUsed || 0,
          imageLimit: limits.image,
          communityUsed: parsed.communityUsed || 0,
          communityLimit: limits.community,
          resetDate: parsed.resetDate ? new Date(parsed.resetDate) : new Date(),
        });
      } else {
        // First time anonymous user
        const newQuota = {
          planCode: 'ANONYMOUS',
          perfUsed: 0,
          perfLimit: limits.perf,
          buildUsed: 0,
          buildLimit: limits.build,
          imageUsed: 0,
          imageLimit: limits.image,
          communityUsed: 0,
          communityLimit: limits.community,
          resetDate: new Date(),
        };
        setQuotaInfo(newQuota);
        await AsyncStorage.setItem(ANONYMOUS_QUOTA_KEY, JSON.stringify(newQuota));
      }
    } catch (error) {
      console.error('Failed to load anonymous quota:', error);
      // Fallback to default
      const limits = PLAN_LIMITS.ANONYMOUS;
      setQuotaInfo({
        planCode: 'ANONYMOUS',
        perfUsed: 0,
        perfLimit: limits.perf,
        buildUsed: 0,
        buildLimit: limits.build,
        imageUsed: 0,
        imageLimit: limits.image,
        communityUsed: 0,
        communityLimit: limits.community,
        resetDate: new Date(),
      });
    }
  };

  // Increment anonymous usage and save to storage
  const incrementAnonymousUsage = async (toolType: ToolType) => {
    if (!quotaInfo || quotaInfo.planCode !== 'ANONYMOUS') return;

    const updatedQuota = { ...quotaInfo };

    switch (toolType) {
      case 'performance':
        updatedQuota.perfUsed += 1;
        break;
      case 'build':
        updatedQuota.buildUsed += 1;
        break;
      case 'image':
        updatedQuota.imageUsed += 1;
        break;
      case 'community':
        updatedQuota.communityUsed += 1;
        break;
    }

    setQuotaInfo(updatedQuota);
    await AsyncStorage.setItem(ANONYMOUS_QUOTA_KEY, JSON.stringify(updatedQuota));
  };

  // Check if user can perform action (local check, no API call needed)
  const checkQuota = async (toolType: ToolType): Promise<QuotaStatus> => {
    // Check locally based on current quota info
    if (!quotaInfo) {
      return {
        allowed: false,
        error: 'Quota information not loaded',
      };
    }

    const remaining = getRemainingUses(toolType);

    if (remaining === Infinity || remaining > 0) {
      return {
        allowed: true,
        remaining,
      };
    }

    return {
      allowed: false,
      error: 'Quota limit reached. Please upgrade your plan.',
      remaining: 0,
    };
  };

  // Refresh quota info from server
  const refreshQuota = async () => {
    if (user) {
      // For logged-in users, fetch fresh data from backend
      // This is handled by AuthContext.refreshUser() which updates the user object
      // and triggers our useEffect to reload quota from the updated user
      loadQuotaFromUser();
    } else {
      // For anonymous users, keep local state
      // Backend tracks usage by fingerprint, but we don't sync it to the app
      loadAnonymousQuota();
    }
  };

  // Get usage percentage for a tool
  const getUsagePercentage = (toolType: ToolType): number => {
    if (!quotaInfo) return 0;

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

    if (limit === Infinity) return 0;
    return (used / limit) * 100;
  };

  // Get remaining uses for a tool
  const getRemainingUses = (toolType: ToolType): number => {
    if (!quotaInfo) return 0;

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

    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - used);
  };

  const value = {
    quotaInfo,
    isLoading,
    checkQuota,
    refreshQuota,
    getUsagePercentage,
    getRemainingUses,
    incrementAnonymousUsage,
  };

  return <QuotaContext.Provider value={value}>{children}</QuotaContext.Provider>;
};

export const useQuota = () => {
  const context = useContext(QuotaContext);
  if (context === undefined) {
    throw new Error('useQuota must be used within a QuotaProvider');
  }
  return context;
};
