import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Linking, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { communityAPI } from '../services/api';
import { colors } from '../theme/colors';
import type { PublicProfileResponse } from '../types';
import { getBackgroundConfig, parseBackgroundTheme } from '../theme/backgrounds';
import { getTextureConfig, TexturePattern } from '../theme/textures';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 60) / 3; // 3 columns with padding

interface PublicProfileScreenProps {
  route: {
    params: {
      userId: string;
    };
  };
  navigation: any;
}

const PublicProfileScreen = ({ route, navigation }: PublicProfileScreenProps) => {
  const { userId } = route.params;
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      console.log('🔍 Loading public profile for userId:', userId);
      const response = await communityAPI.getPublicProfile(userId);
      console.log('✅ Profile loaded successfully:', response);
      setProfile(response as any);
    } catch (error: any) {
      console.error('❌ Failed to load public profile:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Full error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openInstagram = () => {
    if (profile?.user.instagramHandle) {
      const handle = profile.user.instagramHandle.replace('@', '');
      Linking.openURL(`https://instagram.com/${handle}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { user, images, stats, savedPerformance } = profile;

  // Parse background theme
  const { gradient: gradientKey, texture: textureKey } = parseBackgroundTheme(user.backgroundTheme || 'midnight');
  const backgroundConfig = getBackgroundConfig(gradientKey);
  const textureConfig = textureKey ? getTextureConfig(textureKey as TexturePattern) : null;

  return (
    <LinearGradient colors={backgroundConfig.colors} style={styles.container}>
      {textureConfig && (
        <ImageBackground
          source={textureConfig.source}
          style={styles.textureOverlay}
          imageStyle={{ opacity: textureConfig.opacity }}
          resizeMode="repeat"
        />
      )}
      <SafeAreaView style={styles.safeArea}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButtonTop} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonIcon}>←</Text>
        </TouchableOpacity>
      </SafeAreaView>
      <ScrollView style={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.headerContainer}>
            <Text style={styles.displayName}>{user.displayName}</Text>

            {user.location && (
              <Text style={styles.location}>📍 {user.location}</Text>
            )}

            {user.instagramHandle && (
              <TouchableOpacity onPress={openInstagram} style={styles.instagramButton}>
                <Text style={styles.instagramText}>@{user.instagramHandle.replace('@', '')}</Text>
              </TouchableOpacity>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.totalImages}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.totalLikes}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statPlanCode}>{user.planCode}</Text>
                <Text style={styles.statLabel}>Tier</Text>
              </View>
            </View>

            {/* Member Since */}
            <Text style={styles.memberSince}>
              Member since {new Date(user.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

      {/* Saved Performance */}
      {savedPerformance && (
        <View style={styles.performanceSection}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Performance Build</Text>
          </View>
          <View style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <Text style={styles.performanceCar}>
                {savedPerformance.carInput.year} {savedPerformance.carInput.make} {savedPerformance.carInput.model}
              </Text>
              {savedPerformance.carInput.trim && (
                <Text style={styles.performanceTrim}>{savedPerformance.carInput.trim}</Text>
              )}
            </View>

            {/* Performance Stats */}
            <View style={styles.performanceStats}>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceStatValue}>{savedPerformance.results.estimatedPerformance?.horsepower || 'N/A'}</Text>
                <Text style={styles.performanceStatLabel}>HP</Text>
              </View>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceStatValue}>{savedPerformance.results.estimatedPerformance?.whp || 'N/A'}</Text>
                <Text style={styles.performanceStatLabel}>WHP</Text>
              </View>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceStatValue}>{savedPerformance.results.estimatedPerformance?.zeroToSixty || 'N/A'}</Text>
                <Text style={styles.performanceStatLabel}>0-60</Text>
              </View>
            </View>

            {/* Modifications */}
            {savedPerformance.carInput.modifications && (
              <View style={styles.modificationsSection}>
                <Text style={styles.modificationsTitle}>Modifications:</Text>
                <Text style={styles.modificationsText}>{savedPerformance.carInput.modifications}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Images Grid */}
      <View style={styles.imagesSection}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Images</Text>
        </View>
        {images.length === 0 ? (
          <Text style={styles.noImagesText}>No community images yet</Text>
        ) : (
          <View style={styles.imagesGrid}>
            {images.map((image) => (
              <View key={image.id} style={styles.imageContainer}>
                <Image
                  source={{ uri: image.imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageLikes}>❤️ {image.likesCount}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    zIndex: 10,
  },
  backButtonTop: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonIcon: {
    fontSize: 28,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  banner: {
    width: '100%',
    height: 200,
    backgroundColor: colors.secondary,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  instagramButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  instagramText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 32,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statPlanCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  memberSince: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  imagesSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitleContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 0,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  noImagesText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 6,
  },
  imageLikes: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  performanceSection: {
    padding: 20,
    paddingTop: 10,
  },
  performanceCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  performanceHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: 12,
  },
  performanceCar: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  performanceTrim: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  performanceStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  modificationsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  modificationsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  modificationsText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default PublicProfileScreen;
