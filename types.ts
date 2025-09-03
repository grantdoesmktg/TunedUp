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

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  }
}

export interface AIResponse {
  stockPerformance: PerformanceData;
  estimatedPerformance: PerformanceData;
  explanation: string;
  confidence: 'Low' | 'Medium' | 'High';
  sources?: GroundingChunk[];
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  location?: string;
  profilePictureUrl?: string;
  bannerPictureUrl?: string;
  bio?: string;
  garageStatus?: string;
}

export interface Build {
  id: string;
  carInput: CarInput;
  aiResponse: AIResponse;
}

export type View = 'form' | 'loading' | 'results' | 'profile';