// NATIVE APP - Quota types and constants

export type PlanCode = 'ANONYMOUS' | 'FREE' | 'PLUS' | 'PRO' | 'ULTRA' | 'ADMIN';
export type ToolType = 'performance' | 'build' | 'image' | 'community';

export interface PlanLimits {
  perf: number;
  build: number;
  image: number;
  community: number;
}

export interface QuotaStatus {
  allowed: boolean;
  plan?: PlanCode;
  used?: number;
  limit?: number;
  message?: string;
  error?: string;
}

export interface QuotaInfo {
  planCode: PlanCode;
  perfUsed: number;
  perfLimit: number;
  buildUsed: number;
  buildLimit: number;
  imageUsed: number;
  imageLimit: number;
  communityUsed: number;
  communityLimit: number;
  resetDate: Date;
}

// Plan limits matching backend
export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  ANONYMOUS: { perf: 1, build: 1, image: 3, community: 0 },
  FREE: { perf: 3, build: 3, image: 5, community: 5 },
  PLUS: { perf: 10, build: 10, image: 25, community: 10 },
  PRO: { perf: 15, build: 15, image: 60, community: 20 },
  ULTRA: { perf: 25, build: 25, image: 100, community: 30 },
  ADMIN: { perf: Infinity, build: Infinity, image: Infinity, community: Infinity },
};

// Get limits for a plan
export const getPlanLimits = (planCode: PlanCode): PlanLimits => {
  return PLAN_LIMITS[planCode] || PLAN_LIMITS.FREE;
};

// Get friendly plan name
export const getPlanName = (planCode: PlanCode): string => {
  const names: Record<PlanCode, string> = {
    ANONYMOUS: 'Anonymous',
    FREE: 'Free',
    PLUS: 'Plus',
    PRO: 'Pro',
    ULTRA: 'Ultra',
    ADMIN: 'Admin',
  };
  return names[planCode] || 'Free';
};

// Get tool display name
export const getToolName = (toolType: ToolType): string => {
  const names: Record<ToolType, string> = {
    performance: 'Performance',
    build: 'Build Planner',
    image: 'Image Generator',
    community: 'Community',
  };
  return names[toolType] || toolType;
};
