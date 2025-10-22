// NATIVE APP - Type definitions
export interface User {
  id: string;
  email: string;
  planCode: string;
  planRenewsAt?: Date;
  extraCredits: Record<string, any>;
  perfUsed: number;
  buildUsed: number;
  imageUsed: number;
  communityUsed: number;
  resetDate: Date;
  createdAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  error?: string;
}

export interface CommunityImage {
  id: string;
  imageUrl: string;
  description?: string;
  likesCount: number;
  createdAt: string;
  userId: string;
  userName?: string;
  userNickname?: string;
  profileIcon?: string;
  userEmail: string;
  planCode: string;
}

export interface PublicProfile {
  id: string;
  name?: string;
  nickname?: string;
  displayName: string;
  location?: string;
  instagramHandle?: string;
  profileIcon: string;
  bannerImageUrl?: string;
  planCode: string;
  memberSince: string;
}

export interface PublicProfileResponse {
  user: PublicProfile;
  images: Array<{
    id: string;
    imageUrl: string;
    description?: string;
    likesCount: number;
    createdAt: string;
  }>;
  stats: {
    totalImages: number;
    totalLikes: number;
  };
}

export interface SavedCar {
  id: string;
  name: string;
  make: string;
  model: string;
  year: string;
  trim?: string;
  imageUrl?: string;
  performanceData?: any;
  buildPlanData?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarInput {
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
}

export interface PerformanceData {
  horsepower: number;
  whp: number;
  zeroToSixty: number;
}

export interface AIResponse {
  stockPerformance: PerformanceData;
  estimatedPerformance: PerformanceData;
  explanation: string;
  confidence: 'Low' | 'Medium' | 'High';
  sources: string[];
}

// Build Planner Types
export interface VehicleSpec {
  year: string;
  make: string;
  model: string;
  trim: string;
  question: string;
}

export interface PartRecommendation {
  name: string;
  partPrice: number;
  diyShopCost: number;
  professionalShopCost: number;
  description: string;
}

export interface BuildPlanResponse {
  stage: string;
  totalPartsCost: number;
  totalDIYCost: number;
  totalProfessionalCost: number;
  recommendations: PartRecommendation[];
  explanation: string;
  timeframe: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  warnings: string[];
}

// Image Generator Types
export interface CarSpec {
  year: string;
  make: string;
  model: string;
  color: string;
  wheelsColor: string;
  addModel: boolean;
  deBadged: boolean;
  chromeDelete: boolean;
  darkTint: boolean;
  position: 'front' | 'quarter' | 'three-quarter' | 'back';
  details: string;
}

export interface ImageGeneratorResponse {
  image: string; // base64 image data
  prompt: string;
  timestamp: number;
}

// Saved Performance Calculation and Image Types
export interface SavedPerformanceCalc {
  id: string;
  userId: string;
  carInput: CarInput;
  results: AIResponse;
  createdAt: string;
}

export interface SavedImage {
  id: string;
  userId: string;
  imageUrl: string;
  carSpec: CarSpec;
  prompt: string;
  createdAt: string;
}
