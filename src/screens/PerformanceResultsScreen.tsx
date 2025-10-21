// NATIVE APP - Performance Results Screen
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { savedPerformanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { AIResponse, CarInput } from '../types';

const PerformanceResultsScreen = ({ route, navigation }: any) => {
  const { results, carInput }: { results: AIResponse; carInput: CarInput } = route.params;
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const confidenceColor = {
    Low: colors.error,
    Medium: '#FFA500',
    High: colors.success,
  }[results.confidence];

  const handleSavePerformance = async () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please sign in to save your performance calculation.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Login', onPress: () => navigation.navigate('Profile') }
        ]
      );
      return;
    }

    setSaving(true);
    try {
      await savedPerformanceAPI.savePerformance(carInput, results);
      setIsSaved(true);
      Alert.alert('Success', 'Performance calculation saved to your profile!');
    } catch (error: any) {
      console.error('Save performance error:', error);
      Alert.alert('Error', error.message || 'Failed to save performance calculation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Performance Results</Text>
          <Text style={styles.carInfo}>
            {carInput.year} {carInput.make} {carInput.model} {carInput.trim}
          </Text>
        </View>

        {/* Confidence Badge */}
        <View style={styles.confidenceBadge}>
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            {results.confidence} Confidence
          </Text>
        </View>

        {/* Stock Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Performance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{results.stockPerformance.horsepower}</Text>
              <Text style={styles.statLabel}>HP</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{results.stockPerformance.whp}</Text>
              <Text style={styles.statLabel}>WHP</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{results.stockPerformance.zeroToSixty.toFixed(2)}</Text>
              <Text style={styles.statLabel}>0-60 mph</Text>
            </View>
          </View>
        </View>

        {/* Modified Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modified Performance</Text>
          <LinearGradient
            colors={[colors.performance.start, colors.performance.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modifiedGradient}
          >
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, styles.modifiedStatValue]}>
                  {results.estimatedPerformance.horsepower}
                </Text>
                <Text style={[styles.statLabel, styles.modifiedStatLabel]}>HP</Text>
                <Text style={styles.gain}>
                  +{results.estimatedPerformance.horsepower - results.stockPerformance.horsepower}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, styles.modifiedStatValue]}>
                  {results.estimatedPerformance.whp}
                </Text>
                <Text style={[styles.statLabel, styles.modifiedStatLabel]}>WHP</Text>
                <Text style={styles.gain}>
                  +{results.estimatedPerformance.whp - results.stockPerformance.whp}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, styles.modifiedStatValue]}>
                  {results.estimatedPerformance.zeroToSixty.toFixed(2)}
                </Text>
                <Text style={[styles.statLabel, styles.modifiedStatLabel]}>0-60 mph</Text>
                <Text style={styles.gain}>
                  -{(results.stockPerformance.zeroToSixty - results.estimatedPerformance.zeroToSixty).toFixed(2)}s
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Explanation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analysis</Text>
          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>
              {results.explanation.split('\n').map((line, i) => (
                line.trim() ? line.trim() + '\n' : '\n'
              )).join('')}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, (saving || isSaved) && styles.buttonDisabled]}
            onPress={handleSavePerformance}
            disabled={saving || isSaved}
          >
            {saving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSaved ? '✓ Saved to Profile' : 'Save to Profile'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('PerformanceCalculator')}
          >
            <Text style={styles.secondaryButtonText}>Calculate Another</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.tertiaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 16,
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
  carInfo: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  confidenceBadge: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  modifiedGradient: {
    borderRadius: 16,
    padding: 2,
  },
  modifiedStatValue: {
    color: '#FFF',
  },
  modifiedStatLabel: {
    color: '#FFF',
    opacity: 0.9,
  },
  gain: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
    fontWeight: '600',
  },
  explanationCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
  },
  explanationText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  tertiaryButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PerformanceResultsScreen;
