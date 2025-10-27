// NATIVE APP - AI Image Generator Screen
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { imageGeneratorAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { QuotaDisplay } from '../components/QuotaDisplay';
import { colors } from '../theme/colors';
import type { CarSpec, ImageGeneratorResponse } from '../types';

const ImageGeneratorScreen = ({ navigation }: any) => {
  const { refreshUser, user, isAuthenticated } = useAuth();
  const { checkQuota, refreshQuota, incrementAnonymousUsage, quotaInfo } = useQuota();
  const [carSpec, setCarSpec] = useState<CarSpec>({
    year: '',
    make: '',
    model: '',
    color: 'Red',
    wheelsColor: 'Black',
    addModel: false,
    deBadged: false,
    chromeDelete: false,
    darkTint: false,
    position: 'quarter',
    details: '',
  });
  const [location, setLocation] = useState('tokyo_shibuya');
  const [timeOfDay, setTimeOfDay] = useState('dusk');
  const [style, setStyle] = useState('photoreal');
  const [colorPalette, setColorPalette] = useState('warm_sunset');
  const [loading, setLoading] = useState(false);

  // Location options grouped by country
  const locations = [
    { label: '🇯🇵 Tokyo - Shibuya', value: 'tokyo_shibuya' },
    { label: '🇯🇵 Mount Fuji - Hakone', value: 'mount_fuji_hakone' },
    { label: '🇯🇵 Osaka Bay', value: 'osaka_bay' },
    { label: '🇯🇵 Kyoto Outskirts', value: 'kyoto_outskirts' },
    { label: '🇩🇪 Munich Alps', value: 'munich_alps' },
    { label: '🇩🇪 Stuttgart', value: 'stuttgart' },
    { label: '🇩🇪 Berlin', value: 'berlin' },
    { label: '🇩🇪 Nürburgring', value: 'nurburgring' },
    { label: '🇺🇸 Los Angeles', value: 'los_angeles' },
    { label: '🇺🇸 Detroit', value: 'detroit' },
    { label: '🇺🇸 Las Vegas Desert', value: 'las_vegas_desert' },
    { label: '🇺🇸 Miami', value: 'miami' },
    { label: '🇰🇷 Seoul - Gangnam', value: 'seoul_gangnam' },
    { label: '🇰🇷 Busan', value: 'busan' },
    { label: '🇰🇷 Incheon', value: 'incheon' },
    { label: '🇰🇷 Jeju Island', value: 'jeju_island' },
    { label: '🇮🇹 Maranello', value: 'maranello' },
    { label: '🇮🇹 Sant\'Agata Bolognese', value: 'santagata_bolognese' },
    { label: '🇮🇹 Modena', value: 'modena' },
    { label: '🇮🇹 Amalfi Coast', value: 'amalfi_coast' },
  ];

  const times = [
    { label: '🌅 Dawn', value: 'dawn' },
    { label: '🌇 Dusk (Golden Hour)', value: 'dusk' },
    { label: '☀️ Midday', value: 'midday' },
    { label: '🌙 Midnight', value: 'midnight' },
  ];

  const artStyles = [
    { label: '📷 Photorealistic', value: 'photoreal' },
    { label: '🎨 Borderlands', value: 'borderlands' },
    { label: '🌊 Vaporwave', value: 'vaporwave' },
    { label: '✏️ Concept Sketch', value: 'concept_art' },
  ];

  const palettes = [
    { label: '🌅 Warm Sunset', value: 'warm_sunset' },
    { label: '🌃 Neo Tokyo', value: 'neo_tokyo' },
    { label: '🥂 Champagne Gold', value: 'champagne_gold' },
    { label: '🎨 Graffiti Pop', value: 'graffiti_pop' },
  ];

  const colors_list = ['Red', 'Blue', 'Black', 'White', 'Silver', 'Gray', 'Green', 'Yellow', 'Orange', 'Purple', 'Brown', 'Gold'];
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

    // Check quota before making the request
    const quotaCheck = await checkQuota('image');
    if (!quotaCheck.allowed) {
      Alert.alert(
        'Usage Limit Reached',
        quotaCheck.message || 'You\'ve reached your monthly usage limit. Sign in for more credits or wait until next month.',
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
          timeKey: timeOfDay,
          styleKey: style,
          paletteKey: colorPalette,
        },
      };

      const imageParams = {
        width: 1024,
        height: 1024,
      };

      const response: ImageGeneratorResponse = await imageGeneratorAPI.generateImage(promptSpec, imageParams);

      // Increment usage for anonymous users, refresh for authenticated users
      if (!isAuthenticated && quotaInfo?.planCode === 'ANONYMOUS') {
        await incrementAnonymousUsage('image');
      }

      // Refresh quota and user data to update usage counts
      await Promise.all([
        refreshQuota(),
        refreshUser().catch(() => {}) // Ignore errors for unauthenticated users
      ]);

      navigation.navigate('ImageResults', { results: response, carSpec });
    } catch (error: any) {
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota')) {
        Alert.alert(
          'Usage Limit Reached',
          'You\'ve reached your monthly usage limit. Sign in for more credits or wait until next month.',
          [{ text: 'OK' }]
        );
        await refreshQuota();
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>AI Image Generator</Text>
          <Text style={styles.subtitle}>Create stunning car visuals</Text>
        </View>

        {/* Quota Display */}
        <View style={styles.quotaContainer}>
          <QuotaDisplay toolType="image" onUpgradePress={handleUpgradePress} />
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
              onChangeText={(text) => setCarSpec({ ...carSpec, make: text })}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Civic"
              placeholderTextColor={colors.textSecondary}
              value={carSpec.model}
              onChangeText={(text) => setCarSpec({ ...carSpec, model: text })}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2023"
              placeholderTextColor={colors.textSecondary}
              value={carSpec.year}
              onChangeText={(text) => setCarSpec({ ...carSpec, year: text })}
              keyboardType="number-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Car Color</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={carSpec.color}
                onValueChange={(value) => setCarSpec({ ...carSpec, color: value })}
                style={styles.picker}
                mode="dropdown"
                enabled={!loading}
              >
                {colors_list.map((color) => (
                  <Picker.Item key={color} label={color} value={color} color={colors.textPrimary} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Wheel Color</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={carSpec.wheelsColor}
                onValueChange={(value) => setCarSpec({ ...carSpec, wheelsColor: value })}
                style={styles.picker}
                mode="dropdown"
                enabled={!loading}
              >
                {colors_list.map((color) => (
                  <Picker.Item key={color} label={color} value={color} color={colors.textPrimary} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Scene Settings Section */}
          <Text style={styles.sectionHeader}>Scene Settings</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={location}
                onValueChange={setLocation}
                style={styles.picker}
                mode="dropdown"
                enabled={!loading}
              >
                {locations.map((loc) => (
                  <Picker.Item key={loc.value} label={loc.label} value={loc.value} color={colors.textPrimary} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time of Day</Text>
            <View style={styles.buttonGrid}>
              {times.map((time) => (
                <TouchableOpacity
                  key={time.value}
                  style={[
                    styles.optionButton,
                    timeOfDay === time.value && styles.optionButtonSelected
                  ]}
                  onPress={() => setTimeOfDay(time.value)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.optionButtonText,
                    timeOfDay === time.value && styles.optionButtonTextSelected
                  ]}>
                    {time.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Art Style</Text>
            <View style={styles.buttonGrid}>
              {artStyles.map((s) => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.optionButton,
                    style === s.value && styles.optionButtonSelected
                  ]}
                  onPress={() => setStyle(s.value)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.optionButtonText,
                    style === s.value && styles.optionButtonTextSelected
                  ]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color Palette</Text>
            <View style={styles.buttonGrid}>
              {palettes.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.optionButton,
                    colorPalette === p.value && styles.optionButtonSelected
                  ]}
                  onPress={() => setColorPalette(p.value)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.optionButtonText,
                    colorPalette === p.value && styles.optionButtonTextSelected
                  ]}>
                    {p.label}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 24,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 16,
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
  quotaContainer: {
    paddingHorizontal: 20,
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
