// NATIVE APP - Privacy Policy screen
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

export default function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>TunedUp Privacy Policy</Text>
          <Text style={styles.effectiveDate}>Effective Date: September 29, 2025</Text>

          <Text style={styles.paragraph}>
            TunedUp ("TunedUp," "we," "us," or "our") respects your privacy. This Privacy Policy explains what we
            collect, how we use it, and the choices you have.
          </Text>

          <Text style={styles.sectionTitle}>1) Information We Collect</Text>
          <Text style={styles.paragraph}>We collect only what we need to run the product:</Text>
          <Text style={styles.bulletPoint}>• Account info: name, email, password (hashed).</Text>
          <Text style={styles.bulletPoint}>• Payment info: handled by Stripe. We do not store full card numbers.</Text>
          <Text style={styles.bulletPoint}>
            • Usage data: tool activity (e.g., generation counts, quotas, error logs) to enforce plan limits and improve reliability.
          </Text>
          <Text style={styles.bulletPoint}>• Support communications: messages you send us (e.g., email) and related metadata.</Text>
          <Text style={styles.paragraph}>
            No cookies or tracking scripts are used at this time. If we add them later, we'll update this policy.
          </Text>

          <Text style={styles.sectionTitle}>2) How We Use Information</Text>
          <Text style={styles.paragraph}>We use your information to:</Text>
          <Text style={styles.bulletPoint}>• Provide, maintain, and improve TunedUp.</Text>
          <Text style={styles.bulletPoint}>• Track and enforce quotas and plan features.</Text>
          <Text style={styles.bulletPoint}>• Process payments via Stripe.</Text>
          <Text style={styles.bulletPoint}>• Communicate important service updates and respond to support requests.</Text>
          <Text style={styles.bulletPoint}>
            • Marketing to registered users: we may send product updates, feature announcements, and promotions to people who created an account. You can opt out anytime.
          </Text>
          <Text style={styles.paragraph}>We do not sell your personal data.</Text>

          <Text style={styles.sectionTitle}>3) Third-Party Services (Processors)</Text>
          <Text style={styles.paragraph}>We rely on trusted vendors to deliver the service:</Text>
          <Text style={styles.bulletPoint}>• Stripe – payments.</Text>
          <Text style={styles.bulletPoint}>• Vercel (hosting) & Vercel Postgres – app hosting and database.</Text>
          <Text style={styles.bulletPoint}>• Model APIs (e.g., OpenAI, Google AI) – power certain features.</Text>
          <Text style={styles.bulletPoint}>• Email provider – to send account and support emails.</Text>
          <Text style={styles.paragraph}>
            Note: We used "Claude" (Anthropic) as a development tool while building the product. That does not
            mean your production data is shared with Claude. We do not transmit your account or usage data to
            Anthropic unless you explicitly share something with us via support and we use a tool to analyze that
            text.
          </Text>

          <Text style={styles.sectionTitle}>4) Your Choices & Rights</Text>
          <Text style={styles.bulletPoint}>• Access / Export: Request a copy of your data.</Text>
          <Text style={styles.bulletPoint}>
            • Delete: Request deletion of your account and associated personal data (subject to legal/transaction record requirements).
          </Text>
          <Text style={styles.bulletPoint}>
            • Email Preferences: Opt out of marketing emails at any time (links in emails or by contacting us).
          </Text>
          <Text style={styles.paragraph}>
            To make a request, email support@tunedup.com. We aim to respond within 30 days.
          </Text>

          <Text style={styles.sectionTitle}>5) California Privacy (CCPA)</Text>
          <Text style={styles.paragraph}>If you are a California resident, you may request:</Text>
          <Text style={styles.bulletPoint}>• Disclosure of categories of personal information we collect, use, or disclose.</Text>
          <Text style={styles.bulletPoint}>• Access to specific pieces of personal information we hold about you.</Text>
          <Text style={styles.bulletPoint}>• Deletion of personal information (subject to certain exceptions).</Text>
          <Text style={styles.paragraph}>
            We do not sell personal information. Submit requests via the contact info below.
          </Text>

          <Text style={styles.sectionTitle}>6) Data Security</Text>
          <Text style={styles.paragraph}>
            We use reasonable administrative, technical, and physical safeguards to protect your data. No method
            of transmission or storage is 100% secure, but we work to protect your information.
          </Text>

          <Text style={styles.sectionTitle}>7) Children's Privacy</Text>
          <Text style={styles.paragraph}>
            TunedUp is not intended for children under 13, and we do not knowingly collect data from children.
          </Text>

          <Text style={styles.sectionTitle}>8) Changes to This Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Policy from time to time. If we make material changes, we'll notify you via email or
            an in-app notice.
          </Text>

          <Text style={styles.sectionTitle}>9) Contact Us</Text>
          <Text style={styles.paragraph}>
            Questions or requests regarding this Privacy Policy? Contact us at: support@tunedup.com
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
  contactText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
});
