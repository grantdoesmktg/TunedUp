import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FINGERPRINT_KEY = '@device_fingerprint';

/**
 * Generates a device fingerprint for anonymous user tracking
 * Uses a combination of device identifiers to create a unique fingerprint
 */
export const getDeviceFingerprint = async (): Promise<string> => {
  try {
    // Check if we already have a stored fingerprint
    const storedFingerprint = await AsyncStorage.getItem(FINGERPRINT_KEY);
    if (storedFingerprint) {
      return storedFingerprint;
    }

    // Generate new fingerprint from device identifiers
    const components: string[] = [];

    // Get application ID (bundle identifier)
    const appId = Application.applicationId;
    if (appId) components.push(appId);

    // Get device name
    const deviceName = Application.applicationName;
    if (deviceName) components.push(deviceName);

    // Get iOS vendor ID (IDFV) - unique per app vendor
    if (Platform.OS === 'ios') {
      const iosId = await Application.getIosIdForVendorAsync();
      if (iosId) components.push(iosId);
    }

    // Get install time as additional entropy
    const installTime = await Application.getInstallationTimeAsync();
    if (installTime) components.push(installTime.getTime().toString());

    // Combine all components and hash
    const fingerprintString = components.join('|');

    // Simple hash function (for production, consider using crypto)
    const fingerprint = await simpleHash(fingerprintString);

    // Store for future use
    await AsyncStorage.setItem(FINGERPRINT_KEY, fingerprint);

    return fingerprint;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);

    // Fallback: generate random fingerprint and store it
    const fallbackFingerprint = `fallback_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await AsyncStorage.setItem(FINGERPRINT_KEY, fallbackFingerprint);
    return fallbackFingerprint;
  }
};

/**
 * Simple hash function for generating consistent fingerprint
 * For production, consider using expo-crypto or similar
 */
const simpleHash = async (str: string): Promise<string> => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Clears stored fingerprint (useful for testing)
 */
export const clearDeviceFingerprint = async (): Promise<void> => {
  await AsyncStorage.removeItem(FINGERPRINT_KEY);
};
