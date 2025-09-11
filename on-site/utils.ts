import { PromptSpec } from './types';
import { MODEL_DESCRIPTIONS, NEGATIVE_PROMPT } from './constants';

export function renderPrompt(promptSpec: PromptSpec): string {
  const { car, scene, camera, style } = promptSpec;
  
  // Base car description
  let prompt = `A ${car.year} ${car.make} ${car.model} in ${car.color.toLowerCase()} color with ${car.wheelsColor.toLowerCase()} wheels`;
  
  // Position
  const position = car.position === 'front' ? 'front three-quarter view' : 'rear three-quarter view';
  prompt += `, photographed from ${position}`;
  
  // Location
  if (scene.locationKey) {
    const locationPrompts = {
      scottish_hills: ', set against rolling green Scottish highlands with ancient stone castles visible in the misty distance',
      us_canyons: ', positioned in dramatic American canyon landscape with red rock formations and desert terrain',
      italian_cobblestone: ', parked on historic Italian cobblestone streets with Renaissance architecture and warm Mediterranean lighting',
      japanese_nightlife: ', on a neon-lit Japanese city street with modern skyscrapers and vibrant urban nightlife in the background',
      german_city: ', in a clean modern German city setting with efficient architecture and contemporary urban design'
    };
    prompt += locationPrompts[scene.locationKey as keyof typeof locationPrompts] || '';
  }
  
  // Time of day
  if (scene.timeKey) {
    const timePrompts = {
      dusk: ', during golden hour with warm sunset lighting casting long shadows',
      dawn: ', at dawn with soft pastel morning light and gentle atmospheric glow',
      midnight: ', at midnight with dramatic artificial lighting and moody nighttime atmosphere',
      midday: ', in bright midday sunlight with clear shadows and vibrant colors'
    };
    prompt += timePrompts[scene.timeKey as keyof typeof timePrompts] || '';
  }
  
  // Color palette
  if (scene.paletteKey) {
    const palettePrompts = {
      cool_teal: ', with a cool color palette dominated by teals, blues, and cyan tones',
      warm_sunset: ', with warm sunset colors featuring oranges, reds, and golden tones',
      monochrome_slate: ', in monochrome with black, white, and subtle gray tones',
      neo_tokyo: ', with cyberpunk neon colors including electric blues, pinks, and purple highlights',
      vintage_film: ', with vintage film color grading and nostalgic retro tones'
    };
    prompt += palettePrompts[scene.paletteKey as keyof typeof palettePrompts] || '';
  }
  
  // Add model if requested
  if (car.addModel && scene.locationKey) {
    const modelDescription = MODEL_DESCRIPTIONS[scene.locationKey as keyof typeof MODEL_DESCRIPTIONS] 
      || "a well-dressed woman matching the setting";
    prompt += `, with ${modelDescription}`;
  }
  
  // Camera settings
  if (camera) {
    prompt += `, shot with ${camera.focalLength}mm focal length`;
    if (camera.angle !== 'three-quarter front') {
      prompt += ` from ${camera.angle} angle`;
    }
    if (camera.motion !== 'static') {
      prompt += ` with ${camera.motion} motion`;
    }
  }
  
  // Style settings
  if (style) {
    if (style.realism < 80) {
      prompt += ', with artistic stylized rendering';
    } else {
      prompt += ', with photorealistic rendering';
    }
    
    if (style.grain > 20) {
      prompt += ', with visible film grain texture';
    }
  }
  
  // Add quality descriptors
  prompt += ', high quality, detailed, professional automotive photography, 4K resolution';
  
  // Add negative prompt
  prompt += `\n\nNegative prompt: ${NEGATIVE_PROMPT}`;
  
  return prompt;
}

export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function downloadImage(blob: string, filename: string): void {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${blob}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseThemeFromUrl(): { primary: string; bg: string; text: string; radius: string } | null {
  const params = new URLSearchParams(window.location.search);
  const primary = params.get('primary');
  const bg = params.get('bg');
  const text = params.get('text');
  const radius = params.get('radius');
  
  if (primary || bg || text || radius) {
    return {
      primary: primary || '#3b82f6',
      bg: bg || '#ffffff',
      text: text || '#1f2937',
      radius: radius || '8px'
    };
  }
  
  return null;
}

export function applyTheme(theme: { primary: string; bg: string; text: string; radius: string }): void {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-bg', theme.bg);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--border-radius', theme.radius);
}

export function postResizeMessage(): void {
  if (window.parent !== window) {
    const height = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    window.parent.postMessage({ type: 'TU_RESIZE', height }, '*');
  }
}