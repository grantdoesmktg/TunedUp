// Background themes for profile customization
export type BackgroundTheme =
  | 'midnight'
  | 'carbon'
  | 'sunset'
  | 'ocean'
  | 'neon'
  | 'racing-red'
  | 'gunmetal'
  | 'purple-haze'
  | 'forest'
  | 'rose-gold'
  | 'electric-blue'
  | 'gold-rush';

export interface BackgroundConfig {
  id: BackgroundTheme;
  name: string;
  colors: string[];
  angle?: number;
  description: string;
}

export const BACKGROUND_THEMES: BackgroundConfig[] = [
  {
    id: 'midnight',
    name: 'Midnight Carbon',
    colors: ['#0a0a0a', '#1a1a2e', '#16213e'],
    angle: 135,
    description: 'Dark carbon fiber look'
  },
  {
    id: 'carbon',
    name: 'Carbon Fiber',
    colors: ['#2c2c2c', '#3a3a3a', '#2c2c2c', '#1a1a1a'],
    angle: 45,
    description: 'Classic carbon weave'
  },
  {
    id: 'racing-red',
    name: 'Racing Red',
    colors: ['#8B0000', '#DC143C', '#FF0000'],
    angle: 135,
    description: 'Ferrari-inspired red'
  },
  {
    id: 'sunset',
    name: 'Sunset Drive',
    colors: ['#FF512F', '#F09819', '#DD2476'],
    angle: 135,
    description: 'Warm sunset gradient'
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    colors: ['#0052D4', '#4364F7', '#6FB1FC'],
    angle: 135,
    description: 'Deep ocean blue'
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    colors: ['#B06AB3', '#4568DC', '#DD2476'],
    angle: 135,
    description: 'Electric neon glow'
  },
  {
    id: 'gunmetal',
    name: 'Gunmetal',
    colors: ['#434343', '#000000', '#2b2b2b'],
    angle: 180,
    description: 'Brushed metal finish'
  },
  {
    id: 'purple-haze',
    name: 'Purple Haze',
    colors: ['#360033', '#0b8793', '#4B0082'],
    angle: 135,
    description: 'Deep purple mystery'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    colors: ['#134E5E', '#71B280', '#0F2027'],
    angle: 135,
    description: 'Racing green heritage'
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    colors: ['#ED4264', '#FFEDBC', '#FFB6C1'],
    angle: 135,
    description: 'Luxury rose gold'
  },
  {
    id: 'electric-blue',
    name: 'Electric Blue',
    colors: ['#00d2ff', '#3a7bd5', '#00d2ff'],
    angle: 135,
    description: 'Vibrant electric blue'
  },
  {
    id: 'gold-rush',
    name: 'Gold Rush',
    colors: ['#DAA520', '#FFD700', '#FFA500'],
    angle: 135,
    description: 'Luxury gold shimmer'
  }
];

export const getBackgroundConfig = (theme: BackgroundTheme): BackgroundConfig => {
  return BACKGROUND_THEMES.find(t => t.id === theme) || BACKGROUND_THEMES[0];
};

// Parse combined gradient-texture string (e.g., "midnight-diamonds" or just "midnight")
export interface ParsedBackground {
  gradient: BackgroundTheme;
  texture: string; // TexturePattern, but avoid circular import
}

export function parseBackgroundTheme(themeString: string): ParsedBackground {
  // If it's a simple gradient (no texture specified)
  if (BACKGROUND_THEMES.find(t => t.id === themeString)) {
    return {
      gradient: themeString as BackgroundTheme,
      texture: 'none'
    };
  }

  // Try to find a matching texture pattern by checking known texture IDs
  const knownTextures = ['none', 'arrows', 'diamonds', 'plus', 'squares-lines', 'squares'];

  for (const textureId of knownTextures) {
    if (themeString.endsWith(`-${textureId}`)) {
      const gradient = themeString.substring(0, themeString.length - textureId.length - 1);
      return {
        gradient: gradient as BackgroundTheme,
        texture: textureId
      };
    }
  }

  // Fallback to default
  return {
    gradient: 'midnight',
    texture: 'none'
  };
}

// Combine gradient and texture into a single string for storage
export function combineBackgroundTheme(gradient: BackgroundTheme, texture: string): string {
  if (texture === 'none' || !texture) {
    return gradient;
  }
  return `${gradient}-${texture}`;
}
