// NATIVE APP - Home screen with large tool cards
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

const HomeScreen = ({ navigation }: any) => {
  const { user, isAuthenticated } = useAuth();

  const tools = [
    {
      name: 'Performance Calculator',
      description: 'Get AI-powered estimates for horsepower, torque, and 0-60 times based on your mods',
      icon: '⚡',
      gradientColors: [colors.performance.start, colors.performance.end],
      usage: user ? `${user.perfUsed}/100` : '0/10',
      type: 'performance',
    },
    {
      name: 'Build Planner',
      description: 'Create detailed upgrade plans with parts recommendations and cost estimates',
      icon: '🔧',
      gradientColors: [colors.build.start, colors.build.end],
      usage: user ? `${user.buildUsed}/100` : '0/10',
      type: 'build',
    },
    {
      name: 'AI Image Generator',
      description: 'Generate stunning visuals of your dream car with AI-powered image generation',
      icon: '🎨',
      gradientColors: [colors.image.start, colors.image.end],
      usage: user ? `${user.imageUsed}/100` : '0/10',
      type: 'image',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>TunedUp</Text>
          {isAuthenticated ? (
            <Text style={styles.welcomeText}>Welcome back, {user?.email}</Text>
          ) : (
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Automotive Tools Powered by AI</Text>
          <Text style={styles.heroSubtitle}>
            Calculate performance, plan builds, and generate stunning car images
          </Text>
        </View>

        {/* Tools Grid */}
        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>Available Tools</Text>
          {tools.map((tool, index) => (
            <TouchableOpacity
              key={index}
              style={styles.toolCard}
              onPress={() => {
                if (tool.type === 'performance') {
                  navigation.navigate('PerformanceCalculator');
                } else if (tool.type === 'build') {
                  navigation.navigate('BuildPlanner');
                } else if (tool.type === 'image') {
                  navigation.navigate('ImageGenerator');
                } else {
                  navigation.navigate('Tools');
                }
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={tool.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.toolGradient}
              >
                <View style={styles.toolIconContainer}>
                  <Text style={styles.toolIcon}>{tool.icon}</Text>
                </View>
                <View style={styles.usageBadge}>
                  <Text style={styles.usageText}>{tool.usage}</Text>
                </View>
              </LinearGradient>
              <View style={styles.toolContent}>
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Free Tier Notice */}
        {!isAuthenticated && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              🎉 Try all tools for free! Sign in to save your work and get more credits.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signInButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  signInText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  hero: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  toolsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  toolCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  toolGradient: {
    height: 160,
    justifyContent: 'space-between',
    padding: 16,
    opacity: 0.9,
  },
  toolIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 32,
  },
  usageBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  usageText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  toolContent: {
    padding: 16,
  },
  toolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  toolDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  notice: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  noticeText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HomeScreen;
