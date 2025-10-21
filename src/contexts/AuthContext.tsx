// NATIVE APP - Auth Context with JWT state management
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI, getToken, setToken } from '../services/api';
import type { User } from '../types';

// 🔧 DEV ONLY: Set to true to auto-login with your account on app start
const DEV_AUTO_LOGIN = true;
const DEV_EMAIL = 'grantdoesmktg@gmail.com';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth token on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getToken();
      if (token) {
        const response = await authAPI.getMe();
        setUser(response.user);
        return;
      }

      // 🔧 DEV AUTO-LOGIN: Automatically login without email verification
      if (DEV_AUTO_LOGIN && !token) {
        console.log('🔧 DEV MODE: Auto-logging in as', DEV_EMAIL);

        const response = await authAPI.devLogin(DEV_EMAIL);
        if (response.success && response.user) {
          setUser(response.user);
          console.log('✅ DEV AUTO-LOGIN SUCCESS:', response.user.email, '- Plan:', response.user.planCode);
        } else {
          console.error('❌ DEV AUTO-LOGIN FAILED:', response.error);
        }
      }
    } catch (error) {
      console.log('No valid session:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      const response = await authAPI.sendMagicLink(email);
      return { success: response.success, message: response.message };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to send magic link' };
    }
  };

  const login = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.verifyCode(email, code);
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    console.log('🔄 Refreshing user data...');
    try {
      const response = await authAPI.getMe();
      console.log('✅ User data refreshed:', {
        perfUsed: response.user.perfUsed,
        buildUsed: response.user.buildUsed,
        imageUsed: response.user.imageUsed,
        communityUsed: response.user.communityUsed,
      });
      setUser(response.user);
      // Quota context will automatically update when user state changes
    } catch (error) {
      console.error('❌ Failed to refresh user:', error);
      // Don't set user to null on refresh error - keep existing user data
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    sendMagicLink,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
