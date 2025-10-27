// NATIVE APP - Community screen (Social media scrollable feed)
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { communityAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { colors } from '../theme/colors';
import type { CommunityImage } from '../types';

const { width } = Dimensions.get('window');

interface CommunityScreenProps {
  navigation: any;
}

const CommunityScreen = ({ navigation }: CommunityScreenProps) => {
  const [images, setImages] = useState<CommunityImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const { isAuthenticated } = useAuth();
  const { checkQuota, refreshQuota } = useQuota();

  useEffect(() => {
    loadImages();
  }, []);

  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadImages = async () => {
    try {
      const response = await communityAPI.getImages(1, 40) as { images: CommunityImage[] };
      console.log('📸 Community images loaded:', response.images?.length);
      console.log('🎨 Sample planCodes:', response.images?.slice(0, 3).map((img: any) => ({
        id: img.id.substring(0, 8),
        planCode: img.planCode
      })));
      // Shuffle images for random order every time
      const shuffledImages = shuffleArray(response.images || []);
      setImages(shuffledImages);
    } catch (error) {
      console.error('Failed to load community images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadImages();
    setRefreshing(false);
  };

  const handleLike = async (imageId: string) => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to like images');
      return;
    }

    // Check if already liked
    if (likedImages.has(imageId)) {
      Alert.alert('Already Liked', 'You have already liked this image');
      return;
    }

    // Check quota before liking
    const quotaCheck = await checkQuota('community');
    if (!quotaCheck.allowed) {
      Alert.alert(
        'Usage Limit Reached',
        quotaCheck.message || 'You\'ve reached your monthly limit for community interactions.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await communityAPI.likeImage(imageId);

      // Add to liked images set
      setLikedImages(prev => new Set(prev).add(imageId));

      // Update local state
      setImages(prevImages =>
        prevImages.map(img =>
          img.id === imageId
            ? { ...img, likesCount: img.likesCount + 1 }
            : img
        )
      );

      // Refresh quota
      await refreshQuota();
    } catch (error: any) {
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota')) {
        Alert.alert(
          'Usage Limit Reached',
          'You\'ve reached your monthly limit for community interactions.',
          [{ text: 'OK' }]
        );
        await refreshQuota();
      } else if (error.message?.includes('already liked')) {
        // Server says already liked, update local state
        setLikedImages(prev => new Set(prev).add(imageId));
        Alert.alert('Already Liked', 'You have already liked this image');
      } else {
        console.error('Failed to like image:', error);
      }
    }
  };

  const getDisplayName = (image: CommunityImage): string => {
    if (image.userNickname) return image.userNickname;
    if (image.userEmail) return image.userEmail.substring(0, 4);
    return 'User';
  };

  const getTierBadge = (planCode: string): string => {
    const tier = planCode?.toUpperCase();
    if (tier === 'PLUS') return '⭐';
    if (tier === 'PRO') return '⚡';
    if (tier === 'ULTRA') return '👑';
    if (tier === 'ADMIN') return '🔥';
    return '';
  };

  const navigateToProfile = (userId: string) => {
    navigation.navigate('PublicProfile', { userId });
  };

  const renderFeedCard = ({ item }: { item: CommunityImage }) => (
    <View style={styles.feedCard}>
      {/* User info header */}
      <TouchableOpacity
        style={styles.userHeader}
        onPress={() => navigateToProfile(item.userId)}
        activeOpacity={0.7}
      >
        <Text style={styles.userIcon}>{item.profileIcon || '👤'}</Text>
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{getDisplayName(item)}</Text>
            {getTierBadge(item.planCode) && (
              <Text style={styles.tierBadge}>{getTierBadge(item.planCode)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Image */}
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.feedImage}
        resizeMode="cover"
      />

      {/* Description */}
      {item.description && (
        <Text style={styles.feedDescription}>{item.description}</Text>
      )}

      {/* Like button */}
      <TouchableOpacity
        onPress={() => handleLike(item.id)}
        style={[
          styles.feedLikeButton,
          likedImages.has(item.id) && styles.feedLikeButtonActive
        ]}
        disabled={likedImages.has(item.id)}
      >
        <Text style={[
          styles.feedLikeText,
          likedImages.has(item.id) && styles.feedLikeTextActive
        ]}>
          ❤️ {item.likesCount} {item.likesCount === 1 ? 'like' : 'likes'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading community images...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>
          {images.length} posts from the TunedUp community
        </Text>
      </View>

      {/* Scrollable Feed */}
      <FlatList
        data={images}
        renderItem={renderFeedCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      />

      {/* Sign in prompt for non-authenticated users */}
      {!isAuthenticated && (
        <View style={styles.signInPrompt}>
          <Text style={styles.promptText}>
            Sign in to like images and share your own!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  feedContent: {
    paddingBottom: 100,
  },
  feedCard: {
    backgroundColor: colors.secondary,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background,
  },
  userIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
    marginRight: 8,
  },
  tierBadge: {
    fontSize: 16,
  },
  feedImage: {
    width: '100%',
    aspectRatio: 1,
  },
  feedDescription: {
    fontSize: 16,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  feedLikeButton: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 10,
    margin: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  feedLikeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  feedLikeText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  feedLikeTextActive: {
    color: colors.background,
  },
  signInPrompt: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  promptText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CommunityScreen;
