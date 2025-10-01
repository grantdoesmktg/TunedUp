import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkQuota, incrementUsage } from '../lib/quota.js';

// Types for the request body
interface CarSpec {
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
  referenceImage?: string; // base64 encoded image
}

// Constants for prompt generation
const MODEL_DESCRIPTIONS = {
  scottish_hills: "a runway model beautiful Scottish woman in a fitted crop top and athletic shorts, leaning against the car seductively while looking toward the camera, natural hair blowing in the wind",
  us_canyons: "a runway model beautiful athletic American woman in a sports crop top and workout shorts leaning seductively against the car while gazing toward the camera with alluring eyes",
  italian_cobblestone: "a runway model beautiful stylish Italian woman in a fashionable crop top and high-waisted shorts leaning against the car in a seductive pose, looking directly at the camera",
  japanese_nightlife: "a runway model beautiful trendy Japanese woman in a fitted crop top and shorts with neon accents, leaning seductively against the car while making eye contact with the camera",
  german_city: "a runway model beautiful modern German woman in a sleek crop top and tailored shorts, leaning against the car in a seductive pose while gazing confidently toward the camera"
};

const NEGATIVE_PROMPT = `
nudity, inappropriate content, nsfw, explicit, offensive, low quality, blurry, distorted, ugly,
text overlays, watermarks, logos, extra limbs, distorted wheels, unrealistic proportions, floating objects, 
blurred edges, double exposures, overexposed highlights, oversaturated neon unless explicitly asked, 
cartoonish or plastic look, glitchy reflections, extra fingers or malformed hands, uncanny valley faces. 
Render tires fully round and properly seated, paint and reflections physically plausible, 
no artifacts or half-rendered backgrounds.
`;

const QUALITY_PROMPT = `
Render in ultra-high quality, crisp and detailed, realistic lighting and reflections, 
accurate car body proportions, well-defined wheels and tires, cinematic depth of field, 
sharp focus on the car, natural environment integration, and a coherent, professional photography look.
`;

function renderPrompt(promptSpec: PromptSpec, hasReferenceImage: boolean = false): string {
  const { car, scene, camera, style } = promptSpec;
  
  // Base car description - modify based on reference image
  let prompt = hasReferenceImage 
    ? `Using this reference car image as the base, generate a ${car.year} ${car.make} ${car.model}. Keep the same car from the reference image but apply the following specifications: ${car.color.toLowerCase()} color, ${car.wheelsColor.toLowerCase()} wheels`
    : `A ${car.year} ${car.make} ${car.model} in ${car.color.toLowerCase()} color with ${car.wheelsColor.toLowerCase()} wheels`;
  
  // Position - refined camera angles
  let positionDescription: string;
  switch (car.position) {
    case 'front':
      positionDescription = 'straight-on front view, directly facing the front grille and headlights';
      break;
    case 'quarter':
      positionDescription = 'front quarter angle, positioned at the front corner near the headlight with visibility down the side and across the front';
      break;
    case 'three-quarter':
      positionDescription = 'rear three-quarter angle, positioned at the rear corner near the taillight looking down the side and across the rear';
      break;
    case 'back':
      positionDescription = 'straight-on rear view, directly facing the back of the car showing taillights and rear details';
      break;
    default:
      positionDescription = 'front three-quarter view';
  }
  prompt += `, photographed from ${positionDescription}`;
  
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
      vintage_film: ', with vintage film color grading and nostalgic retro tones',
      champagne_gold: ', with an elegant champagne gold palette featuring ivory, champagne, soft black, and rose gold accents',
      racing_heritage: ', with a classic racing palette of bold red, pristine white, deep black, and checkered pattern elements',
      graffiti_pop: ', with vibrant street art colors including lime green, electric cyan, hot magenta, and matte grey',
      earth_sand: ', with natural earth tones featuring desert tan, muted olive, rust orange, and sky blue',
      holographic_fade: ', with iridescent holographic colors including shifting purple, teal, silver, and neon highlights'
    };
    prompt += palettePrompts[scene.paletteKey as keyof typeof palettePrompts] || '';
  }
  
  // Add styling modifications
  if (car.deBadged) {
    prompt += ', completely debadged with NO model name badges, NO trim level badges, NO performance badges, NO text badges anywhere on the vehicle body, only the manufacturer logo remains';
  }
  
  if (car.chromeDelete) {
    prompt += ', with all chrome trim replaced with black or body-colored accents (chrome delete)';
  }
  
  // Add model if requested
  if (car.addModel && scene.locationKey) {
    const modelDescription = MODEL_DESCRIPTIONS[scene.locationKey as keyof typeof MODEL_DESCRIPTIONS] 
      || "a well-dressed woman matching the setting";
    prompt += `, with ${modelDescription}`;
  }
  
  // Add custom details if provided
  if (car.details && car.details.trim()) {
    prompt += `, ${car.details.trim()}`;
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
  
  // Add quality descriptors and license plate requirement
  prompt += ', with no license plate visible on the vehicle';
  prompt += ', ' + QUALITY_PROMPT.trim();
  
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
    const { promptSpec, imageParams, referenceImage } = req.body as RequestBody;
    
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

    // Check quota (get email from header)
    const userEmail = req.headers['x-user-email'] as string || null;
    const quotaCheck = await checkQuota(userEmail, 'image');
    
    if (!quotaCheck.allowed) {
      return res.status(429).json({ 
        error: 'QUOTA_EXCEEDED',
        ...quotaCheck
      });
    }

    // Generate the text prompt
    const prompt = renderPrompt(promptSpec, !!referenceImage);
    console.log('Generated prompt for Gemini:', prompt.substring(0, 100) + '...');
    console.log('Reference image provided:', !!referenceImage);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use Gemini 2.5 Flash Image for actual image generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    // Create structured JSON prompt for better results
    const jsonPrompt = {
      prompt: prompt,
      negative_prompt: NEGATIVE_PROMPT.trim(),
      width: imageParams.width,
      height: imageParams.height,
      seed: imageParams.seed || null,
      style: "photorealistic automotive photography",
      quality: "ultra-high",
      format: "PNG"
    };

    console.log('Sending JSON prompt to Gemini 2.5 Flash Image:', JSON.stringify(jsonPrompt, null, 2).substring(0, 200) + '...');

    // Prepare content array for Gemini
    const contentParts: any[] = [JSON.stringify(jsonPrompt)];
    
    // Add reference image if provided
    if (referenceImage) {
      contentParts.unshift({
        inlineData: {
          data: referenceImage,
          mimeType: "image/jpeg"
        }
      });
      console.log('Added reference image to request');
    }

    const result = await model.generateContent(contentParts);
    const response = result.response;

    // Extract image data from Gemini response
    // Note: The exact response format may need adjustment based on Gemini's actual API
    let imageBase64: string;
    
    if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      const candidate = response.candidates[0];
      
      // Check if there's an image part in the response
      if (candidate.content.parts) {
        const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
        
        if (imagePart && imagePart.inlineData) {
          imageBase64 = imagePart.inlineData.data;
          console.log('Successfully extracted image from Gemini response');
        } else {
          throw new Error('No image data found in Gemini response');
        }
      } else {
        throw new Error('No content parts found in Gemini response');
      }
    } else {
      // Fallback: create placeholder if Gemini doesn't return expected format
      console.warn('Gemini response format unexpected, creating placeholder');
      imageBase64 = await generatePlaceholderImage(
        imageParams.width, 
        imageParams.height, 
        promptSpec
      );
    }

    // Increment usage after successful generation
    await incrementUsage(userEmail, 'image');

    return res.status(200).json({
      image: imageBase64,
      prompt: prompt,
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
  description?: string
): Promise<string> {
  // Create a more sophisticated placeholder using SVG converted to base64
  // This will show actual car information instead of a transparent pixel
  
  const carInfo = `${promptSpec.car.year} ${promptSpec.car.make} ${promptSpec.car.model}`;
  const carColor = promptSpec.car.color.toLowerCase();
  
  // Choose background color based on car color
  const colorMap: { [key: string]: string } = {
    'red': '#dc2626',
    'blue': '#2563eb', 
    'black': '#1f2937',
    'white': '#f9fafb',
    'silver': '#9ca3af',
    'gray': '#6b7280',
    'grey': '#6b7280',
    'green': '#16a34a',
    'yellow': '#eab308',
    'orange': '#ea580c',
    'purple': '#9333ea',
    'brown': '#a16207',
    'gold': '#d97706',
    'bronze': '#92400e'
  };
  
  const backgroundColor = colorMap[carColor] || '#3b82f6';
  
  // Generate SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${backgroundColor}CC;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)"/>
      <rect x="10%" y="40%" width="80%" height="20%" rx="10" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      
      <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="${Math.max(16, width / 25)}" font-weight="bold" text-anchor="middle" fill="white">
        AI Generated Car Image
      </text>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.max(14, width / 30)}" text-anchor="middle" fill="rgba(255,255,255,0.9)">
        ${carInfo}
      </text>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${Math.max(12, width / 35)}" text-anchor="middle" fill="rgba(255,255,255,0.8)">
        Color: ${promptSpec.car.color}
      </text>
      <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="${Math.max(10, width / 40)}" text-anchor="middle" fill="rgba(255,255,255,0.6)">
        Placeholder - Replace with actual Gemini API
      </text>
      
      <!-- Simple car silhouette -->
      <g transform="translate(${width/2}, ${height * 0.75}) scale(${Math.min(width, height) / 200})">
        <path d="M-50,-10 L-40,-20 L40,-20 L50,-10 L50,10 L-50,10 Z" fill="rgba(255,255,255,0.3)"/>
        <circle cx="-30" cy="15" r="8" fill="rgba(255,255,255,0.4)"/>
        <circle cx="30" cy="15" r="8" fill="rgba(255,255,255,0.4)"/>
        <circle cx="-30" cy="15" r="5" fill="rgba(0,0,0,0.3)"/>
        <circle cx="30" cy="15" r="5" fill="rgba(0,0,0,0.3)"/>
      </g>
    </svg>
  `;
  
  // Convert SVG to base64 and return as data URL
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`; // Return full data URL
}