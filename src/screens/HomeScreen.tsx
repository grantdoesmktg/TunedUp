// NATIVE APP - Dashboard Home screen with Featured Community
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { communityAPI } from '../services/api';
import { colors } from '../theme/colors';
import { ColorValue } from 'react-native'; // Import ColorValue for LinearGradient
import { ArticleModal } from '../components/ArticleModal';
import { ARTICLES, type Article } from '../data/articles';

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

const HomeScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  const [featuredCommunity, setFeaturedCommunity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
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
      // Load 6 random community images for the auto-scrolling banner
      const communityResponse = await communityAPI.getRandomImages(6) as CommunityResponse;
      setFeaturedCommunity(communityResponse.images || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll effect using Animated API (doesn't block touches)
  useEffect(() => {
    if (featuredCommunity.length === 0) return;

    const CARD_WIDTH = 280; // Width of each card + gap
    const totalWidth = CARD_WIDTH * featuredCommunity.length;
    const duration = totalWidth * 50; // milliseconds (slower = longer duration)

    // Animate from 0 to totalWidth
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollX, {
          toValue: totalWidth,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(scrollX, {
          toValue: 0,
          duration: 0, // Instant reset
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [featuredCommunity, scrollX]);

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
        {/* Featured Community Section - Auto-scrolling Banner */}
        <View style={styles.bannerSection}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : featuredCommunity.length > 0 ? (
            <Animated.View
              style={[
                styles.bannerScroll,
                {
                  transform: [{ translateX: Animated.multiply(scrollX, -1) }],
                  flexDirection: 'row',
                },
              ]}
            >
              {/* Duplicate images for seamless looping effect */}
              {[...featuredCommunity, ...featuredCommunity].map((image, index) => (
                <TouchableOpacity
                  key={`${image.id}-${index}`}
                  style={styles.bannerCard}
                  onPress={() => navigation.navigate('Community')}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: image.imageUrl }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                  {image.description && (
                    <View style={styles.bannerOverlay}>
                      <Text style={styles.bannerDescription} numberOfLines={2}>
                        {image.description}
                      </Text>
                    </View>
                  )}
                  <View style={styles.bannerLikes}>
                    <Text style={styles.bannerLikesText}>❤️ {image.likesCount}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
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
              <TouchableOpacity
                key={index}
                style={styles.toolButton}
                onPress={() => navigation.navigate(tool.route)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={tool.gradientColors as ColorValue[]} // Explicitly cast to ColorValue[]
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.toolButtonGradient}
                >
                  <Text style={styles.toolButtonIcon}>{tool.icon}</Text>
                  <Text style={styles.toolButtonName}>{tool.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
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
  bannerSection: {
    marginBottom: 32,
    height: 320,
    overflow: 'hidden',
  },
  bannerScroll: {
    height: 320,
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
  },
  toolButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  toolButtonName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
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
