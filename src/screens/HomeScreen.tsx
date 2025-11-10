// NATIVE APP - Dashboard Home screen with Featured Community
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Animated, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { communityAPI } from '../services/api';
import { colors } from '../theme/colors';
import { ColorValue } from 'react-native'; // Import ColorValue for LinearGradient
import { ArticleModal } from '../components/ArticleModal';
import { ARTICLES, type Article } from '../data/articles';
import { Ionicons } from '@expo/vector-icons';

// Define interfaces for API responses
interface SavedImage {
  id: string;
  imageUrl: string;
  description?: string;
  likesCount?: number;
}

interface CommunityResponse {
  images: SavedImage[];
}

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
    outputRange: [-10, 150],
  });

  const translateY = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [70, 35, 0],
  });

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

// Animated Tool Button Component for Home Screen
const AnimatedToolButton = ({ tool, index, onPress }: { tool: any; index: number; onPress: () => void }) => {
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const scanline = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation for geometric shapes
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

    // Rotation animation
    const rotateAnim = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    );

    // Pulse animation
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

    // Scanline animation
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
    outputRange: [0, -20],
  });

  const translateY2 = float2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });

  const translateY3 = float3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const translateX1 = float1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  const translateX2 = float2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const rotateZ = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scanlineTranslateX = scanline.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 200],
  });

  const glowOpacity = glow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  // Get icon based on tool name
  const getIcon = () => {
    if (tool.name === 'Performance') {
      return 'speedometer';
    } else if (tool.name === 'Build') {
      return 'construct';
    } else if (tool.name === 'Image') {
      return 'camera';
    }
    return 'flash';
  };

  return (
    <TouchableOpacity
      style={styles.toolButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={tool.gradientColors as ColorValue[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.toolButtonGradient}
      >
        {/* Animated geometric shapes */}
        <Animated.View
          style={[
            styles.geometricShape,
            styles.circle1Small,
            { transform: [{ translateY: translateY1 }, { translateX: translateX1 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.geometricShape,
            styles.circle2Small,
            { transform: [{ translateY: translateY2 }, { translateX: translateX2 }, { rotate: rotateZ }] },
          ]}
        />
        <Animated.View
          style={[
            styles.geometricShape,
            styles.square1Small,
            { transform: [{ translateY: translateY3 }, { rotate: rotateZ }] },
          ]}
        />

        {/* Particle system */}
        <Particle delay={0} tool={tool} />
        <Particle delay={300} tool={tool} />
        <Particle delay={600} tool={tool} />

        {/* Scanline sweep */}
        <Animated.View
          style={[
            styles.scanlineSmall,
            {
              transform: [{ translateX: scanlineTranslateX }],
            },
          ]}
        />

        {/* Glassmorphism overlay */}
        <View style={styles.glassOverlaySmall} />

        {/* Animated Icon with glow */}
        <Animated.View style={{ transform: [{ scale: pulse }], alignItems: 'center' }}>
          <Animated.View style={[styles.iconGlowSmall, { opacity: glowOpacity }]} />
          <View style={styles.iconContainerSmall}>
            <Ionicons name={getIcon() as any} size={32} color="#FFFFFF" />
          </View>
        </Animated.View>

        <Text style={styles.toolButtonName}>{tool.name}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  const [featuredCommunity, setFeaturedCommunity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [isAuthenticated])
  );

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load 6 random community images for horizontal swipe
      const communityResponse = await communityAPI.getRandomImages(6) as CommunityResponse;
      setFeaturedCommunity(communityResponse.images || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log('HomeScreen render - ARTICLES count:', ARTICLES.length);
  console.log('HomeScreen render - selectedArticle:', selectedArticle?.title || 'null');

  const tools: {
    icon: string;
    name: string;
    route: string;
    gradientColors: ColorValue[]; // Define as a mutable array of ColorValues
  }[] = [
    {
      icon: '⚡',
      name: 'Performance',
      route: 'PerformanceCalculator',
      gradientColors: [colors.performance.start, colors.performance.end],
    },
    {
      icon: '🔧',
      name: 'Build',
      route: 'BuildPlanner',
      gradientColors: [colors.build.start, colors.build.end],
    },
    {
      icon: '🎨',
      name: 'Image',
      route: 'ImageGenerator',
      gradientColors: [colors.image.start, colors.image.end],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Featured Community Section - Horizontal Swipeable */}
        <View style={styles.bannerSection}>
          <Text style={styles.sectionTitle}>Community Highlights</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : featuredCommunity.length > 0 ? (
            <FlatList
              data={featuredCommunity}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bannerCard}
                  onPress={() => navigation.navigate('Community')}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                  {item.description && (
                    <View style={styles.bannerOverlay}>
                      <Text style={styles.bannerDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  )}
                  <View style={styles.bannerLikes}>
                    <Text style={styles.bannerLikesText}>❤️ {item.likesCount}</Text>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.bannerScrollContent}
              snapToInterval={280}
              decelerationRate="fast"
              pagingEnabled={false}
            />
          ) : (
            <View style={styles.emptyGarage}>
              <Text style={styles.emptyText}>No community posts yet</Text>
            </View>
          )}
        </View>

        {/* Quick Actions - Tool Buttons */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.toolButtons}>
            {tools.map((tool, index) => (
              <AnimatedToolButton
                key={index}
                tool={tool}
                index={index}
                onPress={() => navigation.navigate(tool.route)}
              />
            ))}
          </View>
        </View>

        {/* Articles Section */}
        <View style={styles.articlesSection}>
          {ARTICLES.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => {
                console.log('Article clicked:', article.title);
                setSelectedArticle(article);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.articleHeader} pointerEvents="none">
                <Text style={styles.articleTitle}>{article.title}</Text>
              </View>
              <Text style={styles.articlePreview} pointerEvents="none">{article.preview}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign In CTA for unauthenticated users */}
        {!isAuthenticated && (
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Save Your Work</Text>
            <Text style={styles.ctaText}>
              Sign in to save your calculations, generated images, and access your garage from any device
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.ctaButtonText}>Sign In Free</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal
          visible={true}
          onClose={() => {
            console.log('Closing article modal');
            setSelectedArticle(null);
          }}
          title={selectedArticle.title}
          content={selectedArticle.content}
        />
      )}
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
    paddingBottom: 100,
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
  userBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  userPlan: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  bannerSection: {
    marginBottom: 24,
  },
  bannerScrollContent: {
    paddingHorizontal: 20,
  },
  loader: {
    marginVertical: 20,
  },
  garageCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  garageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  garageCardTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  garageCardIcon: {
    fontSize: 24,
  },
  garageCardVehicle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  garageCardStats: {
    flexDirection: 'column',
    gap: 8,
  },
  garageStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  garageStatHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  garageStatLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'left',
  },
  garageStatValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  garageStatModified: {
    color: colors.primary,
  },
  garageImagesSection: {
    marginTop: 8,
  },
  garageImagesTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  garageImages: {
    flexDirection: 'row',
    gap: 12,
  },
  garageImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.secondary,
  },
  emptyGarage: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  bannerCard: {
    width: 260,
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.secondary,
    marginRight: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 16,
  },
  bannerDescription: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  bannerLikes: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bannerLikesText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  toolButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  toolButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toolButtonGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  toolButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  toolButtonName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    zIndex: 10,
  },
  // Animation styles for home screen tool buttons
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  geometricShape: {
    position: 'absolute',
    opacity: 0.15,
  },
  circle1Small: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    top: 10,
    left: 10,
  },
  circle2Small: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    bottom: 15,
    right: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  square1Small: {
    width: 25,
    height: 25,
    backgroundColor: '#FFFFFF',
    top: 60,
    right: 20,
  },
  scanlineSmall: {
    position: 'absolute',
    width: 30,
    height: '150%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '25deg' }],
    left: -50,
  },
  glassOverlaySmall: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainerSmall: {
    zIndex: 10,
    marginBottom: 8,
  },
  iconGlowSmall: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    top: -9,
    left: -9,
  },
  articlesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  articleCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 12,
  },
  articleHeader: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  articlePreview: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    lineHeight: 20,
  },
  ctaCard: {
    marginHorizontal: 20,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
