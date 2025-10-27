// NATIVE APP - Profile screen with saved performance and images
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, TextInput, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { PricingModal } from '../components/PricingModal';
import { initializeStripePayment } from '../services/stripe';
import { profileAPI } from '../services/api';
import { colors } from '../theme/colors';
import type { PlanCode } from '../types/quota';
import ImageViewerModal from '../components/ImageViewerModal';
import BackgroundPickerModal from '../components/BackgroundPickerModal';
import { getBackgroundConfig, parseBackgroundTheme } from '../theme/backgrounds';
import { getTextureConfig, TexturePattern } from '../theme/textures';

const ProfileScreen = ({ navigation }: any) => {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const { quotaInfo } = useQuota();
  const [pricingModalVisible, setPricingModalVisible] = useState(false);
  const [backgroundPickerVisible, setBackgroundPickerVisible] = useState(false);
  const [selectedProfileIcon, setSelectedProfileIcon] = useState('👤');
  const [selectedBackground, setSelectedBackground] = useState<string>('midnight'); // Combined format: "gradient-texture"
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [location, setLocation] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [saving, setSaving] = useState(false);

  // Saved content state
  const [savedPerformance, setSavedPerformance] = useState<any>(null);
  const [savedImages, setSavedImages] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');

  // Initialize form fields from user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setNickname(user.nickname || '');
      setLocation(user.location || '');
      setInstagramHandle(user.instagramHandle || '');
      setSelectedProfileIcon(user.profileIcon || '👤');
      setSelectedBackground(user.backgroundTheme || 'midnight');
    }
  }, [user]);

  // Load saved content when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadSavedContent();
    }, [isAuthenticated])
  );

  const loadSavedContent = async () => {
    if (!isAuthenticated) return;

    setLoadingContent(true);
    try {
      const [perfResponse, imagesResponse] = await Promise.all([
        profileAPI.getSavedPerformance().catch(() => ({ performance: null })),
        profileAPI.getSavedImages().catch(() => ({ images: [] })),
      ]);
      setSavedPerformance((perfResponse as any).performance);
      setSavedImages((imagesResponse as any).images || []);
    } catch (error) {
      console.error('Failed to load saved content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      console.log('💾 Saving profile data:', {
        name,
        nickname,
        location,
        instagramHandle,
        profileIcon: selectedProfileIcon,
        backgroundTheme: selectedBackground,
      });

      const response = await profileAPI.updateProfile({
        name,
        nickname,
        location,
        instagramHandle,
        profileIcon: selectedProfileIcon,
        backgroundTheme: selectedBackground,
      });

      console.log('✅ Profile save response:', response);

      // Refresh user data from the database to persist changes
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('❌ Save profile error:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleSelectPlan = async (planCode: PlanCode, priceId: string) => {
    // Initialize Stripe payment flow
    await initializeStripePayment(planCode, priceId, user?.email);
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

  // Parse the combined background theme (gradient-texture)
  const parsed = parseBackgroundTheme(selectedBackground);
  const gradientConfig = getBackgroundConfig(parsed.gradient);
  const textureConfig = getTextureConfig(parsed.texture as TexturePattern);

  return (
    <View style={styles.container}>
      {/* Full-screen gradient background */}
      <LinearGradient
        colors={gradientConfig.colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Texture overlay if selected */}
        {textureConfig.source && (
          <ImageBackground
            source={textureConfig.source}
            style={styles.textureOverlay}
            resizeMode="repeat"
            imageStyle={{ opacity: textureConfig.opacity }}
          />
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with background picker button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backgroundPickerButton}
            onPress={() => setBackgroundPickerVisible(true)}
          >
            <Text style={styles.backgroundPickerIcon}>🎨</Text>
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Text style={styles.profileIconText}>{selectedProfileIcon}</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.planCode && ( // Ensure planCode exists before rendering badge
            <View style={styles.planBadge}>
              <Text style={styles.planText}>{user.planCode.toUpperCase()}</Text>
            </View>
          )}

          {/* Editable Profile Fields */}
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Nickname"
            placeholderTextColor={colors.textSecondary}
            value={nickname}
            onChangeText={setNickname}
          />
          <TextInput
            style={styles.input}
            placeholder="City, State"
            placeholderTextColor={colors.textSecondary}
            value={location}
            onChangeText={setLocation}
          />
          <TextInput
            style={styles.input}
            placeholder="Instagram Handle"
            placeholderTextColor={colors.textSecondary}
            value={instagramHandle}
            onChangeText={setInstagramHandle}
          />

          {/* Save Profile Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Your Garage - Saved Content */}
        <View style={styles.garageSection}>
          <Text style={styles.garageSectionTitle}>🏁 Your Garage</Text>

          {loadingContent ? (
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
                  <Text style={styles.garageCardVehicle}>
                    {savedPerformance.carInput.year} {savedPerformance.carInput.make} {savedPerformance.carInput.model}
                  </Text>
                  <View style={styles.garageCardStats}>
                    {/* Header Row */}
                    <View style={styles.garageStatsRow}>
                      <Text style={styles.garageStatHeader}></Text>
                      <Text style={styles.garageStatHeader}>HP</Text>
                      <Text style={styles.garageStatHeader}>WHP</Text>
                      <Text style={styles.garageStatHeader}>0-60</Text>
                    </View>

                    {/* Stock Row */}
                    <View style={styles.garageStatsRow}>
                      <Text style={styles.garageStatLabel}>Stock</Text>
                      <Text style={styles.garageStatValue}>
                        {savedPerformance.results.stockPerformance.horsepower}
                      </Text>
                      <Text style={styles.garageStatValue}>
                        {savedPerformance.results.stockPerformance.whp}
                      </Text>
                      <Text style={styles.garageStatValue}>
                        {savedPerformance.results.stockPerformance.zeroToSixty}s
                      </Text>
                    </View>

                    {/* Modified Row */}
                    <View style={styles.garageStatsRow}>
                      <Text style={styles.garageStatLabel}>Modified</Text>
                      <Text style={[styles.garageStatValue, styles.garageStatModified]}>
                        {savedPerformance.results.estimatedPerformance.horsepower}
                      </Text>
                      <Text style={[styles.garageStatValue, styles.garageStatModified]}>
                        {savedPerformance.results.estimatedPerformance.whp}
                      </Text>
                      <Text style={[styles.garageStatValue, styles.garageStatModified]}>
                        {savedPerformance.results.estimatedPerformance.zeroToSixty}s
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
                      <TouchableOpacity
                        key={image.id}
                        onPress={() => {
                          setSelectedImageUri(image.imageUrl);
                          setImageViewerVisible(true);
                        }}
                      >
                        <Image
                          source={{ uri: image.imageUrl }}
                          style={styles.garageImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
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

        {/* Image Viewer Modal */}
        <ImageViewerModal
          visible={imageViewerVisible}
          onClose={() => setImageViewerVisible(false)}
          imageUrl={selectedImageUri}
        />

        {/* Background Picker Modal */}
        <BackgroundPickerModal
          visible={backgroundPickerVisible}
          onClose={() => setBackgroundPickerVisible(false)}
          onSelectBackground={setSelectedBackground}
          currentTheme={selectedBackground}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  textureOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backgroundPickerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backgroundPickerIcon: {
    fontSize: 24,
  },
  card: {
    backgroundColor: 'rgba(26, 31, 58, 0.85)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary, // Fallback background
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
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
    backgroundColor: colors.primary, // Use primary color for badge background
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 8, // Add some space below email
  },
  planText: {
    color: colors.background, // Text color contrasting with primary background
    fontSize: 14,
    fontWeight: '600',
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
  input: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  // Garage Section Styles
  garageSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  garageSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  garageCard: {
    backgroundColor: 'rgba(26, 31, 58, 0.85)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(26, 31, 58, 0.85)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
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
});

export default ProfileScreen;
