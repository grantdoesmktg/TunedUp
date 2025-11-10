// NATIVE APP - Profile screen with saved performance and images
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, TextInput, Alert, ActivityIndicator, ImageBackground, Animated, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { PricingModal } from '../components/PricingModal';
import { initializeStripePayment } from '../services/stripe';
import { profileAPI, communityAPI } from '../services/api';
import { colors } from '../theme/colors';
import type { PlanCode } from '../types/quota';
import ImageViewerModal from '../components/ImageViewerModal';
import BackgroundPickerModal from '../components/BackgroundPickerModal';
import { getBackgroundConfig, parseBackgroundTheme } from '../theme/backgrounds';
import { getTextureConfig, TexturePattern } from '../theme/textures';

// Anonymous Profile View Component - Must be defined before ProfileScreen
const AnonymousProfileView = ({ navigation }: any) => {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    const result = await sendMagicLink(email.toLowerCase().trim());
    setLoading(false);

    if (result.success) {
      navigation.navigate('VerifyCode', { email: email.toLowerCase().trim() });
    } else {
      setError(result.message);
    }
  };

  const features = [
    {
      icon: '🚗',
      title: 'Save Your Builds',
      description: 'Store performance calculations and build plans for all your cars',
    },
    {
      icon: '🎨',
      title: 'AI Image Generation',
      description: 'Create stunning AI-generated images of your dream cars',
    },
    {
      icon: '👤',
      title: 'Profile Customization',
      description: 'Personalize your profile with custom icons, banners, and themes',
    },
    {
      icon: '❤️',
      title: 'Community Features',
      description: 'Post to the community feed, like images, and connect with car enthusiasts',
    },
    {
      icon: '⚡',
      title: 'Increased Credits',
      description: 'Unlock more monthly credits for performance calcs, builds, and images',
    },
    {
      icon: '🎯',
      title: 'Track Your Progress',
      description: 'See your usage stats and manage your automotive journey',
    },
  ];

  return (
    <View style={styles.anonymousContainer}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80' }}
        style={styles.anonymousBackgroundImage}
        blurRadius={3}
      >
        <LinearGradient
          colors={['rgba(18, 18, 18, 0.85)', 'rgba(18, 18, 18, 0.95)', colors.background]}
          style={styles.anonymousGradient}
        >
          <ScrollView
            contentContainerStyle={styles.anonymousScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.anonymousContent,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Header */}
              <View style={styles.anonymousHeader}>
                <Image
                  source={require('../../assets/logo-horizontal.png')}
                  style={styles.anonymousLogo}
                  resizeMode="contain"
                />
                <Text style={styles.anonymousHeroTitle}>Unlock Your Full Experience</Text>
                <Text style={styles.anonymousHeroSubtitle}>
                  Sign in to save your builds, customize your profile, and join our community of car enthusiasts
                </Text>
              </View>

              {/* Sign In Form */}
              <View style={styles.anonymousFormContainer}>
                <View style={styles.anonymousFormCard}>
                  <Text style={styles.anonymousFormTitle}>Ready to Get Started?</Text>
                  <Text style={styles.anonymousFormSubtitle}>
                    Enter your email to receive a verification code
                  </Text>

                  <TextInput
                    style={styles.anonymousInput}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    editable={!loading}
                  />

                  {error ? <Text style={styles.anonymousError}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[styles.anonymousSignInButton, loading && styles.anonymousSignInButtonDisabled]}
                    onPress={handleSendCode}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.background} />
                    ) : (
                      <Text style={styles.anonymousSignInButtonText}>Sign In with Email</Text>
                    )}
                  </TouchableOpacity>

                  {/* Legal Footer */}
                  <View style={styles.anonymousLegalFooter}>
                    <Text style={styles.anonymousLegalText}>By signing in, you agree to our</Text>
                    <View style={styles.anonymousLegalLinks}>
                      <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
                        <Text style={styles.anonymousLegalLink}>Terms of Service</Text>
                      </TouchableOpacity>
                      <Text style={styles.anonymousLegalText}> and </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                        <Text style={styles.anonymousLegalLink}>Privacy Policy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Features Grid */}
              <View style={styles.anonymousFeaturesContainer}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.anonymousFeatureCard}>
                    <Text style={styles.anonymousFeatureIcon}>{feature.icon}</Text>
                    <Text style={styles.anonymousFeatureTitle}>{feature.title}</Text>
                    <Text style={styles.anonymousFeatureDescription}>{feature.description}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

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
  const [refreshing, setRefreshing] = useState(false);

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
    if (!isAuthenticated || !user) return;

    setLoadingContent(true);
    try {
      const [perfResponse, profileResponse] = await Promise.all([
        profileAPI.getSavedPerformance().catch(() => ({ performance: null })),
        communityAPI.getPublicProfile(user.id).catch(() => ({ images: [] })),
      ]);
      setSavedPerformance((perfResponse as any).performance);
      setSavedImages((profileResponse as any).images || []);
    } catch (error) {
      console.error('Failed to load saved content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh user data and saved content
      await Promise.all([
        refreshUser(),
        loadSavedContent()
      ]);
      console.log('✅ Profile refreshed');
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setRefreshing(false);
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
    console.log('📋 ProfileScreen handleSelectPlan received:', {
      planCode,
      priceId,
      userEmail: user?.email,
      hasUser: !!user
    });
    try {
      // Initialize Stripe payment flow
      await initializeStripePayment(planCode, priceId, user?.email);

      // After successful payment, refresh user data to show updated plan
      console.log('🔄 Payment completed, refreshing user data...');
      await refreshUser();
      console.log('✅ User data refreshed after payment');
    } catch (error) {
      console.error('❌ Payment or refresh error:', error);
      // Don't throw - initializeStripePayment already shows error alerts
    }
  };

  if (!isAuthenticated) {
    // Render exciting login view directly in profile for anonymous users
    return <AnonymousProfileView navigation={navigation} />;
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
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

              {/* Community Images */}
              {savedImages.length > 0 ? (
                <View style={styles.garageImagesSection}>
                  <Text style={styles.garageImagesTitle}>Community Images ({savedImages.length})</Text>
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
                  <Text style={styles.emptyText}>No community images yet</Text>
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

        {/* Legal Section */}
        <View style={styles.legalSection}>
          <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
            <Text style={styles.legalLinkText}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}> • </Text>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

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
  legalSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  legalLinkText: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
    color: colors.textSecondary,
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
  // Anonymous Profile View Styles
  anonymousContainer: {
    flex: 1,
  },
  anonymousBackgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  anonymousGradient: {
    flex: 1,
  },
  anonymousScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  anonymousContent: {
    paddingHorizontal: 24,
    paddingTop: 0,
    marginTop: -70,
  },
  anonymousHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  anonymousLogo: {
    width: 250,
    height: 60,
    marginBottom: 20,
  },
  anonymousHeroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  anonymousHeroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  anonymousFeaturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 40,
    gap: 12,
  },
  anonymousFeatureCard: {
    width: '48%',
    backgroundColor: 'rgba(31, 31, 31, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  anonymousFeatureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  anonymousFeatureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  anonymousFeatureDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  anonymousFormContainer: {
    marginTop: 20,
  },
  anonymousFormCard: {
    backgroundColor: 'rgba(31, 31, 31, 0.9)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  anonymousFormTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  anonymousFormSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  anonymousInput: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  anonymousError: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  anonymousSignInButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  anonymousSignInButtonDisabled: {
    opacity: 0.6,
  },
  anonymousSignInButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  anonymousLegalFooter: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: 'center',
  },
  anonymousLegalText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  anonymousLegalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  anonymousLegalLink: {
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

// Export ProfileScreen as default
export default ProfileScreen;
