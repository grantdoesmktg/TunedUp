// Texture patterns for profile backgrounds
export type TexturePattern =
  | 'none'
  | 'arrows'
  | 'diamonds'
  | 'plus'
  | 'squares-lines'
  | 'squares';

export interface TextureConfig {
  id: TexturePattern;
  name: string;
  source: any; // require() result
  opacity: number; // 0-1, how visible the texture is
  description: string;
}

export const TEXTURE_PATTERNS: TextureConfig[] = [
  {
    id: 'none',
    name: 'No Pattern',
    source: null,
    opacity: 0,
    description: 'Solid gradient only'
  },
  {
    id: 'arrows',
    name: 'Arrows',
    source: require('../../assets/patterns/Arrows.png'),
    opacity: 0.55,
    description: 'Directional arrow pattern'
  },
  {
    id: 'diamonds',
    name: 'Diamonds',
    source: require('../../assets/patterns/Diamonds.png'),
    opacity: 0.55,
    description: 'Diamond plate texture'
  },
  {
    id: 'plus',
    name: 'Plus',
    source: require('../../assets/patterns/Plus Sign.png'),
    opacity: 0.65,
    description: 'Plus sign grid'
  },
  {
    id: 'squares-lines',
    name: 'Grid',
    source: require('../../assets/patterns/SquaresAndLines.png'),
    opacity: 0.7,
    description: 'Technical grid pattern'
  },
  {
    id: 'squares',
    name: 'Squares',
    source: require('../../assets/patterns/Squares.png'),
    opacity: 0.65,
    description: 'Square tile pattern'
  }
];

// Helper to get texture config by ID
export function getTextureConfig(id: TexturePattern): TextureConfig {
  const config = TEXTURE_PATTERNS.find(t => t.id === id);
  return config || TEXTURE_PATTERNS[0]; // Default to 'none'
}
