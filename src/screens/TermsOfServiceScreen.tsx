// NATIVE APP - Terms of Service screen
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

export default function TermsOfServiceScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>TunedUp Terms of Service</Text>
          <Text style={styles.effectiveDate}>Effective Date: September 29, 2025</Text>

          <Text style={styles.paragraph}>
            Welcome to TunedUp! These Terms of Service ("Terms") govern your use of our website, tools, and services ("Services"). By using TunedUp, you agree to these Terms.
          </Text>

          <Text style={styles.sectionTitle}>1. Use of Services</Text>
          <Text style={styles.bulletPoint}>• You must be at least 13 years old to use TunedUp.</Text>
          <Text style={styles.bulletPoint}>• You agree to use TunedUp only for lawful purposes.</Text>
          <Text style={styles.bulletPoint}>• You are responsible for keeping your account login credentials secure.</Text>

          <Text style={styles.sectionTitle}>2. Accounts & Subscriptions</Text>
          <Text style={styles.bulletPoint}>• Some features require an account and/or a paid plan.</Text>
          <Text style={styles.bulletPoint}>• All payments are processed securely by Stripe.</Text>
          <Text style={styles.bulletPoint}>• We may adjust quotas, pricing, or features. If we do, we'll notify you in advance.</Text>

          <Text style={styles.sectionTitle}>3. Intellectual Property</Text>
          <Text style={styles.bulletPoint}>• All content, code, and design of TunedUp are owned by us.</Text>
          <Text style={styles.bulletPoint}>
            • You retain rights to the content you create using our tools, subject to the limits of the underlying APIs (e.g., OpenAI, Gemini).
          </Text>

          <Text style={styles.sectionTitle}>4. Disclaimer of Warranties</Text>
          <Text style={styles.bulletPoint}>• TunedUp is provided "as is" and "as available."</Text>
          <Text style={styles.bulletPoint}>• We make no guarantees about accuracy, availability, or fitness for a particular purpose.</Text>

          <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the fullest extent permitted by law, TunedUp is not liable for any damages that may result from using our Services.
          </Text>

          <Text style={styles.sectionTitle}>6. Termination</Text>
          <Text style={styles.bulletPoint}>• You may close your account anytime.</Text>
          <Text style={styles.bulletPoint}>• We may suspend or terminate accounts that abuse the Services or violate these Terms.</Text>

          <Text style={styles.sectionTitle}>7. Changes</Text>
          <Text style={styles.paragraph}>
            We may update these Terms from time to time. If we make significant changes, we'll notify you by email or an in-app notice.
          </Text>

          <Text style={styles.sectionTitle}>8. Contact</Text>
          <Text style={styles.paragraph}>
            Questions? Email us at support@tunedup.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.secondary,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  effectiveDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 16,
  },
});
