export interface CarSpec {
  year: string;
  make: string;
  model: string;
  color: string;
  wheelsColor: string;
  addModel: boolean;
  deBadged: boolean;
  chromeDelete: boolean;
  position: 'front' | 'quarter' | 'three-quarter' | 'back';
  details: string;
}

export interface LocationPreset {
  key: string;
  label: string;
  description: string;
}

export interface TimePreset {
  key: string;
  label: string;
  description: string;
  prompt?: string;
}

export interface StylePreset {
  key: string;
  label: string;
  description: string;
  prompt: string;
}

export interface PalettePreset {
  key: string;
  label: string;
  description: string;
}

export interface CameraOptions {
  angle: string;
  focalLength: number;
  motion: string;
}

export interface StyleOptions {
  realism: number;
  grain: number;
}

export interface OutputOptions {
  width: number;
  height: number;
  seed?: number;
}

export interface PromptSpec {
  car: CarSpec;
  scene: {
    locationKey?: string;
    timeKey?: string;
    styleKey?: string;
  };
  camera?: CameraOptions;
  style?: StyleOptions;
}

export interface GenerateRequest {
  promptSpec: PromptSpec;
  imageParams: OutputOptions;
}

export interface GeneratedImage {
  id: string;
  blob: string;
  timestamp: number;
  promptSpec: PromptSpec;
}

export interface Theme {
  primary: string;
  bg: string;
  text: string;
  radius: string;
}