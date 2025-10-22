// NATIVE APP - Profile screen (basic shell, will build out later)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { PricingModal } from '../components/PricingModal';
import { initializeStripePayment } from '../services/stripe';
import { profileAPI } from '../services/api';
import { colors } from '../theme/colors';
import type { PlanCode } from '../types/quota';
import DefaultIconPickerModal from '../components/DefaultIconPickerModal'; // Import the new modal
import { useProfileBanner } from '../contexts/ProfileBannerContext'; // Import ProfileBannerContext

const ProfileScreen = ({ navigation }: any) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { quotaInfo } = useQuota();
  const [pricingModalVisible, setPricingModalVisible] = useState(false);
  const [profileIconModalVisible, setProfileIconModalVisible] = useState(false);
  const [selectedProfileIcon, setSelectedProfileIcon] = useState('👤'); // Default profile icon
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [location, setLocation] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [saving, setSaving] = useState(false);

  const { bannerImageUri } = useProfileBanner(); // Get banner image URI from context

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await profileAPI.updateProfile({
        name,
        nickname,
        location,
        instagramHandle,
        profileIcon: selectedProfileIcon,
        bannerImageUrl: bannerImageUri || undefined,
      });
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Save profile error:', error);
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

  return (
    <View style={styles.container}>
      {/* Banner Image Wrapper */}
      <View style={styles.bannerImageWrapper}>
        <Image
          source={{ uri: bannerImageUri || 'https://via.placeholder.com/900x200/1A1F3A/FFFFFF?text=Profile+Banner' }} // Use dynamic URI or fallback
          style={styles.bannerImage}
          resizeMode="cover" // Ensure image covers the area
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header (empty, as "Profile" text is removed) */}
        <View style={styles.header}>
          {/* Removed "Profile" text */}
        </View>

        {/* User Info Card */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => setProfileIconModalVisible(true)}>
            <Text style={styles.profileIconText}>{selectedProfileIcon}</Text>
          </TouchableOpacity>
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

        {/* Profile Icon Picker Modal */}
        <DefaultIconPickerModal
          visible={profileIconModalVisible}
          onClose={() => setProfileIconModalVisible(false)}
          onSelectIcon={(icon) => {
            setSelectedProfileIcon(icon);
            setProfileIconModalVisible(false);
          }}
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
  scrollContent: {
    paddingTop: 220, // Make space for the banner at the top, and pull content up (new banner height 250 - overlap 30 = 220)
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 0, // No padding, banner is absolute
    paddingBottom: 0, // No padding
  },
  // Removed 'title' style as per user request
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    marginTop: -30, // Pull the card up to overlap the banner slightly (new banner height 250 - overlap 30 = 220, but card starts at 220, so -30 from its natural position)
  },
  bannerImageWrapper: {
    width: '100%',
    height: 250, // Increased height for more square appearance
    backgroundColor: colors.secondary, // Fallback background
    position: 'absolute', // Position absolutely to act as background
    top: 0,
    alignSelf: 'center', // Center the wrapper horizontally
    marginLeft: 10, // Padded border effect on left
    marginRight: 10, // Padded border effect on right
    borderRadius: 16, // Rounded edges
    borderWidth: 2, // Border width
    borderColor: colors.divider, // Border color
    overflow: 'hidden', // Clip content to border radius
  },
  bannerImage: {
    width: '100%',
    height: '100%', // Fill the wrapper
    borderRadius: 14, // Slightly less than wrapper to show border
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
});

export default ProfileScreen;
