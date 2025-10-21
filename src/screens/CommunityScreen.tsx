// NATIVE APP - Community screen (Instagram-style grid)
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Alert, Modal } from 'react-native';
import { communityAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { colors } from '../theme/colors';
import type { CommunityImage } from '../types';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 3) / 3; // 3 columns with 1px gaps

const CommunityScreen = () => {
  const [images, setImages] = useState<CommunityImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<CommunityImage | null>(null);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const { isAuthenticated } = useAuth();
  const { checkQuota, refreshQuota } = useQuota();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const response = await communityAPI.getImages(1, 40);
      console.log('📸 Community images loaded:', response.images?.length);
      console.log('🎨 Sample planCodes:', response.images?.slice(0, 3).map((img: any) => ({
        id: img.id.substring(0, 8),
        planCode: img.planCode
      })));
      setImages(response.images || []);
    } catch (error) {
      console.error('Failed to load community images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
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

      // Update selected image if it's currently open
      if (selectedImage && selectedImage.id === imageId) {
        setSelectedImage({ ...selectedImage, likesCount: selectedImage.likesCount + 1 });
      }

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

  // Get tier glow color
  const getTierGlowColor = (planCode: string): string => {
    const tier = planCode?.toUpperCase();
    if (tier === 'PLUS') return 'rgba(50, 205, 50, 0.8)'; // Lime green
    if (tier === 'PRO') return 'rgba(255, 215, 0, 0.8)'; // Yellow
    if (tier === 'ULTRA') return 'rgba(220, 20, 60, 0.9)'; // Rich red
    if (tier === 'ADMIN') return 'rgba(255, 215, 0, 1)'; // Vibrant gold
    return 'rgba(255, 255, 255, 0)'; // No glow for FREE tier
  };

  const getTierGlowSize = (planCode: string): number => {
    const tier = planCode?.toUpperCase();
    if (tier === 'PLUS') return 10;
    if (tier === 'PRO') return 15;
    if (tier === 'ULTRA') return 18;
    if (tier === 'ADMIN') return 22;
    return 0;
  };

  const renderImage = ({ item }: { item: CommunityImage }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => setSelectedImage(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <Text style={styles.likes}>❤️ {item.likesCount}</Text>
      </View>
    </TouchableOpacity>
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
          {images.length} images from the TunedUp community
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        data={images}
        renderItem={renderImage}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
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

      {/* Image Detail Modal */}
      {selectedImage && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSelectedImage(null)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              {/* Image with tier-based glow */}
              <View
                style={[
                  styles.glowWrapper,
                  {
                    shadowColor: getTierGlowColor(selectedImage.planCode),
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 1,
                    shadowRadius: getTierGlowSize(selectedImage.planCode),
                  },
                ]}
              >
                <View style={styles.detailImageWrapper}>
                  <Image
                    source={{ uri: selectedImage.imageUrl }}
                    style={styles.detailImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Description and Likes */}
              <View style={styles.detailInfo}>
                {selectedImage.description && (
                  <Text style={styles.description}>{selectedImage.description}</Text>
                )}
                <TouchableOpacity
                  onPress={() => handleLike(selectedImage.id)}
                  style={[
                    styles.likeButton,
                    likedImages.has(selectedImage.id) && styles.likeButtonActive
                  ]}
                  disabled={likedImages.has(selectedImage.id)}
                >
                  <Text style={[
                    styles.likeButtonText,
                    likedImages.has(selectedImage.id) && styles.likeButtonTextActive
                  ]}>
                    ❤️ {selectedImage.likesCount} {selectedImage.likesCount === 1 ? 'like' : 'likes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
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
  gridContent: {
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'flex-start',
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    position: 'relative',
    margin: 0.5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  likes: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  glowWrapper: {
    width: '100%',
    padding: 10,
  },
  detailImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailInfo: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  description: {
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  likeButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.divider,
  },
  likeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  likeButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  likeButtonTextActive: {
    color: colors.background,
  },
});

export default CommunityScreen;
