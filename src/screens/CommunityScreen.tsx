// NATIVE APP - Community screen (Instagram-style grid)
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Alert } from 'react-native';
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
  const { isAuthenticated } = useAuth();
  const { checkQuota, refreshQuota } = useQuota();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const response = await communityAPI.getImages(1, 40);
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
      } else {
        console.error('Failed to like image:', error);
      }
    }
  };

  const renderImage = ({ item }: { item: CommunityImage }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => handleLike(item.id)}
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
});

export default CommunityScreen;
