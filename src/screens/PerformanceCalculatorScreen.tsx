// NATIVE APP - Performance Calculator Screen
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { performanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useQuota } from '../contexts/QuotaContext';
import { colors } from '../theme/colors';
import type { CarInput, AIResponse } from '../types';

const QUICK_ADD_MODS = [
  "Catback Exhaust",
  "ECU Tune Stage 1",
  "Cold Air Intake",
  "Muffler Delete",
  "High-Flow air filter",
  "Axle-Back Exhaust",
  "Downpipes Catted",
  "Downpipes Catless",
  "Upgraded Intercooler",
  "Upgraded Fuel Pump",
  "Ported Intake Manifold",
  "Coilovers",
  "Lowering Springs",
];

const PerformanceCalculatorScreen = ({ navigation }: any) => {
  const { refreshUser, isAuthenticated } = useAuth();
  const { checkTokens, refreshTokens, incrementAnonymousUsage, tokenInfo } = useQuota();
  const [carInput, setCarInput] = useState<CarInput>({
    make: '',
    model: '',
    year: '',
    trim: '',
    drivetrain: 'Not Specified',
    transmission: 'Not Specified',
    modifications: '',
    tireType: 'Not Specified',
    fuelType: 'Not Specified',
    launchTechnique: 'Not Specified',
  });
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!carInput.make || !carInput.model || !carInput.year) {
      Alert.alert('Missing Info', 'Please enter make, model, and year');
      return;
    }

    // Check tokens before making the request
    const tokenCheck = await checkTokens('performance');
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
      const response: AIResponse = await performanceAPI.calculatePerformance(carInput);

      // Increment usage for anonymous users
      if (!isAuthenticated && tokenInfo?.planCode === 'ANONYMOUS') {
        await incrementAnonymousUsage('performance');
      }

      // Refresh tokens and user data to update usage counts
      await Promise.all([
        refreshTokens(),
        refreshUser().catch(() => {}) // Ignore errors for unauthenticated users
      ]);
      navigation.navigate('PerformanceResults', { results: response, carInput });
    } catch (error: any) {
      if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('quota') || error.message?.includes('tokens')) {
        Alert.alert(
          'Insufficient Tokens',
          'You don\'t have enough tokens. Upgrade your plan for more tokens.',
          [{ text: 'OK' }]
        );
        // Refresh tokens to show updated state
        await refreshTokens();
      } else {
        Alert.alert('Error', error.message || 'Failed to calculate performance');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePress = () => {
    navigation.navigate('Profile');
  };

  const handleQuickAdd = (mod: string) => {
    setCarInput(prev => {
      const existingMods = prev.modifications.trim();
      if (existingMods.toLowerCase().includes(mod.toLowerCase())) {
        return prev;
      }
      const newMods = existingMods ? `${existingMods}, ${mod}` : mod;
      return { ...prev, modifications: newMods };
    });
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
          <Text style={styles.title}>Performance Calculator</Text>
          <Text style={styles.subtitle}>Enter your car details</Text>
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
              value={carInput.make}
              onChangeText={(text) => setCarInput({ ...carInput, make: text })}
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
              value={carInput.model}
              onChangeText={(text) => setCarInput({ ...carInput, model: text })}
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
              value={carInput.year}
              onChangeText={(text) => setCarInput({ ...carInput, year: text })}
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
              value={carInput.trim}
              onChangeText={(text) => setCarInput({ ...carInput, trim: text })}
              editable={!loading}
            />
          </View>

          {/* Modifications */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Modifications</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Cold air intake, cat-back exhaust, ECU tune..."
              placeholderTextColor={colors.textSecondary}
              value={carInput.modifications}
              onChangeText={(text) => setCarInput({ ...carInput, modifications: text })}
              multiline
              numberOfLines={4}
              editable={!loading}
            />
            <Text style={styles.quickAddLabel}>Quick Add:</Text>
            <View style={styles.quickAddContainer}>
              {QUICK_ADD_MODS.map((mod) => (
                <TouchableOpacity
                  key={mod}
                  style={styles.quickAddButton}
                  onPress={() => handleQuickAdd(mod)}
                  disabled={loading}
                >
                  <Text style={styles.quickAddButtonText}>{mod}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCalculate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.buttonText}>Calculate Performance</Text>
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
  quickAddLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  quickAddContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAddButton: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quickAddButtonText: {
    color: colors.primary,
    fontSize: 13,
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

export default PerformanceCalculatorScreen;
