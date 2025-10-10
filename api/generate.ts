import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkQuota, incrementUsage } from '../lib/quota.js';
import { setCorsHeaders } from '../lib/corsConfig.js';
import { logToolUsage } from '../lib/analytics.js';

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
    styleKey?: string;
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
  // Japan - Japanese models
  tokyo_shibuya: "a runway model beautiful Japanese woman in trendy streetwear with neon accents, leaning against the car in a stylish pose while making eye contact with the camera",
  mount_fuji_hakone: "a runway model beautiful Japanese woman in elegant casual wear, leaning against the car with serene confidence against the mountain backdrop",
  osaka_bay: "a runway model beautiful Japanese woman in urban street style, leaning against the car with edgy confidence in the industrial setting",
  kyoto_outskirts: "a runway model beautiful Japanese woman in modern yet respectful attire, leaning against the car gracefully near the traditional architecture",

  // Germany - German models
  munich_alps: "a runway model beautiful German woman in sleek athletic wear, leaning against the car with precise confidence showcasing German engineering pride",
  stuttgart: "a runway model beautiful German woman in sophisticated business casual, leaning against the car with disciplined elegance befitting automotive headquarters",
  berlin: "a runway model beautiful German woman in creative street fashion, leaning against the car with rebellious confidence among the urban art",
  nurburgring: "a runway model beautiful German woman in racing-inspired attire, leaning against the car with intense focus representing performance culture",

  // United States - American models
  los_angeles: "a runway model beautiful American woman in laid-back coastal style, leaning against the car with Hollywood glamour and West Coast charm",
  detroit: "a runway model beautiful American woman in classic denim and leather, leaning against the car with blue-collar pride and muscle car heritage",
  las_vegas_desert: "a runway model beautiful American woman in bold, flashy attire, leaning against the car with high-stakes confidence in the desert setting",
  miami: "a runway model beautiful American woman in vibrant tropical fashion, leaning against the car with energetic Miami style and coastal luxury",

  // South Korea - Korean models
  seoul_gangnam: "a runway model beautiful Korean woman in futuristic K-fashion, leaning against the car with modern sophistication and trendy confidence",
  busan: "a runway model beautiful Korean woman in coastal casual wear, leaning against the car with energetic freedom by the seaside setting",
  incheon: "a runway model beautiful Korean woman in clean, minimalist style, leaning against the car with efficient confidence in the modern airport hub",
  jeju_island: "a runway model beautiful Korean woman in natural, relaxed attire, leaning against the car with adventurous spirit on the volcanic island",

  // Italy - Italian models
  maranello: "a runway model beautiful Italian woman in passionate red tones, leaning against the car with Ferrari pride and elegant countryside sophistication",
  santagata_bolognese: "a runway model beautiful Italian woman in bold, luxurious fashion, leaning against the car with dramatic confidence in Lamborghini territory",
  modena: "a runway model beautiful Italian woman in artistic, refined style, leaning against the car with cultured elegance representing Italian craftsmanship",
  amalfi_coast: "a runway model beautiful Italian woman in romantic coastal fashion, leaning against the car with Mediterranean charm and coastal luxury"
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
      // Japan
      tokyo_shibuya: ', in Tokyo\'s neon-lit Shibuya district with bustling nightlife, JDM street racers, and glowing billboards. The scene features neon pink, electric blue, and purple lighting with cool black asphalt showing wet reflections. The atmosphere is fast-paced, edgy, youthful, and slightly rebellious with tuned imports and late-night car meets',
      mount_fuji_hakone: ', on mountain roads twisting around lush green slopes with Mount Fuji\'s snow-capped peak in the background. Natural greens, crisp whites, misty grays, and sky blue dominate the scene. The atmosphere is serene yet adrenaline-fueled with lightweight sports cars perfect for touge drifting and carving mountain corners',
      osaka_bay: ', with an industrial port city backdrop featuring bridges over water and gritty warehouses. Steel gray, muted blue, and sunset orange glows create a rough, underground, hardworking atmosphere with urban grit perfect for street car gatherings and drag racing on industrial roads',
      kyoto_outskirts: ', near ancient shrines with narrow streets and traditional lanterns creating harmony between tradition and modernity. Deep reds, gold, and earth tones contrast with cool black asphalt. The elegant, thoughtful atmosphere is perfect for respectful automotive showcases and culture-rich photo opportunities',

      // Germany
      munich_alps: ', in sleek modern Munich where BMW headquarters meets pristine alpine landscapes. Crisp white, alpine green, silver, and deep blue create a clean, precise atmosphere of engineered perfection, perfect for Autobahn performance and mountain drives showcasing BMW pride',
      stuttgart: ', at the prestigious headquarters of Porsche and Mercedes with polished industrial architecture. Metallic silvers, glassy blues, matte black, and industrial grays create a luxurious, disciplined atmosphere celebrating serious German engineering and European performance pedigree',
      berlin: ', against urban graffiti walls with underground techno vibes and gritty nightlife. Multicolored graffiti, concrete gray, and neon pops create a rebellious, creative, counterculture atmosphere perfect for street modifications and creative automotive customizations',
      nurburgring: ', at the legendary race track in the Eifel forest with misty mornings and the roar of engines. Dark green forest, asphalt gray, and racing red and white curbs create an intense, legendary atmosphere that\'s the mecca for performance tuning and automotive testing',

      // United States
      los_angeles: ', on palm-lined streets with sunshine and Hollywood glitz along coastal highways. Golden sun, ocean blue, and pastel pink/orange skies create a laid-back but stylish atmosphere perfect for lowriders, imports, West Coast car meets, and movie magic glamour',
      detroit: ', in an industrial setting with factory steel showcasing muscle car roots and heritage. Rust red, brick brown, and industrial gray create a tough, resilient, blue-collar atmosphere celebrating classic American muscle, drag strips, and factory-born automotive heritage',
      las_vegas_desert: ', contrasting Strip neon lights against vast desert highways. Neon pink/purple, golden desert beige, and midnight blue create a high-stakes, over-the-top atmosphere perfect for exotic cars, drag racing, and daring desert endurance runs',
      miami: ', with tropical nightlife and pastel art deco architecture along the flashy oceanfront. Aqua teal, hot pink, pastel yellow, and coral create a flashy, energetic, luxurious party-ready atmosphere perfect for supercars, flashy modifications, and coastal cruising',

      // South Korea
      seoul_gangnam: ', surrounded by futuristic skyscrapers in Seoul\'s Gangnam district with neon-lit nightlife and K-pop modernity. Neon cyan, magenta, chrome silver, and black glass create a high-tech, trendy, ultra-modern atmosphere perfect for luxury sedans, EVs, and futuristic modification culture',
      busan: ', with coastal bridges and bustling port atmosphere against mountain tunnels. Ocean blue, steel gray, and golden sunlight create a lively, energetic coastal freedom atmosphere perfect for street racing through tunnels and scenic coastal drives',
      incheon: ', at the futuristic airport hub with sprawling modern architecture. White steel, glass blue, and soft lighting create a clean, efficient, international atmosphere perfect for EV dominance and futuristic automotive testing grounds',
      jeju_island: ', on volcanic coastline with rolling hills and natural beauty. Lava black, ocean turquoise, and green fields create an adventurous, scenic, escapist atmosphere perfect for road trips, off-road adventures, and relaxed-pace touring',

      // Italy
      maranello: ', in Ferrari\'s red heartland with Italian countryside prestige and racing heritage. Ferrari red, warm terracotta, and Tuscan gold create a passionate, proud, elegant atmosphere celebrating Ferrari legacy, test roads, and automotive heritage museums',
      santagata_bolognese: ', at Lamborghini\'s home where rural landscapes meet luxury estates. Lamborghini yellow, lush green fields, and rustic stone create a bold, extravagant, dramatic atmosphere with supercars roaring against the quiet countryside backdrop',
      modena: ', at the origins of Maserati and Pagani with charming historic town squares. Deep blues, warm brick red, and gold accents create a refined, artistic, historic atmosphere celebrating artisan craftsmanship and exotic boutique supercars',
      amalfi_coast: ', on cliffside roads with Mediterranean sea breeze and pastel villages. Turquoise sea, pastel yellows/pinks, and sunset gold create a romantic, adventurous, luxurious atmosphere perfect for coastal drives in convertibles and Italian classics'
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

  // Style presets
  if (scene.styleKey) {
    const stylePrompts = {
      borderlands: ', cell-shaded, comic-book style, cel shading, gritty outlines, hand-drawn textures, Borderlands aesthetic, stylized lighting, inked shadows',
      photoreal: ', cinematic lighting, photorealistic, 8K detail, depth of field, dynamic reflections, HDR tone mapping, real-world environment',
      vaporwave: ', vaporwave, retro futurism, synthwave aesthetic, neon grid, lens glow, retrowave lighting, cyberpunk horizon, 80s poster art',
      concept_art: ', concept art, matte painting, epic lighting, cinematic composition, volumetric light rays, ultra-wide shot, dynamic perspective'
    };
    prompt += stylePrompts[scene.styleKey as keyof typeof stylePrompts] || '';
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
  // Enable CORS with restrictions
  setCorsHeaders(req, res);

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

    // Log analytics
    const fingerprint = req.headers['x-fingerprint'] as string || null;
    await logToolUsage('image', userEmail, fingerprint, true);

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

    // Log failed analytics
    const userEmail = req.headers['x-user-email'] as string || null;
    const fingerprint = req.headers['x-fingerprint'] as string || null;
    await logToolUsage('image', userEmail, fingerprint, false, errorMessage);
    
    return res.status(statusCode).json({ error: errorMessage });
  }
}

async function generatePlaceholderImage(
  width: number,
  height: number,
  promptSpec: PromptSpec
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