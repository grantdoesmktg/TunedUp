// NATIVE APP - Main navigation structure
import React, { useState } from 'react';
import { Platform, Image, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { PricingModal } from '../components/PricingModal';
import { initializeStripePayment } from '../services/stripe';
import type { PlanCode } from '../types/quota';
import { TokenDisplay } from '../components/TokenIcon';
import { useQuota } from '../contexts/QuotaContext';

// Placeholder screens - will build these next
import HomeScreen from '../screens/HomeScreen';
import ToolsScreen from '../screens/ToolsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import PerformanceCalculatorScreen from '../screens/PerformanceCalculatorScreen';
import PerformanceResultsScreen from '../screens/PerformanceResultsScreen';
import BuildPlannerScreen from '../screens/BuildPlannerScreen';
import BuildPlanResultsScreen from '../screens/BuildPlanResultsScreen';
import ImageGeneratorScreen from '../screens/ImageGeneratorScreen';
import ImageResultsScreen from '../screens/ImageResultsScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Header components
const HeaderLeft = () => (
  <Image
    source={require('../../assets/logo-horizontal.png')}
    style={styles.headerLogo}
    resizeMode="contain"
  />
);

const HeaderRight = ({ navigation }: any) => {
  const { user, isAuthenticated } = useAuth();
  const { tokenInfo } = useQuota();
  const [showPricingModal, setShowPricingModal] = useState(false);

  const getPlanBadgeStyle = (planCode: PlanCode) => {
    switch (planCode) {
      case 'FREE':
        return { bg: '#6B7280', text: 'FREE' };
      case 'PRO':
        return { bg: '#3B82F6', text: 'PRO' };
      case 'PLUS':
        return { bg: '#8B5CF6', text: 'PLUS' };
      case 'ULTRA':
        return { bg: '#F59E0B', text: 'ULTRA' };
      case 'ADMIN':
        return { bg: '#EF4444', text: 'ADMIN' };
      default:
        return { bg: '#6B7280', text: 'FREE' };
    }
  };

  const handleBadgePress = () => {
    if (user?.planCode && ['FREE', 'PRO', 'PLUS', 'ADMIN'].includes(user.planCode)) {
      setShowPricingModal(true);
    }
  };

  const handleUpgrade = async (planCode: PlanCode, priceId: string) => {
    console.log('📋 AppNavigator handleUpgrade received:', {
      planCode,
      priceId,
      userEmail: user?.email,
      hasUser: !!user
    });
    try {
      await initializeStripePayment(planCode, priceId, user?.email);
      setShowPricingModal(false);
    } catch (error) {
      console.error('Payment initialization failed:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const planCode = user.planCode || 'FREE';
  const badgeStyle = getPlanBadgeStyle(planCode);
  const isUpgradeable = ['FREE', 'PRO', 'PLUS', 'ADMIN'].includes(planCode);
  const tokens = tokenInfo?.tokens ?? 0;

  return (
    <View style={styles.headerRight}>
      <TokenDisplay amount={tokens} size="small" style={styles.tokenDisplay} />
      <TouchableOpacity
        style={[styles.planBadge, { backgroundColor: badgeStyle.bg }]}
        onPress={handleBadgePress}
        disabled={!isUpgradeable}
        activeOpacity={isUpgradeable ? 0.7 : 1}
      >
        <Text style={styles.planBadgeText}>{badgeStyle.text}</Text>
      </TouchableOpacity>

      <PricingModal
        visible={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSelectPlan={handleUpgrade}
        currentPlan={planCode}
      />
    </View>
  );
};

// Auth stack for login flow
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
  </Stack.Navigator>
);

// Root stack that includes both tabs and auth screens
const RootStack = createNativeStackNavigator();

const RootNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={MainTabs} />
    <RootStack.Screen name="Login" component={LoginScreen} />
    <RootStack.Screen name="VerifyCode" component={VerifyCodeScreen} />
    <RootStack.Screen name="PerformanceCalculator" component={PerformanceCalculatorScreen} />
    <RootStack.Screen name="PerformanceResults" component={PerformanceResultsScreen} />
    <RootStack.Screen name="BuildPlanner" component={BuildPlannerScreen} />
    <RootStack.Screen name="BuildPlanResults" component={BuildPlanResultsScreen} />
    <RootStack.Screen name="ImageGenerator" component={ImageGeneratorScreen} />
    <RootStack.Screen name="ImageResults" component={ImageResultsScreen} />
    <RootStack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ headerShown: false }} />
    <RootStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <RootStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
  </RootStack.Navigator>
);

// Main app tabs with swipe gesture support
const MainTabs = () => {
  const tabNavigationRef = React.useRef<any>(null);

  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerTitle: '',
        headerLeft: () => <HeaderLeft />,
        headerRight: () => <HeaderRight navigation={navigation} />,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.secondary,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tools"
        component={ToolsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  headerLogo: {
    height: 32,
    width: 120,
    marginLeft: 16,
  },
  headerRight: {
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenDisplay: {
    // Additional spacing for token display to the left of plan badge
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signInText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
