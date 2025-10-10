import { LocationPreset, TimePreset, StylePreset } from './types';

export const LOCATION_PRESETS: LocationPreset[] = [
  // 🇯🇵 Japan
  {
    key: 'tokyo_shibuya',
    label: '🇯🇵 Tokyo (Shibuya)',
    description: 'Neon city streets, bustling nightlife, drifting cars under glowing billboards'
  },
  {
    key: 'mount_fuji_hakone',
    label: '🇯🇵 Mount Fuji/Hakone',
    description: 'Mountain roads twisting around lush green slopes with Fuji in the background'
  },
  {
    key: 'osaka_bay',
    label: '🇯🇵 Osaka Bay',
    description: 'Industrial port city backdrop, bridges over water, gritty warehouses'
  },
  {
    key: 'kyoto_outskirts',
    label: '🇯🇵 Kyoto Outskirts',
    description: 'Ancient shrines, narrow streets, traditional lanterns contrasting with modern cars'
  },

  // 🇩🇪 Germany
  {
    key: 'munich_alps',
    label: '🇩🇪 Munich (Alps)',
    description: 'Sleek modern city blending into pristine alpine landscapes'
  },
  {
    key: 'stuttgart',
    label: '🇩🇪 Stuttgart',
    description: 'Headquarters of Porsche and Mercedes; polished industrial prestige'
  },
  {
    key: 'berlin',
    label: '🇩🇪 Berlin',
    description: 'Urban graffiti walls, underground techno vibe, gritty nightlife'
  },
  {
    key: 'nurburgring',
    label: '🇩🇪 Nürburgring',
    description: 'Legendary race track in the Eifel forest, misty mornings, roar of engines'
  },

  // 🇺🇸 United States
  {
    key: 'los_angeles',
    label: '🇺🇸 Los Angeles',
    description: 'Palm-lined streets, sunshine, Hollywood glitz, coastal highways'
  },
  {
    key: 'detroit',
    label: '🇺🇸 Detroit',
    description: 'Industrial grit, factory steel, muscle car roots'
  },
  {
    key: 'las_vegas_desert',
    label: '🇺🇸 Las Vegas Desert',
    description: 'Strip neon lights vs vast desert highways'
  },
  {
    key: 'miami',
    label: '🇺🇸 Miami',
    description: 'Tropical nightlife, pastel art deco, flashy oceanfront'
  },

  // 🇰🇷 South Korea
  {
    key: 'seoul_gangnam',
    label: '🇰🇷 Seoul (Gangnam)',
    description: 'Futuristic skyscrapers, neon-lit nightlife, K-pop modernity'
  },
  {
    key: 'busan',
    label: '🇰🇷 Busan',
    description: 'Coastal bridges, bustling port, mountain tunnels'
  },
  {
    key: 'incheon',
    label: '🇰🇷 Incheon',
    description: 'Futuristic airport hub, sprawling modern architecture'
  },
  {
    key: 'jeju_island',
    label: '🇰🇷 Jeju Island',
    description: 'Volcanic coastline, rolling hills, natural beauty'
  },

  // 🇮🇹 Italy
  {
    key: 'maranello',
    label: '🇮🇹 Maranello',
    description: 'Ferrari\'s red heartland, Italian countryside prestige'
  },
  {
    key: 'santagata_bolognese',
    label: '🇮🇹 Sant\'Agata Bolognese',
    description: 'Lamborghini home, rural-meets-luxury estates'
  },
  {
    key: 'modena',
    label: '🇮🇹 Modena',
    description: 'Maserati & Pagani origins, charming historic town squares'
  },
  {
    key: 'amalfi_coast',
    label: '🇮🇹 Amalfi Coast',
    description: 'Cliffside roads, Mediterranean sea breeze, pastel villages'
  }
];

export const TIME_PRESETS: TimePreset[] = [
  {
    key: 'dusk',
    label: 'Dusk',
    description: 'Golden hour with warm sunset lighting'
  },
  {
    key: 'dawn',
    label: 'Dawn',
    description: 'Early morning with soft pastel lighting'
  },
  {
    key: 'midnight',
    label: 'Midnight',
    description: 'Dark night with dramatic artificial lighting'
  },
  {
    key: 'midday',
    label: 'Midday',
    description: 'Bright daylight with clear shadows'
  }
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    key: 'borderlands',
    label: 'Borderlands',
    description: 'Cell-shaded comic with thick black outlines, gritty textures',
    prompt: 'cell-shaded, comic-book style, cel shading, gritty outlines, hand-drawn textures, Borderlands aesthetic, stylized lighting, inked shadows'
  },
  {
    key: 'photoreal',
    label: 'Photoreal',
    description: 'Cinematic real-world with true lighting and reflections',
    prompt: 'cinematic lighting, photorealistic, 8K detail, depth of field, dynamic reflections, HDR tone mapping, real-world environment'
  },
  {
    key: 'vaporwave',
    label: 'Vaporwave',
    description: '80s synthwave with neon grids and dreamy energy',
    prompt: 'vaporwave, retro futurism, synthwave aesthetic, neon grid, lens glow, retrowave lighting, cyberpunk horizon, 80s poster art'
  },
  {
    key: 'concept_art',
    label: 'Concept Sketch',
    description: 'Black and white pencil sketch with hand-drawn shading',
    prompt: 'black and white pencil sketch, concept art drawing, hand-drawn automotive design sketch, pencil shading, sketch lines, monochrome, technical drawing style, artist concept sketch'
  }
];

// Palette presets removed - colors are now integrated into location-specific scenes

export const CAR_YEARS = Array.from({ length: 30 }, (_, i) => (2024 - i).toString());

export const CAR_MAKES = [
  'Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Porsche',
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru',
  'Ford', 'Chevrolet', 'Dodge', 'Jeep', 'Cadillac',
  'Tesla', 'Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin'
];

export const CAR_COLORS = [
  'Red', 'Blue', 'Black', 'White', 'Silver', 'Gray', 'Green', 
  'Yellow', 'Orange', 'Purple', 'Brown', 'Gold', 'Bronze'
];

export const WHEEL_COLORS = [
  'Black', 'Silver', 'Chrome', 'Gold', 'Bronze', 'White', 
  'Gunmetal', 'Carbon Fiber', 'Red', 'Blue'
];

export const MODEL_DESCRIPTIONS = {
  scottish_hills: "a fashionable Scottish woman in modern casual wear, natural hair blowing in the wind",
  us_canyons: "an athletic American woman in denim and boots leaning casually on the car",
  italian_cobblestone: "a stylish Italian woman in chic streetwear walking past the car",
  japanese_nightlife: "a trendy Japanese woman in neon-accented fashion, street style, standing near the car",
  german_city: "a modern German woman in sleek minimalist clothing, confident pose beside the car"
};

export const DEFAULT_CAMERA = {
  angle: 'three-quarter front',
  focalLength: 85,
  motion: 'static'
};

export const DEFAULT_STYLE = {
  realism: 85,
  grain: 10
};

export const DEFAULT_OUTPUT = {
  width: 1024,
  height: 1024
};

export const NEGATIVE_PROMPT = "nudity, inappropriate content, nsfw, explicit, offensive, low quality, blurry, distorted, ugly";