// NATIVE APP - Main navigation structure
import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
  </RootStack.Navigator>
);

// Main app tabs (available to all users, auth optional)
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
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
    }}
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

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};
