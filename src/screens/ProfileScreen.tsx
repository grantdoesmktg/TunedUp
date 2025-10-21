// NATIVE APP - Profile screen (basic shell, will build out later)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { PricingModal } from '../components/PricingModal';
import { initializeStripePayment } from '../services/stripe';
import { savedPerformanceAPI, savedImagesAPI } from '../services/api';
import { colors } from '../theme/colors';
import type { PlanCode } from '../types/quota';
import type { SavedPerformanceCalc, SavedImage } from '../types';

const ProfileScreen = ({ navigation }: any) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { quotaInfo } = useQuota();
  const [pricingModalVisible, setPricingModalVisible] = useState(false);
  const [savedPerformance, setSavedPerformance] = useState<SavedPerformanceCalc | null>(null);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedContent();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadSavedContent = async () => {
    setLoading(true);
    try {
      const [perfResponse, imagesResponse] = await Promise.all([
        savedPerformanceAPI.getSavedPerformance().catch((err) => {
          console.log('Backend API not ready for saved performance:', err.message);
          return { performance: null };
        }),
        savedImagesAPI.getSavedImages().catch((err) => {
          console.log('Backend API not ready for saved images:', err.message);
          return { images: [] };
        }),
      ]);
      setSavedPerformance(perfResponse.performance || null);
      setSavedImages(imagesResponse.images || []);
    } catch (error) {
      console.error('Failed to load saved content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSelectPlan = async (planCode: PlanCode, priceId: string) => {
    // Initialize Stripe payment flow
    await initializeStripePayment(planCode, priceId, user?.email);
  };

  const handleDeletePerformance = async () => {
    if (!savedPerformance) return;

    Alert.alert(
      'Delete Performance Calculation',
      'Are you sure you want to delete this saved performance calculation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await savedPerformanceAPI.deletePerformance(savedPerformance.id);
              setSavedPerformance(null);
              Alert.alert('Success', 'Performance calculation deleted');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete performance calculation');
            }
          },
        },
      ]
    );
  };

  const handleDeleteImage = async (imageId: string) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this saved image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await savedImagesAPI.deleteImage(imageId);
              setSavedImages(prev => prev.filter(img => img.id !== imageId));
              Alert.alert('Success', 'Image deleted');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete image');
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>
            Sign in to view your profile, saved cars, and build history
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* User Info Card */}
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.planBadge}>
          <Text style={styles.planText}>{user?.planCode.toUpperCase()}</Text>
        </View>
      </View>

      {/* Upgrade Plan Card - Hide for Ultra users */}
      {user?.planCode.toUpperCase() !== 'ULTRA' && user?.planCode.toUpperCase() !== 'ADMIN' && (
        <View style={styles.upgradeCard}>
          <Text style={styles.upgradeTitle}>Want More?</Text>
          <Text style={styles.upgradeText}>
            Upgrade your plan to unlock higher limits and premium features
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setPricingModalVisible(true)}
          >
            <Text style={styles.upgradeButtonText}>View Plans & Pricing</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Saved Performance Calculation */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Saved Performance</Text>
          {savedPerformance && (
            <TouchableOpacity onPress={handleDeletePerformance}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : savedPerformance ? (
          <View style={styles.performanceCard}>
            <Text style={styles.performanceVehicle}>
              {savedPerformance.carInput.year} {savedPerformance.carInput.make} {savedPerformance.carInput.model}
            </Text>
            <View style={styles.performanceStats}>
              <View style={styles.performanceStatSection}>
                <Text style={styles.performanceStatLabel}>Stock</Text>
                <Text style={styles.performanceStatValue}>
                  {savedPerformance.results.stockPerformance.whp} WHP
                </Text>
                <Text style={styles.performanceStatValue}>
                  {savedPerformance.results.stockPerformance.zeroToSixty.toFixed(2)}s 0-60
                </Text>
              </View>
              <Text style={styles.performanceArrow}>→</Text>
              <View style={styles.performanceStatSection}>
                <Text style={styles.performanceStatLabel}>Modified</Text>
                <Text style={[styles.performanceStatValue, styles.modifiedValue]}>
                  {savedPerformance.results.estimatedPerformance.whp} WHP
                </Text>
                <Text style={[styles.performanceStatValue, styles.modifiedValue]}>
                  {savedPerformance.results.estimatedPerformance.zeroToSixty.toFixed(2)}s 0-60
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => navigation.navigate('PerformanceResults', {
                results: savedPerformance.results,
                carInput: savedPerformance.carInput
              })}
            >
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No saved performance calculation yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('PerformanceCalculator')}
            >
              <Text style={styles.createButtonText}>Calculate Performance</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Saved Images */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Saved Images ({savedImages.length}/3)</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : savedImages.length > 0 ? (
          <View style={styles.imagesGrid}>
            {savedImages.map((image) => (
              <View key={image.id} style={styles.imageCard}>
                <Image
                  source={{ uri: image.imageUrl }}
                  style={styles.savedImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageCar} numberOfLines={1}>
                    {image.carSpec.year} {image.carSpec.make}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteImageButton}
                    onPress={() => handleDeleteImage(image.id)}
                  >
                    <Text style={styles.deleteImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No saved images yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('ImageGenerator')}
            >
              <Text style={styles.createButtonText}>Generate Image</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Pricing Modal */}
      <PricingModal
        visible={pricingModalVisible}
        onClose={() => setPricingModalVisible(false)}
        currentPlan={quotaInfo?.planCode}
        onSelectPlan={handleSelectPlan}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  signInButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.background,
  },
  email: {
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  planBadge: {
    backgroundColor: colors.divider,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'center',
  },
  planText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  performanceCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
  },
  performanceVehicle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceStatSection: {
    flex: 1,
    alignItems: 'center',
  },
  performanceStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  performanceStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  modifiedValue: {
    color: colors.primary,
  },
  performanceArrow: {
    fontSize: 20,
    color: colors.primary,
    marginHorizontal: 8,
  },
  viewButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: colors.background,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  createButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  savedImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageCar: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  deleteImageButton: {
    width: 20,
    height: 20,
    backgroundColor: colors.error,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteImageText: {
    fontSize: 12,
    color: colors.background,
    fontWeight: 'bold',
  },
  upgradeCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.background,
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: colors.background,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  upgradeButton: {
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: colors.secondary,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfileScreen;
