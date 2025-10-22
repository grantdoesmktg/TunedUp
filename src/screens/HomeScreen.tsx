// NATIVE APP - Dashboard Home screen with Your Garage and Featured Community
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI, communityAPI } from '../services/api';
import { colors } from '../theme/colors';

const HomeScreen = ({ navigation }: any) => {
  const { user, isAuthenticated } = useAuth();
  const [savedPerformance, setSavedPerformance] = useState<any>(null);
  const [savedImages, setSavedImages] = useState<any[]>([]);
  const [featuredCommunity, setFeaturedCommunity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load user's garage (if authenticated)
      if (isAuthenticated) {
        const [perfResponse, imagesResponse] = await Promise.all([
          profileAPI.getSavedPerformance().catch(() => ({ performance: null })),
          profileAPI.getSavedImages().catch(() => ({ images: [] })),
        ]);
        setSavedPerformance(perfResponse.performance);
        setSavedImages(imagesResponse.images || []);
      }

      // Load random community images (always, even if not authenticated)
      const communityResponse = await communityAPI.getRandomImages(3);
      setFeaturedCommunity(communityResponse.images || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tools = [
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>TunedUp</Text>
          {isAuthenticated && user ? (
            <View style={styles.userBadge}>
              <Text style={styles.userPlan}>{user.planCode}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Your Garage Section */}
        {isAuthenticated && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏁 Your Garage</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.sectionLink}>View Profile →</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : (
              <>
                {/* Saved Performance */}
                {savedPerformance ? (
                  <TouchableOpacity
                    style={styles.garageCard}
                    onPress={() => navigation.navigate('PerformanceResults', {
                      results: savedPerformance.results,
                      carInput: savedPerformance.carInput
                    })}
                  >
                    <View style={styles.garageCardHeader}>
                      <Text style={styles.garageCardTitle}>Performance Calc</Text>
                      <Text style={styles.garageCardIcon}>⚡</Text>
                    </View>
                    <Text style={styles.garageCardVehicle}>
                      {savedPerformance.carInput.year} {savedPerformance.carInput.make} {savedPerformance.carInput.model}
                    </Text>
                    <View style={styles.garageCardStats}>
                      <View style={styles.garageStat}>
                        <Text style={styles.garageStatLabel}>Stock</Text>
                        <Text style={styles.garageStatValue}>
                          {savedPerformance.results.stockPerformance.whp} WHP
                        </Text>
                      </View>
                      <Text style={styles.garageArrow}>→</Text>
                      <View style={styles.garageStat}>
                        <Text style={styles.garageStatLabel}>Modified</Text>
                        <Text style={[styles.garageStatValue, styles.garageStatModified]}>
                          {savedPerformance.results.estimatedPerformance.whp} WHP
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptyGarage}>
                    <Text style={styles.emptyText}>No saved performance yet</Text>
                    <TouchableOpacity
                      style={styles.emptyButton}
                      onPress={() => navigation.navigate('PerformanceCalculator')}
                    >
                      <Text style={styles.emptyButtonText}>Calculate Now</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Saved Images */}
                {savedImages.length > 0 ? (
                  <View style={styles.garageImagesSection}>
                    <Text style={styles.garageImagesTitle}>Saved Images ({savedImages.length}/3)</Text>
                    <View style={styles.garageImages}>
                      {savedImages.map((image) => (
                        <Image
                          key={image.id}
                          source={{ uri: image.imageUrl }}
                          style={styles.garageImage}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyGarage}>
                    <Text style={styles.emptyText}>No saved images yet</Text>
                    <TouchableOpacity
                      style={styles.emptyButton}
                      onPress={() => navigation.navigate('ImageGenerator')}
                    >
                      <Text style={styles.emptyButtonText}>Generate Image</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Featured Community Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ Featured from Community</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Community')}>
              <Text style={styles.sectionLink}>See All →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : featuredCommunity.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.featuredScroll}
              contentContainerStyle={styles.featuredContent}
            >
              {featuredCommunity.map((image) => (
                <TouchableOpacity
                  key={image.id}
                  style={styles.featuredCard}
                  onPress={() => navigation.navigate('Community')}
                >
                  <Image
                    source={{ uri: image.imageUrl }}
                    style={styles.featuredImage}
                    resizeMode="cover"
                  />
                  {image.description && (
                    <View style={styles.featuredOverlay}>
                      <Text style={styles.featuredDescription} numberOfLines={1}>
                        {image.description}
                      </Text>
                    </View>
                  )}
                  <View style={styles.featuredLikes}>
                    <Text style={styles.featuredLikesText}>❤️ {image.likesCount}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
                  colors={tool.gradientColors}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  garageStat: {
    flex: 1,
    alignItems: 'center',
  },
  garageStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  garageStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  garageStatModified: {
    color: colors.primary,
  },
  garageArrow: {
    fontSize: 18,
    color: colors.primary,
    marginHorizontal: 8,
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
  featuredScroll: {
    marginHorizontal: -20,
  },
  featuredContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  featuredCard: {
    width: 200,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.secondary,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  featuredDescription: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  featuredLikes: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featuredLikesText: {
    color: colors.textPrimary,
    fontSize: 12,
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
