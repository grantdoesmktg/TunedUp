// NATIVE APP - Build Planner Screen
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { buildPlannerAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { QuotaDisplay } from '../components/QuotaDisplay';
import { colors } from '../theme/colors';
import type { VehicleSpec, BuildPlanResponse } from '../types';

const BuildPlannerScreen = ({ navigation }: any) => {
  const { refreshUser } = useAuth();
  const { checkQuota, refreshQuota } = useQuota();
  const [vehicleSpec, setVehicleSpec] = useState<VehicleSpec>({
    make: '',
    model: '',
    year: '',
    trim: '',
    question: '',
  });
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!vehicleSpec.make || !vehicleSpec.model || !vehicleSpec.year || !vehicleSpec.question) {
      Alert.alert('Missing Info', 'Please fill in all required fields');
      return;
    }

    // Check quota before making the request
    const quotaCheck = await checkQuota('build');
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
      const response: BuildPlanResponse = await buildPlannerAPI.generateBuildPlan(vehicleSpec);
      // Refresh quota and user data to update usage counts
      await Promise.all([
        refreshQuota(),
        refreshUser().catch(() => {}) // Ignore errors for unauthenticated users
      ]);
      navigation.navigate('BuildPlanResults', { results: response, vehicleSpec });
    } catch (error: any) {
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota')) {
        Alert.alert(
          'Usage Limit Reached',
          'You\'ve reached your monthly usage limit. Sign in for more credits or wait until next month.',
          [{ text: 'OK' }]
        );
        await refreshQuota();
      } else {
        Alert.alert('Error', error.message || 'Failed to generate build plan');
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
          <Text style={styles.title}>Build Planner</Text>
          <Text style={styles.subtitle}>Get AI-powered build recommendations</Text>
        </View>

        {/* Quota Display */}
        <View style={styles.quotaContainer}>
          <QuotaDisplay toolType="build" onUpgradePress={handleUpgradePress} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Make */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Make *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Honda"
              placeholderTextColor={colors.textSecondary}
              value={vehicleSpec.make}
              onChangeText={(text) => setVehicleSpec({ ...vehicleSpec, make: text })}
              editable={!loading}
            />
          </View>

          {/* Model */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Civic"
              placeholderTextColor={colors.textSecondary}
              value={vehicleSpec.model}
              onChangeText={(text) => setVehicleSpec({ ...vehicleSpec, model: text })}
              editable={!loading}
            />
          </View>

          {/* Year */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2023"
              placeholderTextColor={colors.textSecondary}
              value={vehicleSpec.year}
              onChangeText={(text) => setVehicleSpec({ ...vehicleSpec, year: text })}
              keyboardType="number-pad"
              editable={!loading}
            />
          </View>

          {/* Trim */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trim (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Type R"
              placeholderTextColor={colors.textSecondary}
              value={vehicleSpec.trim}
              onChangeText={(text) => setVehicleSpec({ ...vehicleSpec, trim: text })}
              editable={!loading}
            />
          </View>

          {/* Question/Goal */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Build Goal *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., I want a $5000 power-focused build for track days..."
              placeholderTextColor={colors.textSecondary}
              value={vehicleSpec.question}
              onChangeText={(text) => setVehicleSpec({ ...vehicleSpec, question: text })}
              multiline
              numberOfLines={4}
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
              <Text style={styles.buttonText}>Generate Build Plan</Text>
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
    height: 100,
    textAlignVertical: 'top',
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

export default BuildPlannerScreen;
