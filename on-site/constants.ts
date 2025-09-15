import { LocationPreset, TimePreset, PalettePreset } from './types';

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    key: 'scottish_hills',
    label: 'Scottish Hills',
    description: 'Rolling green hills with ancient castles in the misty distance'
  },
  {
    key: 'us_canyons',
    label: 'US Canyons',
    description: 'Dramatic red rock formations and desert landscapes'
  },
  {
    key: 'italian_cobblestone',
    label: 'Italian Cobblestone',
    description: 'Historic cobblestone streets with renaissance architecture'
  },
  {
    key: 'japanese_nightlife',
    label: 'Japanese Nightlife',
    description: 'Neon-lit urban streets with modern skyscrapers'
  },
  {
    key: 'german_city',
    label: 'German City',
    description: 'Clean modern architecture with efficient urban design'
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

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    key: 'cool_teal',
    label: 'Cool Teal',
    description: 'Calming blues and teals with cool undertones'
  },
  {
    key: 'warm_sunset',
    label: 'Warm Sunset',
    description: 'Orange and red tones with warm golden light'
  },
  {
    key: 'monochrome_slate',
    label: 'Monochrome Slate',
    description: 'Black and white with subtle gray gradients'
  },
  {
    key: 'neo_tokyo',
    label: 'Neo-Tokyo',
    description: 'Cyberpunk neon colors with electric highlights'
  },
  {
    key: 'vintage_film',
    label: 'Vintage Film',
    description: 'Retro color grading with film grain aesthetic'
  },
  {
    key: 'champagne_gold',
    label: 'Champagne Gold',
    description: 'Ivory, champagne, soft black, rose gold trim'
  },
  {
    key: 'racing_heritage',
    label: 'Racing Heritage',
    description: 'Bold primary red, white, black, checkered accents'
  },
  {
    key: 'graffiti_pop',
    label: 'Graffiti Pop',
    description: 'Lime green, cyan, magenta, matte grey'
  },
  {
    key: 'earth_sand',
    label: 'Earth & Sand',
    description: 'Desert tan, muted olive, rust orange, sky blue'
  },
  {
    key: 'holographic_fade',
    label: 'Holographic Fade',
    description: 'Shifting gradients of purple, teal, silver, neon'
  }
];

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