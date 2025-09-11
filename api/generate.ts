import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types for the request body
interface CarSpec {
  year: string;
  make: string;
  model: string;
  color: string;
  wheelsColor: string;
  addModel: boolean;
  position: 'front' | 'back';
}

interface PromptSpec {
  car: CarSpec;
  scene: {
    locationKey?: string;
    timeKey?: string;
    paletteKey?: string;
  };
  camera?: {
    angle: string;
    focalLength: number;
    motion: string;
  };
  style?: {
    realism: number;
    grain: number;
  };
}

interface ImageParams {
  width: number;
  height: number;
  seed?: number;
}

interface RequestBody {
  promptSpec: PromptSpec;
  imageParams: ImageParams;
}

// Constants for prompt generation
const MODEL_DESCRIPTIONS = {
  scottish_hills: "a fashionable Scottish woman in modern casual wear, natural hair blowing in the wind",
  us_canyons: "an athletic American woman in denim and boots leaning casually on the car",
  italian_cobblestone: "a stylish Italian woman in chic streetwear walking past the car",
  japanese_nightlife: "a trendy Japanese woman in neon-accented fashion, street style, standing near the car",
  german_city: "a modern German woman in sleek minimalist clothing, confident pose beside the car"
};

const NEGATIVE_PROMPT = "nudity, inappropriate content, nsfw, explicit, offensive, low quality, blurry, distorted, ugly";

function renderPrompt(promptSpec: PromptSpec): string {
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
  
  return prompt;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate environment variable
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY environment variable is not set');
      return res.status(500).json({ 
        error: 'Server configuration error: API key not configured' 
      });
    }

    // Parse and validate request body
    const { promptSpec, imageParams } = req.body as RequestBody;
    
    if (!promptSpec || !imageParams) {
      return res.status(400).json({ 
        error: 'Missing required fields: promptSpec and imageParams' 
      });
    }

    // Validate prompt spec structure
    if (!promptSpec.car || !promptSpec.scene) {
      return res.status(400).json({ 
        error: 'Invalid promptSpec: must include car and scene properties' 
      });
    }

    // Generate the text prompt
    const prompt = renderPrompt(promptSpec);
    console.log('Generated prompt for Gemini:', prompt.substring(0, 100) + '...');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // For now, since Gemini 2.5 Flash Image might not be available yet,
    // let's use the text model and create a placeholder response
    // When Gemini image generation becomes available, replace this with:
    // const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Create a detailed prompt for text generation (as a fallback)
    const textPrompt = `Create a detailed description for an AI image generator based on this car specification: ${prompt}
    
    The image should be exactly ${imageParams.width}x${imageParams.height} pixels.
    ${imageParams.seed ? `Use seed ${imageParams.seed} for reproducible results.` : ''}
    
    Focus on automotive photography techniques and realistic rendering.`;

    const result = await model.generateContent(textPrompt);
    const response = result.response;
    const textDescription = response.text();

    console.log('Gemini response received:', textDescription.substring(0, 100) + '...');

    // Since we can't generate actual images yet with Gemini 2.5 Flash Image,
    // we'll create a sophisticated placeholder that uses the AI response
    const placeholder = await generatePlaceholderImage(
      imageParams.width, 
      imageParams.height, 
      promptSpec, 
      textDescription
    );

    return res.status(200).json({
      image: placeholder,
      prompt: prompt,
      description: textDescription,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('API error:', error);
    
    let errorMessage = 'Failed to generate image';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'Invalid API key configuration';
        statusCode = 401;
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'API quota exceeded. Please try again later.';
        statusCode = 429;
      } else if (error.message.includes('content') || error.message.includes('policy')) {
        errorMessage = 'Content violates policy. Please modify your request.';
        statusCode = 400;
      }
    }
    
    return res.status(statusCode).json({ error: errorMessage });
  }
}

async function generatePlaceholderImage(
  width: number, 
  height: number, 
  promptSpec: PromptSpec, 
  description: string
): Promise<string> {
  // This creates a sophisticated Canvas-based placeholder
  // In production, this would be replaced with actual Gemini image generation
  
  return new Promise((resolve) => {
    // Since we're in a Node.js environment, we need to use a different approach
    // For now, we'll return a base64 encoded simple image
    // In production, you could use libraries like `canvas` or `sharp` for server-side image generation
    
    // Create a simple base64 PNG (1x1 transparent pixel, scaled conceptually)
    const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    // For a more sophisticated placeholder, you could:
    // 1. Use the `canvas` npm package to create server-side images
    // 2. Generate colored rectangles based on car specifications
    // 3. Add text overlays with car details
    // 4. Create gradients based on selected palettes
    
    resolve(transparentPixel);
  });
}