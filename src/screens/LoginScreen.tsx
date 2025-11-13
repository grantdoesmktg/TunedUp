// NATIVE APP - Login screen (email input)
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image, ImageBackground, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { sendMagicLink } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    const result = await sendMagicLink(email.toLowerCase().trim());
    setLoading(false);

    if (result.success) {
      navigation.navigate('VerifyCode', { email: email.toLowerCase().trim() });
    } else {
      setError(result.message);
    }
  };

  const features = [
    {
      icon: '🚗',
      title: 'Save Your Builds',
      description: 'Store performance calculations and build plans for all your cars',
    },
    {
      icon: '🎨',
      title: 'AI Image Generation',
      description: 'Create stunning AI-generated images of your dream cars',
    },
    {
      icon: '👤',
      title: 'Profile Customization',
      description: 'Personalize your profile with custom icons, banners, and themes',
    },
    {
      icon: '❤️',
      title: 'Community Features',
      description: 'Post to the community feed, like images, and connect with car enthusiasts',
    },
    {
      icon: '⚡',
      title: 'Increased Credits',
      description: 'Unlock more monthly credits for performance calcs, builds, and images',
    },
    {
      icon: '🎯',
      title: 'Track Your Progress',
      description: 'See your usage stats and manage your automotive journey',
    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80' }}
        style={styles.backgroundImage}
        blurRadius={3}
      >
        <LinearGradient
          colors={['rgba(18, 18, 18, 0.85)', 'rgba(18, 18, 18, 0.95)', colors.background]}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Image
                  source={require('../../assets/logo-horizontal.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.heroTitle}>Unlock Your Full Experience</Text>
                <Text style={styles.heroSubtitle}>
                  Sign in to save your builds, customize your profile, and join our community of car enthusiasts
                </Text>
              </View>

              {/* Sign In Form */}
              <View style={styles.formContainer}>
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Ready to Get Started?</Text>
                  <Text style={styles.formSubtitle}>Enter your email to receive a verification code</Text>
                  <Text style={styles.spamFolderNote}>💡 Check your spam folder if you don't see the code</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    editable={!loading}
                  />

                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSendCode}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.background} />
                    ) : (
                      <Text style={styles.buttonText}>Sign In with Email</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.backButtonText}>← Continue as Guest</Text>
                  </TouchableOpacity>

                  {/* Legal Footer */}
                  <View style={styles.legalFooter}>
                    <Text style={styles.legalText}>By signing in, you agree to our</Text>
                    <View style={styles.legalLinks}>
                      <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
                        <Text style={styles.legalLink}>Terms of Service</Text>
                      </TouchableOpacity>
                      <Text style={styles.legalText}> and </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                        <Text style={styles.legalLink}>Privacy Policy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Features Grid */}
              <View style={styles.featuresContainer}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureCard}>
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 60,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'rgba(31, 31, 31, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  formContainer: {
    marginTop: 20,
  },
  formCard: {
    backgroundColor: 'rgba(31, 31, 31, 0.9)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  spamFolderNote: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  legalFooter: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  legalLink: {
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
