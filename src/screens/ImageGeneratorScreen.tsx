// NATIVE APP - AI Image Generator Screen
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { imageGeneratorAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { colors } from '../theme/colors';
import type { CarSpec, ImageGeneratorResponse } from '../types';

const ImageGeneratorScreen = ({ navigation }: any) => {
  const { refreshUser, user, isAuthenticated } = useAuth();
  const { checkTokens, refreshTokens, incrementAnonymousUsage, tokenInfo } = useQuota();
  const [carSpec, setCarSpec] = useState<CarSpec>({
    year: '',
    make: '',
    model: '',
    color: '',
    wheelsColor: '',
    addModel: false,
    deBadged: false,
    chromeDelete: false,
    darkTint: false,
    position: 'quarter',
    details: '',
  });
  const [location, setLocation] = useState('tokyo_shibuya');
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [style, setStyle] = useState('photoreal');
  const [loading, setLoading] = useState(false);

  // Location options grouped by country
  const locationsByCountry: Record<string, { flag: string; name: string; locations: Array<{ label: string; value: string }> }> = {
    japan: {
      flag: '🇯🇵',
      name: 'Japan',
      locations: [
        { label: 'Tokyo - Shibuya', value: 'tokyo_shibuya' },
        { label: 'Mount Fuji - Hakone', value: 'mount_fuji_hakone' },
        { label: 'Osaka Bay', value: 'osaka_bay' },
        { label: 'Kyoto Outskirts', value: 'kyoto_outskirts' },
      ]
    },
    usa: {
      flag: '🇺🇸',
      name: 'United States',
      locations: [
        { label: 'Los Angeles', value: 'los_angeles' },
        { label: 'Detroit', value: 'detroit' },
        { label: 'Las Vegas Desert', value: 'las_vegas_desert' },
        { label: 'Miami', value: 'miami' },
      ]
    },
    germany: {
      flag: '🇩🇪',
      name: 'Germany',
      locations: [
        { label: 'Munich Alps', value: 'munich_alps' },
        { label: 'Stuttgart', value: 'stuttgart' },
        { label: 'Berlin', value: 'berlin' },
        { label: 'Nürburgring', value: 'nurburgring' },
      ]
    },
    korea: {
      flag: '🇰🇷',
      name: 'South Korea',
      locations: [
        { label: 'Seoul - Gangnam', value: 'seoul_gangnam' },
        { label: 'Busan', value: 'busan' },
        { label: 'Incheon', value: 'incheon' },
        { label: 'Jeju Island', value: 'jeju_island' },
      ]
    },
    italy: {
      flag: '🇮🇹',
      name: 'Italy',
      locations: [
        { label: 'Maranello', value: 'maranello' },
        { label: 'Sant\'Agata Bolognese', value: 'santagata_bolognese' },
        { label: 'Modena', value: 'modena' },
        { label: 'Amalfi Coast', value: 'amalfi_coast' },
      ]
    },
  };

  const artStyles = [
    { label: '📷 Photorealistic', value: 'photoreal', description: 'Ultra-realistic photography with natural lighting and authentic details' },
    { label: '🎨 Borderlands', value: 'borderlands', description: 'Bold cel-shaded comic style with thick outlines and vibrant colors' },
    { label: '🌊 Vaporwave', value: 'vaporwave', description: 'Retro 80s aesthetic with neon pinks, purples, and cyberpunk vibes' },
    { label: '✏️ Concept Sketch', value: 'concept_art', description: 'Professional automotive design sketch with pencil and marker rendering' },
  ];
  const positions = [
    { label: 'Front View', value: 'front' },
    { label: 'Front Quarter', value: 'quarter' },
    { label: 'Rear Three-Quarter', value: 'three-quarter' },
    { label: 'Rear View', value: 'back' },
  ];

  const handleGenerate = async () => {
    if (!carSpec.make || !carSpec.model || !carSpec.year) {
      Alert.alert('Missing Info', 'Please enter make, model, and year');
      return;
    }

    // Check tokens before making the request
    const tokenCheck = await checkTokens('image');
    if (!tokenCheck.allowed) {
      Alert.alert(
        'Insufficient Tokens',
        tokenCheck.error || 'You don\'t have enough tokens. Upgrade your plan for more tokens.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      const promptSpec = {
        car: carSpec,
        scene: {
          locationKey: location,
          styleKey: style,
        },
      };

      const imageParams = {
        width: 1024,
        height: 1024,
      };

      const response: ImageGeneratorResponse = await imageGeneratorAPI.generateImage(promptSpec, imageParams);

      // Increment usage for anonymous users, refresh for authenticated users
      if (!isAuthenticated && tokenInfo?.planCode === 'ANONYMOUS') {
        await incrementAnonymousUsage('image');
      }

      // Refresh tokens and user data to update usage counts
      await Promise.all([
        refreshTokens(),
        refreshUser().catch(() => {}) // Ignore errors for unauthenticated users
      ]);

      navigation.navigate('ImageResults', { results: response, carSpec });
    } catch (error: any) {
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota') || error.message?.includes('tokens')) {
        Alert.alert(
          'Insufficient Tokens',
          'You don\'t have enough tokens. Upgrade your plan for more tokens.',
          [{ text: 'OK' }]
        );
        await refreshTokens();
      } else {
        Alert.alert('Error', error.message || 'Failed to generate image');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePress = () => {
    navigation.navigate('Profile');
  };

  // Get character limit based on plan
  const getDetailsCharLimit = () => {
    if (!user) return 0; // Anonymous users get 0 characters (locked)
    const planCode = user.planCode || 'ANONYMOUS';
    switch (planCode) {
      case 'ANONYMOUS':
        return 0;
      case 'FREE':
        return 10;
      case 'PLUS':
        return 50;
      case 'PRO':
        return 100;
      case 'ULTRA':
      case 'ADMIN':
        return 250;
      default:
        return 0;
    }
  };

  const detailsCharLimit = getDetailsCharLimit();
  const isDetailsLocked = !user || detailsCharLimit === 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backButtonTop} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonIcon}>←</Text>
        </TouchableOpacity>
      </SafeAreaView>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Image Generator</Text>
          <Text style={styles.subtitle}>Create stunning car visuals</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Car Details Section */}
          <Text style={styles.sectionHeader}>Car Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Make *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Honda"
              placeholderTextColor={colors.textSecondary}
              value={carSpec.make}
              onChangeText={(text) => {
                if (text.length <= 25) {
                  setCarSpec({ ...carSpec, make: text });
                }
              }}
              editable={!loading}
              maxLength={25}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Civic"
              placeholderTextColor={colors.textSecondary}
              value={carSpec.model}
              onChangeText={(text) => {
                if (text.length <= 25) {
                  setCarSpec({ ...carSpec, model: text });
                }
              }}
              editable={!loading}
              maxLength={25}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2023"
              placeholderTextColor={colors.textSecondary}
              value={carSpec.year}
              onChangeText={(text) => {
                if (text.length <= 25) {
                  setCarSpec({ ...carSpec, year: text });
                }
              }}
              keyboardType="number-pad"
              editable={!loading}
              maxLength={25}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Car Color</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Red, Blue Metallic"
              placeholderTextColor={colors.textSecondary}
              value={carSpec.color}
              onChangeText={(text) => {
                if (text.length <= 25) {
                  setCarSpec({ ...carSpec, color: text });
                }
              }}
              editable={!loading}
              maxLength={25}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wheel Color</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Black, Chrome"
              placeholderTextColor={colors.textSecondary}
              value={carSpec.wheelsColor}
              onChangeText={(text) => {
                if (text.length <= 25) {
                  setCarSpec({ ...carSpec, wheelsColor: text });
                }
              }}
              editable={!loading}
              maxLength={25}
            />
          </View>

          {/* Scene Settings Section */}
          <Text style={styles.sectionHeader}>Scene Settings</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.locationSubtext}>Select a country, then choose your location</Text>
            <View style={styles.countriesContainer}>
              {Object.entries(locationsByCountry).map(([countryKey, country]) => {
                const isExpanded = expandedCountry === countryKey;
                const isCountrySelected = country.locations.some(loc => loc.value === location);

                return (
                  <View key={countryKey} style={styles.countryCard}>
                    <TouchableOpacity
                      style={[
                        styles.countryHeader,
                        isCountrySelected && styles.countryHeaderActive
                      ]}
                      onPress={() => setExpandedCountry(isExpanded ? null : countryKey)}
                      disabled={loading}
                    >
                      <View style={styles.countryHeaderLeft}>
                        <Text style={styles.countryFlag}>{country.flag}</Text>
                        <Text style={[
                          styles.countryName,
                          isCountrySelected && styles.countryNameActive
                        ]}>
                          {country.name}
                        </Text>
                      </View>
                      <Text style={[
                        styles.expandIcon,
                        isCountrySelected && styles.expandIconActive
                      ]}>
                        {isExpanded ? '▼' : '▶'}
                      </Text>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.locationsGrid}>
                        {country.locations.map((loc) => (
                          <TouchableOpacity
                            key={loc.value}
                            style={[
                              styles.locationButton,
                              location === loc.value && styles.locationButtonSelected
                            ]}
                            onPress={() => setLocation(loc.value)}
                            disabled={loading}
                          >
                            <Text style={[
                              styles.locationButtonText,
                              location === loc.value && styles.locationButtonTextSelected
                            ]}>
                              {loc.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Art Style</Text>
            <Text style={styles.artStyleSubtext}>Choose your visual style</Text>
            <View style={styles.artStyleGrid}>
              {artStyles.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.artStyleCard,
                    style === s.value && styles.artStyleCardSelected
                  ]}
                  onPress={() => setStyle(s.value)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.artStyleLabel,
                    style === s.value && styles.artStyleLabelSelected
                  ]}>
                    {s.label}
                  </Text>
                  <Text style={[
                    styles.artStyleDescription,
                    style === s.value && styles.artStyleDescriptionSelected
                  ]}>
                    {s.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Camera Angle</Text>
            <View style={styles.buttonGrid}>
              {positions.map((pos) => (
                <TouchableOpacity
                  key={pos.value}
                  style={[
                    styles.optionButton,
                    carSpec.position === pos.value && styles.optionButtonSelected
                  ]}
                  onPress={() => setCarSpec({ ...carSpec, position: pos.value as any })}
                  disabled={loading}
                >
                  <Text style={[
                    styles.optionButtonText,
                    carSpec.position === pos.value && styles.optionButtonTextSelected
                  ]}>
                    {pos.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Styling Options Section */}
          <Text style={styles.sectionHeader}>Styling Options</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Options (Multiple)</Text>
            <View style={styles.buttonGrid}>
              <TouchableOpacity
                style={[
                  styles.multiSelectButton,
                  carSpec.addModel && styles.multiSelectButtonSelected
                ]}
                onPress={() => setCarSpec({ ...carSpec, addModel: !carSpec.addModel })}
                disabled={loading}
              >
                <Text style={[
                  styles.multiSelectButtonText,
                  carSpec.addModel && styles.multiSelectButtonTextSelected
                ]}>
                  Add Model
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.multiSelectButton,
                  carSpec.deBadged && styles.multiSelectButtonSelected
                ]}
                onPress={() => setCarSpec({ ...carSpec, deBadged: !carSpec.deBadged })}
                disabled={loading}
              >
                <Text style={[
                  styles.multiSelectButtonText,
                  carSpec.deBadged && styles.multiSelectButtonTextSelected
                ]}>
                  De-Badged
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.multiSelectButton,
                  carSpec.chromeDelete && styles.multiSelectButtonSelected
                ]}
                onPress={() => setCarSpec({ ...carSpec, chromeDelete: !carSpec.chromeDelete })}
                disabled={loading}
              >
                <Text style={[
                  styles.multiSelectButtonText,
                  carSpec.chromeDelete && styles.multiSelectButtonTextSelected
                ]}>
                  Chrome Delete
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.multiSelectButton,
                  carSpec.darkTint && styles.multiSelectButtonSelected
                ]}
                onPress={() => setCarSpec({ ...carSpec, darkTint: !carSpec.darkTint })}
                disabled={loading}
              >
                <Text style={[
                  styles.multiSelectButtonText,
                  carSpec.darkTint && styles.multiSelectButtonTextSelected
                ]}>
                  Dark Tint
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Details */}
          <View style={[styles.inputGroup, styles.detailsSection]}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>✨ Additional Details</Text>
              <Text style={styles.detailsSubtitle}>Let your creativity shine!</Text>
            </View>

            {isDetailsLocked ? (
              <View style={styles.lockedContainer}>
                <View style={styles.lockedOverlay}>
                  <Text style={styles.lockedIcon}>🔒</Text>
                  <Text style={styles.lockedText}>Sign in to unlock custom details</Text>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={handleUpgradePress}
                  >
                    <Text style={styles.upgradeButtonText}>Sign In / Upgrade</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea, styles.lockedInput]}
                  placeholder="e.g., lowered suspension, custom body kit, neon underglow..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  editable={false}
                />
              </View>
            ) : (
              <>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., lowered suspension, custom body kit, neon underglow..."
                  placeholderTextColor={colors.textSecondary}
                  value={carSpec.details}
                  onChangeText={(text) => {
                    if (text.length <= detailsCharLimit) {
                      setCarSpec({ ...carSpec, details: text });
                    }
                  }}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                  maxLength={detailsCharLimit}
                />
                <View style={styles.charCountContainer}>
                  <Text style={[
                    styles.charCount,
                    carSpec.details.length >= detailsCharLimit && styles.charCountLimit
                  ]}>
                    {carSpec.details.length} / {detailsCharLimit} characters
                  </Text>
                  {detailsCharLimit < 250 && (
                    <TouchableOpacity onPress={handleUpgradePress}>
                      <Text style={styles.upgradeLink}>Upgrade for more</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.buttonText}>Generate Image</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  picker: {
    color: colors.textPrimary,
    backgroundColor: colors.secondary,
  },
  pickerItem: {
    color: colors.textPrimary,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    minWidth: '48%',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  optionButtonTextSelected: {
    color: colors.background,
  },
  artStyleSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  artStyleGrid: {
    gap: 12,
  },
  artStyleCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.divider,
  },
  artStyleCardSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  artStyleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  artStyleLabelSelected: {
    color: colors.primary,
  },
  artStyleDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  artStyleDescriptionSelected: {
    color: colors.textPrimary,
  },
  locationSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  countriesContainer: {
    gap: 12,
  },
  countryCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  countryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.secondary,
  },
  countryHeaderActive: {
    backgroundColor: colors.primary + '15',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  countryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryFlag: {
    fontSize: 32,
  },
  countryName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  countryNameActive: {
    color: colors.primary,
  },
  expandIcon: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  expandIconActive: {
    color: colors.primary,
  },
  locationsGrid: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: colors.background,
  },
  locationButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    width: '48%',
    alignItems: 'center',
  },
  locationButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  locationButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  locationButtonTextSelected: {
    color: colors.background,
  },
  multiSelectButton: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    minWidth: '48%',
    alignItems: 'center',
  },
  multiSelectButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  multiSelectButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  multiSelectButtonTextSelected: {
    color: colors.background,
  },
  detailsSection: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    marginTop: 8,
  },
  detailsHeader: {
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detailsSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  lockedContainer: {
    position: 'relative',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 20,
  },
  lockedInput: {
    opacity: 0.5,
  },
  lockedIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  upgradeButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  charCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  charCountLimit: {
    color: colors.primary,
    fontWeight: '600',
  },
  upgradeLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImageGeneratorScreen;
