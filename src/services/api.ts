// NATIVE APP - API Service with JWT authentication
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, AuthResponse } from '../types';
import { getDeviceFingerprint } from './fingerprint';

const API_BASE_URL = 'https://www.tunedup.dev';

// Token management
export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('auth_token');
};

export const setToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem('auth_token', token);
};

export const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem('auth_token');
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const fingerprint = await getDeviceFingerprint();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-fingerprint': fingerprint,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  // Send magic link email
  sendMagicLink: async (email: string): Promise<AuthResponse> => {
    return apiRequest('/api/auth?action=send-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify code and get JWT
  verifyCode: async (email: string, code: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/api/auth?action=verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });

    // Store token if login successful
    if (response.success && response.token) {
      await setToken(response.token);
    }

    return response;
  },

  // Get current user
  getMe: async (): Promise<{ user: User }> => {
    return apiRequest('/api/auth?action=me');
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiRequest('/api/auth?action=logout', {
      method: 'POST',
    });
    await removeToken();
  },
};

// Community API
export const communityAPI = {
  getImages: async (page: number = 1, limit: number = 40) => {
    return apiRequest(`/api/community?action=images&page=${page}&limit=${limit}`);
  },

  likeImage: async (imageId: string) => {
    return apiRequest('/api/community?action=like', {
      method: 'POST',
      body: JSON.stringify({ imageId }),
    });
  },
};

// Saved Cars API
export const carsAPI = {
  getSavedCars: async () => {
    return apiRequest('/api/saved-cars');
  },

  saveCar: async (carData: any) => {
    return apiRequest('/api/saved-cars', {
      method: 'POST',
      body: JSON.stringify(carData),
    });
  },
};

// Performance Calculator API
export const performanceAPI = {
  calculatePerformance: async (carInput: {
    make: string;
    model: string;
    year: string;
    trim: string;
    drivetrain: string;
    transmission: string;
    modifications: string;
    tireType: string;
    fuelType: string;
    launchTechnique: string;
  }) => {
    return apiRequest('/api/performance', {
      method: 'POST',
      body: JSON.stringify(carInput),
    });
  },
};

// Build Planner API
export const buildPlannerAPI = {
  generateBuildPlan: async (vehicleSpec: {
    year: string;
    make: string;
    model: string;
    trim: string;
    question: string;
  }) => {
    return apiRequest('/api/build-plan', {
      method: 'POST',
      body: JSON.stringify({ vehicleSpec }),
    });
  },
};

// Image Generator API
export const imageGeneratorAPI = {
  generateImage: async (promptSpec: any, imageParams: any, referenceImage?: string) => {
    return apiRequest('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ promptSpec, imageParams, referenceImage }),
    });
  },
};

// Profile API - Consolidated endpoint for quota, saved performance, and saved images
export const profileAPI = {
  // ========== QUOTA ACTIONS ==========

  // Get quota info for current user/device
  getQuotaInfo: async () => {
    return apiRequest('/api/profile?action=quota-info');
  },

  // Check if user can perform an action
  checkQuota: async (toolType: 'performance' | 'build' | 'image' | 'community') => {
    return apiRequest('/api/profile?action=quota-check', {
      method: 'POST',
      body: JSON.stringify({ toolType }),
    });
  },

  // ========== SAVED PERFORMANCE ACTIONS ==========

  // Get user's saved performance calculation (max 1)
  getSavedPerformance: async () => {
    return apiRequest('/api/profile?action=get-performance');
  },

  // Save a performance calculation (replaces existing if present)
  savePerformance: async (carInput: any, results: any) => {
    return apiRequest('/api/profile?action=save-performance', {
      method: 'POST',
      body: JSON.stringify({ carInput, results }),
    });
  },

  // Delete saved performance calculation
  deletePerformance: async (perfId: string) => {
    return apiRequest('/api/profile?action=delete-performance', {
      method: 'DELETE',
      body: JSON.stringify({ perfId }),
    });
  },

  // ========== SAVED IMAGES ACTIONS ==========

  // Get user's saved images (max 3)
  getSavedImages: async () => {
    return apiRequest('/api/profile?action=get-images');
  },

  // Save an image
  saveImage: async (imageUrl: string, carSpec: any, prompt: string) => {
    return apiRequest('/api/profile?action=save-image', {
      method: 'POST',
      body: JSON.stringify({ imageUrl, carSpec, prompt }),
    });
  },

  // Delete saved image
  deleteImage: async (imageId: string) => {
    return apiRequest('/api/profile?action=delete-image', {
      method: 'DELETE',
      body: JSON.stringify({ imageId }),
    });
  },

  // ========== COMBINED ACTIONS ==========

  // Get all profile data in one request (quota + saved performance + saved images)
  getAllProfileData: async () => {
    return apiRequest('/api/profile?action=get-all');
  },
};

// Legacy exports for backwards compatibility
export const quotaAPI = profileAPI;
export const savedPerformanceAPI = profileAPI;
export const savedImagesAPI = profileAPI;
