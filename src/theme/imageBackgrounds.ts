// Image-based backgrounds organized by category
export type BackgroundCategory = 'adventure' | 'artistic' | 'minimal' | 'urban' | 'peaceful';

export interface ImageBackground {
  id: string;
  name: string;
  category: BackgroundCategory;
  source: any; // require() import
  description: string;
}

// Background images organized by category
export const imageBackgrounds: ImageBackground[] = [
  // ADVENTURE - Mountain Highways
  {
    id: 'mountain-highway-1',
    name: 'Mountain Pass',
    category: 'adventure',
    source: require('../../assets/backgrounds/mountain-highway-1.jpg'),
    description: 'Winding mountain highway',
  },
  {
    id: 'mountain-highway-2',
    name: 'Alpine Drive',
    category: 'adventure',
    source: require('../../assets/backgrounds/mountain-highway-2.jpg'),
    description: 'Scenic alpine road',
  },
  {
    id: 'mountain-highway-3',
    name: 'Peak Journey',
    category: 'adventure',
    source: require('../../assets/backgrounds/mountain-highway-3.jpg'),
    description: 'Mountain peak vista',
  },

  // ARTISTIC - Pour Painting
  {
    id: 'pour-painting-1',
    name: 'Abstract Flow',
    category: 'artistic',
    source: require('../../assets/backgrounds/pour-painting-1.jpg'),
    description: 'Fluid art expression',
  },
  {
    id: 'pour-painting-2',
    name: 'Color Waves',
    category: 'artistic',
    source: require('../../assets/backgrounds/pour-painting-2.jpg'),
    description: 'Vibrant color waves',
  },
  {
    id: 'pour-painting-3',
    name: 'Liquid Motion',
    category: 'artistic',
    source: require('../../assets/backgrounds/pour-painting-3.jpg'),
    description: 'Dynamic liquid art',
  },

  // MINIMAL - Neutral
  {
    id: 'neutral-1',
    name: 'Clean Slate',
    category: 'minimal',
    source: require('../../assets/backgrounds/neutral-1.jpg'),
    description: 'Simple and clean',
  },
  {
    id: 'neutral-2',
    name: 'Subtle Tone',
    category: 'minimal',
    source: require('../../assets/backgrounds/neutral-2.jpg'),
    description: 'Understated elegance',
  },
  {
    id: 'neutral-3',
    name: 'Pure Focus',
    category: 'minimal',
    source: require('../../assets/backgrounds/neutral-3.jpg'),
    description: 'Minimalist aesthetic',
  },

  // URBAN - Graffiti
  {
    id: 'graffiti-1',
    name: 'Street Art',
    category: 'urban',
    source: require('../../assets/backgrounds/graffiti-1.jpg'),
    description: 'Urban street culture',
  },
  {
    id: 'graffiti-2',
    name: 'City Canvas',
    category: 'urban',
    source: require('../../assets/backgrounds/graffiti-2.jpg'),
    description: 'Vibrant city walls',
  },
  {
    id: 'graffiti-3',
    name: 'Urban Expression',
    category: 'urban',
    source: require('../../assets/backgrounds/graffiti-3.jpg'),
    description: 'Bold street style',
  },

  // PEACEFUL - Zen
  {
    id: 'zen-1',
    name: 'Tranquil Space',
    category: 'peaceful',
    source: require('../../assets/backgrounds/zen-1.jpg'),
    description: 'Calm and centered',
  },
  {
    id: 'zen-2',
    name: 'Serene Balance',
    category: 'peaceful',
    source: require('../../assets/backgrounds/zen-2.jpg'),
    description: 'Peaceful harmony',
  },
  {
    id: 'zen-3',
    name: 'Quiet Reflection',
    category: 'peaceful',
    source: require('../../assets/backgrounds/zen-3.jpg'),
    description: 'Meditative calm',
  },
];

// Category metadata for UI organization
export interface CategoryInfo {
  id: BackgroundCategory;
  displayName: string;
  emoji: string;
  description: string;
}

export const categoryInfo: Record<BackgroundCategory, CategoryInfo> = {
  adventure: {
    id: 'adventure',
    displayName: 'Adventure',
    emoji: '🏔️',
    description: 'Mountain highways and scenic drives',
  },
  artistic: {
    id: 'artistic',
    displayName: 'Artistic',
    emoji: '🎨',
    description: 'Vibrant pour painting art',
  },
  minimal: {
    id: 'minimal',
    displayName: 'Minimal',
    emoji: '⚪',
    description: 'Clean and neutral tones',
  },
  urban: {
    id: 'urban',
    displayName: 'Urban',
    emoji: '🏙️',
    description: 'Street art and graffiti',
  },
  peaceful: {
    id: 'peaceful',
    displayName: 'Peaceful',
    emoji: '🧘',
    description: 'Zen and tranquil vibes',
  },
};

// Helper functions
export function getBackgroundById(id: string): ImageBackground | undefined {
  return imageBackgrounds.find(bg => bg.id === id);
}

export function getBackgroundsByCategory(category: BackgroundCategory): ImageBackground[] {
  return imageBackgrounds.filter(bg => bg.category === category);
}

export function getAllCategories(): CategoryInfo[] {
  return Object.values(categoryInfo);
}

// Default background
export const DEFAULT_BACKGROUND_ID = 'neutral-1';
