// NATIVE APP - Token Context for usage tracking and limits
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import type { TokenInfo, ToolType, PlanCode, TokenStatus } from '../types/quota';
import { PLAN_TOKENS, TOKEN_COSTS, getPlanTokens, getToolCost } from '../types/quota';

const ANONYMOUS_TOKEN_KEY = '@tunedUp_anonymousTokens';

interface QuotaContextType {
  tokenInfo: TokenInfo | null;
  isLoading: boolean;
  checkTokens: (toolType: ToolType) => Promise<TokenStatus>;
  refreshTokens: () => Promise<void>;
  getRemainingTokens: () => number;
  canAfford: (toolType: ToolType) => boolean;
  incrementAnonymousUsage: (toolType: ToolType) => Promise<void>;
}

const QuotaContext = createContext<QuotaContextType | undefined>(undefined);

export const QuotaProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load token info when user changes
  useEffect(() => {
    if (user) {
      loadTokensFromUser();
    } else {
      loadAnonymousTokens();
    }
  }, [user, isAuthenticated]);

  // Load token info from authenticated user
  const loadTokensFromUser = () => {
    if (!user) return;

    const planCode = (user.planCode as PlanCode) || 'FREE';

    console.log('Loading tokens from user:', {
      planCode,
      tokens: user.tokens,
    });

    setTokenInfo({
      planCode,
      tokens: user.tokens || getPlanTokens(planCode),
      communityUsed: user.communityUsed || 0,
      resetDate: user.resetDate || new Date(),
    });
  };

  // Load token info for anonymous users from local storage
  const loadAnonymousTokens = async () => {
    try {
      const storedTokens = await AsyncStorage.getItem(ANONYMOUS_TOKEN_KEY);

      if (storedTokens) {
        const parsed = JSON.parse(storedTokens);
        setTokenInfo({
          planCode: 'ANONYMOUS',
          tokens: parsed.tokens || PLAN_TOKENS.ANONYMOUS,
          communityUsed: parsed.communityUsed || 0,
          resetDate: parsed.resetDate ? new Date(parsed.resetDate) : new Date(),
        });
      } else {
        // First time anonymous user
        const newTokenInfo = {
          planCode: 'ANONYMOUS' as PlanCode,
          tokens: PLAN_TOKENS.ANONYMOUS,
          communityUsed: 0,
          resetDate: new Date(),
        };
        setTokenInfo(newTokenInfo);
        await AsyncStorage.setItem(ANONYMOUS_TOKEN_KEY, JSON.stringify(newTokenInfo));
      }
    } catch (error) {
      console.error('Failed to load anonymous tokens:', error);
      // Fallback to default
      setTokenInfo({
        planCode: 'ANONYMOUS',
        tokens: PLAN_TOKENS.ANONYMOUS,
        communityUsed: 0,
        resetDate: new Date(),
      });
    }
  };

  // Deduct tokens for anonymous usage and save to storage
  const incrementAnonymousUsage = async (toolType: ToolType) => {
    if (!tokenInfo || tokenInfo.planCode !== 'ANONYMOUS') return;

    const cost = getToolCost(toolType);
    const updatedTokenInfo = {
      ...tokenInfo,
      tokens: Math.max(0, tokenInfo.tokens - cost),
    };

    // Increment community usage if it's a community action
    if (toolType === 'community') {
      updatedTokenInfo.communityUsed += 1;
    }

    setTokenInfo(updatedTokenInfo);
    await AsyncStorage.setItem(ANONYMOUS_TOKEN_KEY, JSON.stringify(updatedTokenInfo));
  };

  // Check if user can afford an action (local check)
  const checkTokens = async (toolType: ToolType): Promise<TokenStatus> => {
    if (!tokenInfo) {
      return {
        allowed: false,
        error: 'Token information not loaded',
      };
    }

    const cost = getToolCost(toolType);

    // Admin has unlimited
    if (tokenInfo.planCode === 'ADMIN') {
      return {
        allowed: true,
        tokens: Infinity,
        cost,
      };
    }

    if (tokenInfo.tokens >= cost) {
      return {
        allowed: true,
        tokens: tokenInfo.tokens,
        cost,
      };
    }

    return {
      allowed: false,
      tokens: tokenInfo.tokens,
      cost,
      error: `Insufficient tokens. You need ${cost} tokens but only have ${tokenInfo.tokens}.`,
    };
  };

  // Refresh token info from server
  const refreshTokens = async () => {
    if (user) {
      // For logged-in users, fetch fresh data from backend
      // This is handled by AuthContext.refreshUser() which updates the user object
      // and triggers our useEffect to reload tokens from the updated user
      loadTokensFromUser();
    } else {
      // For anonymous users, keep local state
      loadAnonymousTokens();
    }
  };

  // Get remaining tokens
  const getRemainingTokens = (): number => {
    if (!tokenInfo) return 0;
    if (tokenInfo.planCode === 'ADMIN') return Infinity;
    return tokenInfo.tokens;
  };

  // Check if user can afford a tool
  const canAfford = (toolType: ToolType): boolean => {
    if (!tokenInfo) return false;
    if (tokenInfo.planCode === 'ADMIN') return true;
    const cost = getToolCost(toolType);
    return tokenInfo.tokens >= cost;
  };

  const value = {
    tokenInfo,
    isLoading,
    checkTokens,
    refreshTokens,
    getRemainingTokens,
    canAfford,
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
