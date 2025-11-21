// NATIVE APP - Build Plan Results Screen
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import type { BuildPlanResponse, VehicleSpec } from '../types';

const BuildPlanResultsScreen = ({ route, navigation }: any) => {
  const { results, vehicleSpec }: { results: BuildPlanResponse; vehicleSpec: VehicleSpec } = route.params;

  const difficultyColor = {
    Beginner: colors.success,
    Intermediate: '#FFA500',
    Advanced: '#dc2626',
    Professional: '#9333ea',
  }[results.difficulty];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Build Plan</Text>
          <Text style={styles.carInfo}>
            {vehicleSpec.year} {vehicleSpec.make} {vehicleSpec.model} {vehicleSpec.trim}
          </Text>
        </View>

        {/* Stage & Difficulty */}
        <View style={styles.badgesContainer}>
          <View style={styles.stageBadge}>
            <Text style={styles.stageText}>{results.stage}</Text>
          </View>
          <View style={[styles.difficultyBadge, { borderColor: difficultyColor }]}>
            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
              {results.difficulty}
            </Text>
          </View>
        </View>

        {/* Cost Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Breakdown</Text>
          <LinearGradient
            colors={[colors.build.start, colors.build.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.costGradient}
          >
            <View style={styles.costGrid}>
              <View style={styles.costCard}>
                <Text style={styles.costValue}>${results.totalPartsCost.toLocaleString()}</Text>
                <Text style={styles.costLabel}>Parts Only</Text>
              </View>
              <View style={styles.costCard}>
                <Text style={styles.costValue}>${results.totalDIYCost.toLocaleString()}</Text>
                <Text style={styles.costLabel}>DIY Install</Text>
              </View>
              <View style={styles.costCard}>
                <Text style={styles.costValue}>${results.totalProfessionalCost.toLocaleString()}</Text>
                <Text style={styles.costLabel}>Pro Shop</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Timeframe */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Estimated Timeframe</Text>
          <Text style={styles.infoValue}>{results.timeframe}</Text>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Parts</Text>
          {results.recommendations.map((rec, index) => (
            <View key={index} style={styles.partCard}>
              <Text style={styles.partName}>{rec.name}</Text>
              <Text style={styles.partDescription}>{rec.description}</Text>
              <View style={styles.partPricing}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Part:</Text>
                  <Text style={styles.priceValue}>${rec.partPrice.toLocaleString()}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>DIY Labor:</Text>
                  <Text style={styles.priceValue}>${rec.diyShopCost.toLocaleString()}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Pro Labor:</Text>
                  <Text style={styles.priceValue}>${rec.professionalShopCost.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Explanation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Build Strategy</Text>
          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>
              {results.explanation.split('\n').map((line, i) => (
                line.trim() ? line.trim() + '\n' : '\n'
              )).join('')}
            </Text>
          </View>
        </View>

        {/* Warnings */}
        {results.warnings && results.warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Important Notes</Text>
            <View style={styles.warningsCard}>
              {results.warnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>• {warning}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('BuildPlanner')}
          >
            <Text style={styles.primaryButtonText}>Plan Another Build</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
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
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  stageBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  stageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  difficultyBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
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
  costGradient: {
    borderRadius: 16,
    padding: 16,
  },
  costGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costCard: {
    flex: 1,
    alignItems: 'center',
  },
  costValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  costLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
  },
  infoCard: {
    marginHorizontal: 20,
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  partCard: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  partName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  partDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  partPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
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
  warningsCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  warningText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
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
  secondaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BuildPlanResultsScreen;
