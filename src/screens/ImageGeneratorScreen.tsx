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
  const { refreshUser } = useAuth();
  const { checkQuota, refreshQuota } = useQuota();
  const [carSpec, setCarSpec] = useState<CarSpec>({
    year: '',
    make: '',
    model: '',
    color: 'Red',
    wheelsColor: 'Black',
    addModel: false,
    deBadged: false,
    chromeDelete: false,
    position: 'quarter',
    details: '',
  });
  const [location, setLocation] = useState('tokyo_shibuya');
  const [timeOfDay, setTimeOfDay] = useState('dusk');
  const [style, setStyle] = useState('photoreal');
  const [colorPalette, setColorPalette] = useState('cool_teal');
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

  const styles = [
    { label: '📷 Photorealistic', value: 'photoreal' },
    { label: '🎨 Borderlands (Cell-Shaded)', value: 'borderlands' },
    { label: '🌊 Vaporwave', value: 'vaporwave' },
    { label: '✏️ Concept Art Sketch', value: 'concept_art' },
  ];

  const palettes = [
    { label: '❄️ Cool Teal', value: 'cool_teal' },
    { label: '🌅 Warm Sunset', value: 'warm_sunset' },
    { label: '⚫ Monochrome Slate', value: 'monochrome_slate' },
    { label: '🌃 Neo Tokyo', value: 'neo_tokyo' },
    { label: '📼 Vintage Film', value: 'vintage_film' },
    { label: '🥂 Champagne Gold', value: 'champagne_gold' },
    { label: '🏁 Racing Heritage', value: 'racing_heritage' },
    { label: '🎨 Graffiti Pop', value: 'graffiti_pop' },
    { label: '🏜️ Earth & Sand', value: 'earth_sand' },
    { label: '🌈 Holographic Fade', value: 'holographic_fade' },
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
                enabled={!loading}
              >
                {colors_list.map((color) => (
                  <Picker.Item key={color} label={color} value={color} />
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
                enabled={!loading}
              >
                {colors_list.map((color) => (
                  <Picker.Item key={color} label={color} value={color} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Camera Angle</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={carSpec.position}
                onValueChange={(value) => setCarSpec({ ...carSpec, position: value as any })}
                style={styles.picker}
                enabled={!loading}
              >
                {positions.map((pos) => (
                  <Picker.Item key={pos.value} label={pos.label} value={pos.value} />
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
                enabled={!loading}
              >
                {locations.map((loc) => (
                  <Picker.Item key={loc.value} label={loc.label} value={loc.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time of Day</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={timeOfDay}
                onValueChange={setTimeOfDay}
                style={styles.picker}
                enabled={!loading}
              >
                {times.map((time) => (
                  <Picker.Item key={time.value} label={time.label} value={time.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Art Style</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={style}
                onValueChange={setStyle}
                style={styles.picker}
                enabled={!loading}
              >
                {styles.map((s) => (
                  <Picker.Item key={s.value} label={s.label} value={s.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color Palette</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={colorPalette}
                onValueChange={setColorPalette}
                style={styles.picker}
                enabled={!loading}
              >
                {palettes.map((p) => (
                  <Picker.Item key={p.value} label={p.label} value={p.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Styling Options Section */}
          <Text style={styles.sectionHeader}>Styling Options</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Add Model</Text>
            <Switch
              value={carSpec.addModel}
              onValueChange={(value) => setCarSpec({ ...carSpec, addModel: value })}
              disabled={loading}
              trackColor={{ false: colors.divider, true: colors.primary }}
              thumbColor={carSpec.addModel ? colors.background : colors.textSecondary}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>De-Badged</Text>
            <Switch
              value={carSpec.deBadged}
              onValueChange={(value) => setCarSpec({ ...carSpec, deBadged: value })}
              disabled={loading}
              trackColor={{ false: colors.divider, true: colors.primary }}
              thumbColor={carSpec.deBadged ? colors.background : colors.textSecondary}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Chrome Delete</Text>
            <Switch
              value={carSpec.chromeDelete}
              onValueChange={(value) => setCarSpec({ ...carSpec, chromeDelete: value })}
              disabled={loading}
              trackColor={{ false: colors.divider, true: colors.primary }}
              thumbColor={carSpec.chromeDelete ? colors.background : colors.textSecondary}
            />
          </View>

          {/* Additional Details */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Details (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., lowered suspension, custom body kit..."
              placeholderTextColor={colors.textSecondary}
              value={carSpec.details}
              onChangeText={(text) => setCarSpec({ ...carSpec, details: text })}
              multiline
              numberOfLines={3}
              editable={!loading}
            />
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
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
