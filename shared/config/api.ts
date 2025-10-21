import { Capacitor } from '@capacitor/core';

// API base URL configuration
export const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'https://www.tunedup.dev'  // Production URL for native apps
  : '';  // Relative paths for web (same domain)

// Helper to build full API URLs
export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
