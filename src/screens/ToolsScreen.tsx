// NATIVE APP - Tools list screen
import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { TokenCost } from '../components/TokenIcon';
import { TOKEN_COSTS } from '../types/quota';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive font sizing based on screen width
const getFontSize = (baseSize: number) => {
  const scale = SCREEN_WIDTH / 375; // 375 is the base width (iPhone SE/8)
  const newSize = baseSize * scale;
  return Math.round(newSize);
};

// Particle component for each floating particle
const Particle = ({ delay, tool }: { delay: number; tool: any }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(progress, {
            toValue: 1,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(1400),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    sequence.start();
    return () => sequence.stop();
  }, []);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 400],
  });

  const translateY = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [140, 70, 0],
  });

  // Get particle color based on tool gradient
  const particleColor = tool.gradientColors[1];

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: particleColor,
          opacity,
          transform: [{ translateX }, { translateY }],
        },
      ]}
    />
  );
};

// Animated Tool Thumbnail Component
const AnimatedToolThumbnail = ({ tool, index }: { tool: any; index: number }) => {
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const scanline = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // FASTER Floating animation for geometric shapes
    const floatAnim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(float1, {
          toValue: 1,
          duration: 1200 + index * 200,
          useNativeDriver: true,
        }),
        Animated.timing(float1, {
          toValue: 0,
          duration: 1200 + index * 200,
          useNativeDriver: true,
        }),
      ])
    );

    const floatAnim2 = Animated.loop(
      Animated.sequence([
        Animated.timing(float2, {
          toValue: 1,
          duration: 1500 + index * 150,
          useNativeDriver: true,
        }),
        Animated.timing(float2, {
          toValue: 0,
          duration: 1500 + index * 150,
          useNativeDriver: true,
        }),
      ])
    );

    const floatAnim3 = Animated.loop(
      Animated.sequence([
        Animated.timing(float3, {
          toValue: 1,
          duration: 1800 + index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(float3, {
          toValue: 0,
          duration: 1800 + index * 100,
          useNativeDriver: true,
        }),
      ])
    );

    // FASTER Rotation animation
    const rotateAnim = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    );

    // FASTER Pulse animation
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Scanline animation - sweeps across
    const scanlineAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanline, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(scanline, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    // Glow pulse
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    floatAnim1.start();
    floatAnim2.start();
    floatAnim3.start();
    rotateAnim.start();
    pulseAnim.start();
    scanlineAnim.start();
    glowAnim.start();

    return () => {
      floatAnim1.stop();
      floatAnim2.stop();
      floatAnim3.stop();
      rotateAnim.stop();
      pulseAnim.stop();
      scanlineAnim.stop();
      glowAnim.stop();
    };
  }, []);

  const translateY1 = float1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const translateY2 = float2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 35],
  });

  const translateY3 = float3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const translateX1 = float1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  const translateX2 = float2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const rotateZ = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scanlineTranslateX = scanline.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 500],
  });

  const glowOpacity = glow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  // Get icon based on tool name
  const getIcon = () => {
    if (tool.name === 'Performance Calculator') {
      return 'speedometer';
    } else if (tool.name === 'Build Planner') {
      return 'construct';
    } else if (tool.name === 'AI Image Generator') {
      return 'camera';
    }
    return 'flash';
  };

  return (
    <LinearGradient
      colors={tool.gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.toolGradient}
    >
      {/* Animated geometric shapes in background with PARALLAX */}
      <Animated.View
        style={[
          styles.geometricShape,
          styles.circle1,
          { transform: [{ translateY: translateY1 }, { translateX: translateX1 }] },
        ]}
      />
      <Animated.View
        style={[
          styles.geometricShape,
          styles.circle2,
          { transform: [{ translateY: translateY2 }, { translateX: translateX2 }, { rotate: rotateZ }] },
        ]}
      />
      <Animated.View
        style={[
          styles.geometricShape,
          styles.square1,
          { transform: [{ translateY: translateY3 }, { rotate: rotateZ }] },
        ]}
      />

      {/* PARTICLE SYSTEM - Multiple particles flowing across */}
      <Particle delay={0} tool={tool} />
      <Particle delay={400} tool={tool} />
      <Particle delay={800} tool={tool} />
      <Particle delay={1200} tool={tool} />
      <Particle delay={1600} tool={tool} />

      {/* Scanline sweep effect */}
      <Animated.View
        style={[
          styles.scanline,
          {
            transform: [{ translateX: scanlineTranslateX }],
          },
        ]}
      />

      {/* Glassmorphism overlay */}
      <View style={styles.glassOverlay} />

      {/* Animated Icon with GLOW */}
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Animated.View style={[styles.iconGlow, { opacity: glowOpacity }]} />
        <View style={styles.iconContainer}>
          <Ionicons name={getIcon() as any} size={48} color="#FFFFFF" />
        </View>
      </Animated.View>

      {/* Coming Soon Badge */}
      {tool.comingSoon && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const ToolsScreen = ({ navigation }: any) => {
  const { user } = useAuth();

  const tools = [
    {
      name: 'Performance Calculator',
      description: 'AI-powered performance estimates',
      icon: '⚡',
      gradientColors: [colors.performance.start, colors.performance.end],
      comingSoon: false,
      tokenCost: TOKEN_COSTS.performance,
    },
    {
      name: 'Build Planner',
      description: 'Detailed upgrade plans & parts',
      icon: '🔧',
      gradientColors: [colors.build.start, colors.build.end],
      comingSoon: false,
      tokenCost: TOKEN_COSTS.build,
    },
    {
      name: 'AI Image Generator',
      description: 'Generate stunning car visuals',
      icon: '🎨',
      gradientColors: [colors.image.start, colors.image.end],
      comingSoon: false,
      tokenCost: TOKEN_COSTS.image,
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
              <AnimatedToolThumbnail tool={tool} index={index} />
              <View style={styles.toolInfo}>
                <View style={styles.toolTextContainer}>
                  <Text style={styles.toolName}>{tool.name}</Text>
                  <Text style={styles.toolDescription}>{tool.description}</Text>
                </View>
                <TokenCost cost={tool.tokenCost} size="medium" />
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
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  geometricShape: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
  },
  circle1: {
    width: 100,
    height: 100,
    top: -30,
    left: 15,
    borderRadius: 50,
  },
  circle2: {
    width: 70,
    height: 70,
    bottom: 5,
    right: 25,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  square1: {
    width: 60,
    height: 60,
    top: 20,
    right: -15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  scanline: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ skewX: '-15deg' }],
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    top: -20,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
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
    fontSize: getFontSize(18),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: getFontSize(14),
    color: colors.textSecondary,
  },
});

export default ToolsScreen;
