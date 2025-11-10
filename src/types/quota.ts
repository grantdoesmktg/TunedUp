// NATIVE APP - Token system types and constants

export type PlanCode = 'ANONYMOUS' | 'FREE' | 'PLUS' | 'PRO' | 'ULTRA' | 'ADMIN';
export type ToolType = 'performance' | 'build' | 'image' | 'community';

// Token costs for each tool
export const TOKEN_COSTS: Record<ToolType, number> = {
  performance: 3,
  build: 2,
  image: 5,
  community: 0, // Free to encourage sharing
};

// Plan token allocations (monthly)
export const PLAN_TOKENS: Record<PlanCode, number> = {
  ANONYMOUS: 10,
  FREE: 30,
  PLUS: 100,
  PRO: 250,
  ULTRA: 500,
  ADMIN: Infinity,
};

export interface TokenStatus {
  allowed: boolean;
  tokens?: number;
  cost?: number;
  plan?: PlanCode;
  message?: string;
  error?: string;
}

export interface TokenInfo {
  planCode: PlanCode;
  tokens: number;
  communityUsed: number;
  resetDate: Date;
}

// Get tokens for a plan
export const getPlanTokens = (planCode: PlanCode): number => {
  return PLAN_TOKENS[planCode] || PLAN_TOKENS.FREE;
};

// Get cost for a tool
export const getToolCost = (toolType: ToolType): number => {
  return TOKEN_COSTS[toolType] || 0;
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
    performance: 'Performance Calculator',
    build: 'Build Planner',
    image: 'Image Generator',
    community: 'Community',
  };
  return names[toolType] || toolType;
};
