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

export interface BuildPlanRequest {
  vehicleSpec: VehicleSpec;
  stage: 'stage1' | 'stage2' | 'track_ready';
}