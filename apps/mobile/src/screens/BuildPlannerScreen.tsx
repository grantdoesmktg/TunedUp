// NATIVE APP - Build Planner Screen
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { buildPlannerAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { colors } from '../theme/colors';
import type { VehicleSpec, BuildPlanResponse } from '../types';

const BUDGET_OPTIONS = [
  { label: 'Select Budget', value: '' },
  { label: '$1,000', value: '1000' },
  { label: '$2,500', value: '2500' },
  { label: '$5,000', value: '5000' },
  { label: '$7,500', value: '7500' },
  { label: '$10,000', value: '10000' },
  { label: '$12,500', value: '12500' },
  { label: '$15,000', value: '15000' },
  { label: '$20,000', value: '20000' },
  { label: '$30,000', value: '30000' },
];

const BuildPlannerScreen = ({ navigation }: any) => {
  const { refreshUser, isAuthenticated } = useAuth();
  const { checkTokens, refreshTokens, incrementAnonymousUsage, tokenInfo } = useQuota();
  const [vehicleSpec, setVehicleSpec] = useState<VehicleSpec>({
    make: '',
    model: '',
    year: '',
    trim: '',
    question: '',
  });
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!vehicleSpec.make || !vehicleSpec.model || !vehicleSpec.year || !vehicleSpec.question) {
      Alert.alert('Missing Info', 'Please fill in all required fields');
      return;
    }

    // Check tokens before making the request
    const tokenCheck = await checkTokens('build');
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
      const response: BuildPlanResponse = await buildPlannerAPI.generateBuildPlan(vehicleSpec);

      // Increment usage for anonymous users
      if (!isAuthenticated && tokenInfo?.planCode === 'ANONYMOUS') {
        await incrementAnonymousUsage('build');
      }

      // Refresh tokens and user data to update usage counts
      await Promise.all([
        refreshTokens(),
        refreshUser().catch(() => {}) // Ignore errors for unauthenticated users
      ]);
      navigation.navigate('BuildPlanResults', { results: response, vehicleSpec });
    } catch (error: any) {
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota') || error.message?.includes('tokens')) {
        Alert.alert(
          'Insufficient Tokens',
          'You don\'t have enough tokens. Upgrade your plan for more tokens.',
          [{ text: 'OK' }]
        );
        await refreshTokens();
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
          <Text style={styles.title}>Build Planner</Text>
          <Text style={styles.subtitle}>Get AI-powered build recommendations</Text>
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

          {/* Budget */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Budget *</Text>
            <Picker
              selectedValue={budget}
              onValueChange={(value) => {
                setBudget(value);
                // Update question to include budget
                if (value) {
                  const budgetText = BUDGET_OPTIONS.find(opt => opt.value === value)?.label || '';
                  const currentQuestion = vehicleSpec.question.replace(/^\$[\d,]+\s*-?\s*/i, '');
                  setVehicleSpec({
                    ...vehicleSpec,
                    question: budgetText ? `${budgetText} - ${currentQuestion}` : currentQuestion
                  });
                }
              }}
              style={styles.picker}
              enabled={!loading}
            >
              {BUDGET_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} color={colors.textPrimary} />
              ))}
            </Picker>
          </View>

          {/* Question/Goal */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Build Goal *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., power-focused build for track days..."
              placeholderTextColor={colors.textSecondary}
              value={vehicleSpec.question.replace(/^\$[\d,]+\s*-?\s*/i, '')}
              onChangeText={(text) => {
                const budgetText = budget ? (BUDGET_OPTIONS.find(opt => opt.value === budget)?.label || '') : '';
                setVehicleSpec({
                  ...vehicleSpec,
                  question: budgetText ? `${budgetText} - ${text}` : text
                });
              }}
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
  picker: {
    color: colors.textPrimary,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
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
