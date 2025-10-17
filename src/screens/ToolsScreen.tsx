// NATIVE APP - Tools list screen
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

const ToolsScreen = ({ navigation }: any) => {
  const { user } = useAuth();

  const tools = [
    {
      name: 'Performance Calculator',
      description: 'AI-powered performance estimates',
      icon: '⚡',
      gradientColors: [colors.performance.start, colors.performance.end],
      usage: user ? `${user.perfUsed}/100` : '0/10',
      comingSoon: false,
    },
    {
      name: 'Build Planner',
      description: 'Detailed upgrade plans & parts',
      icon: '🔧',
      gradientColors: [colors.build.start, colors.build.end],
      usage: user ? `${user.buildUsed}/100` : '0/10',
      comingSoon: false,
    },
    {
      name: 'AI Image Generator',
      description: 'Generate stunning car visuals',
      icon: '🎨',
      gradientColors: [colors.image.start, colors.image.end],
      usage: user ? `${user.imageUsed}/100` : '0/10',
      comingSoon: false,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tools</Text>
          <Text style={styles.subtitle}>Select a tool to get started</Text>
        </View>

        {/* Tools List */}
        <View style={styles.toolsList}>
          {tools.map((tool, index) => (
            <TouchableOpacity
              key={index}
              style={styles.toolCard}
              disabled={tool.comingSoon}
              onPress={() => {
                if (tool.comingSoon) return;
                if (tool.name === 'Performance Calculator') {
                  navigation.navigate('PerformanceCalculator');
                } else if (tool.name === 'Build Planner') {
                  navigation.navigate('BuildPlanner');
                } else if (tool.name === 'AI Image Generator') {
                  navigation.navigate('ImageGenerator');
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
                <Text style={styles.toolIcon}>{tool.icon}</Text>
                {tool.comingSoon && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                )}
              </LinearGradient>
              <View style={styles.toolInfo}>
                <View style={styles.toolTextContainer}>
                  <Text style={styles.toolName}>{tool.name}</Text>
                  <Text style={styles.toolDescription}>{tool.description}</Text>
                </View>
                <View style={styles.usageBadge}>
                  <Text style={styles.usageText}>{tool.usage}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  toolsList: {
    paddingHorizontal: 20,
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
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    opacity: 0.9,
  },
  toolIcon: {
    fontSize: 48,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comingSoonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  toolInfo: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolTextContainer: {
    flex: 1,
  },
  toolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  usageBadge: {
    backgroundColor: colors.divider,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  usageText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ToolsScreen;
