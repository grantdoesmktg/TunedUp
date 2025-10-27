import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, Linking, ImageBackground } from 'react-native';
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

  const { user, images, stats } = profile;

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
      <ScrollView style={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
        <Text style={styles.profileIcon}>{user.profileIcon}</Text>
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

      {/* Images Grid */}
      <View style={styles.imagesSection}>
        <Text style={styles.sectionTitle}>Images</Text>
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
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
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
  },
  statPlanCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  memberSince: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 16,
  },
  imagesSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  noImagesText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
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
});

export default PublicProfileScreen;
