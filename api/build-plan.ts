import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkQuota, incrementUsage } from '../lib/quota.js';
import { setCorsHeaders } from '../lib/corsConfig.js';

// Types for the request body
interface VehicleSpec {
  year: string;
  make: string;
  model: string;
  trim: string;
  question: string;
}

interface BuildPlanRequest {
  vehicleSpec: VehicleSpec;
}

interface PartRecommendation {
  name: string;
  partPrice: number;
  diyShopCost: number;
  professionalShopCost: number;
  description: string;
}

interface BuildPlanResponse {
  stage: string;
  totalPartsCost: number;
  totalDIYCost: number;
  totalProfessionalCost: number;
  recommendations: PartRecommendation[];
  explanation: string;
  timeframe: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
  warnings: string[];
}

const createBuildPlanPrompt = (vehicleSpec: VehicleSpec): string => {
  const budget = vehicleSpec.question.match(/\$(\d+(?:,\d+)*)/)?.[1];
  const budgetAmount = budget ? parseInt(budget.replace(/,/g, '')) : 0;
  const isHighBudget = budgetAmount >= 10000;
  const isPowerFocused = vehicleSpec.question.toLowerCase().includes('power-focused') || vehicleSpec.question.toLowerCase().includes('maximum performance');

  return `
You are a professional automotive tuning consultant with extensive knowledge of high-performance modifications, costs, and installation complexity. You specialize in serious performance builds with proper supporting modifications.

CRITICAL REQUIREMENTS:
1. All prices must be realistic 2024 market prices
2. Include both parts cost AND labor cost estimates
3. Provide two labor cost tiers: DIY/Small Shop rates and Professional Shop rates
4. Account for regional variations but use average US pricing
5. Be specific about actual parts and brands, not generic categories
6. PRIORITIZE REAL PERFORMANCE PARTS over cosmetic or basic modifications

Vehicle: ${vehicleSpec.year} ${vehicleSpec.make} ${vehicleSpec.model} ${vehicleSpec.trim}
Customer Request: ${vehicleSpec.question}
${budgetAmount > 0 ? `Budget: $${budgetAmount.toLocaleString()}` : ''}

PERFORMANCE MODIFICATION PRIORITIES:
${isHighBudget || isPowerFocused ? `
HIGH-PERFORMANCE FOCUS (Budget $10k+):
- Forged internals (pistons, rods, crankshaft) for reliability under power
- Upgraded turbochargers/superchargers for serious power gains
- Built transmissions/differentials for power handling
- Advanced engine management (standalone ECUs, flex fuel, etc.)
- Performance cooling systems (upgraded radiators, oil coolers, intercoolers)
- High-flow fuel systems (pumps, injectors, lines)
- Reinforced engine mounts and transmission mounts
- Performance clutches and flywheels for manual transmissions
- Advanced suspension components (adjustable coilovers, sway bars, strut braces)
- Performance braking systems (big brake kits, race pads)
` : `
PERFORMANCE FOCUS (Lower Budget):
- Start with bolt-on power modifications (intake, exhaust, tune)
- Supporting modifications for reliability (cooling, fuel system basics)
- Foundation for future upgrades (quality coilovers, brake pads)
- Focus on parts that support higher power goals later
`}

AVOID THESE WASTEFUL MODIFICATIONS:
- Generic silicon hoses unless specifically needed for cooling system overhaul
- Aesthetic modifications that don't improve performance
- Cheap "universal" parts that don't fit the platform well
- Modifications that provide minimal power gains for the cost
- Short ram intakes on vehicles that benefit from cold air intakes

RESPONSE FORMAT - Return valid JSON only:
{
  "stage": "Descriptive build type based on customer request (e.g., 'Forged Build', 'Big Turbo Setup', 'Track Weapon', 'Built Motor')",
  "totalPartsCost": number,
  "totalDIYCost": number,
  "totalProfessionalCost": number,
  "recommendations": [
    {
      "name": "Specific part/modification with brand when possible",
      "partPrice": number,
      "diyShopCost": number,
      "professionalShopCost": number,
      "description": "What this does, expected power gains, and why it's essential for this build"
    }
  ],
  "explanation": "Detailed strategy explaining the performance philosophy, why these specific mods were chosen over alternatives, installation order for best results, expected power/performance gains, and how components work together for maximum effect",
  "timeframe": "Realistic timeframe considering complexity (e.g., '4-6 weeks for built motor', '2-3 months for complete build')",
  "difficulty": "Beginner|Intermediate|Advanced|Professional",
  "warnings": ["Supporting modifications required", "Potential reliability concerns", "Prerequisites", "Power handling limits"]
}

PRICING GUIDELINES:
- DIY Shop: $80-120/hour labor rates, basic facilities
- Professional Shop: $150-200/hour labor rates, specialized tools/expertise
- Use actual part prices from reputable suppliers (APR, Cobb, AMS, ETS, Garrett Motion, etc.)
- Include all supporting modifications and hardware needed
- Factor in machine work costs for internal engine modifications

ANALYSIS APPROACH:
- Identify the vehicle platform's power potential and weak points
- Recommend modifications that unlock serious performance gains
- Prioritize reliability and supporting mods for high-power applications
- Consider the customer's budget to maximize performance per dollar
- Focus on modifications that work synergistically for maximum effect
- Be honest about what's needed for reliable high performance

Analyze this specific vehicle platform and provide a build plan focused on REAL PERFORMANCE GAINS, not just bolt-on accessories.
`;
};

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
        error: 'Server configuration error: Gemini API key not configured' 
      });
    }

    // Parse and validate request body
    const { vehicleSpec } = req.body as BuildPlanRequest;
    
    if (!vehicleSpec) {
      return res.status(400).json({ 
        error: 'Missing required fields: vehicleSpec is required' 
      });
    }

    // Validate vehicleSpec structure
    if (!vehicleSpec.year || !vehicleSpec.make || !vehicleSpec.model) {
      return res.status(400).json({ 
        error: 'Invalid vehicleSpec: must include year, make, and model' 
      });
    }

    // Check quota (get email from header)
    const userEmail = req.headers['x-user-email'] as string || null;
    const quotaCheck = await checkQuota(userEmail, 'build');
    
    if (!quotaCheck.allowed) {
      return res.status(429).json({ 
        error: 'QUOTA_EXCEEDED',
        ...quotaCheck
      });
    }

    console.log('Processing build plan request for:', `${vehicleSpec.year} ${vehicleSpec.make} ${vehicleSpec.model}`);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = createBuildPlanPrompt(vehicleSpec);

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 3000,
        responseMimeType: "application/json"
      }
    });

    const content = result.response.text();
    if (!content) {
      throw new Error("Received an empty response from Gemini.");
    }
    
    const data = JSON.parse(content);
    
    // Validate the response structure
    if (!data.recommendations || !data.explanation || !data.stage) {
      throw new Error("Gemini response missing required fields.");
    }

    // Calculate totals if not provided
    if (!data.totalPartsCost) {
      data.totalPartsCost = data.recommendations.reduce((sum: number, rec: PartRecommendation) => sum + rec.partPrice, 0);
    }
    if (!data.totalDIYCost) {
      data.totalDIYCost = data.recommendations.reduce((sum: number, rec: PartRecommendation) => sum + rec.partPrice + rec.diyShopCost, 0);
    }
    if (!data.totalProfessionalCost) {
      data.totalProfessionalCost = data.recommendations.reduce((sum: number, rec: PartRecommendation) => sum + rec.partPrice + rec.professionalShopCost, 0);
    }
    
    console.log('Build plan completed successfully');
    
    // Increment usage after successful calculation
    await incrementUsage(userEmail, 'build');
    
    return res.status(200).json(data as BuildPlanResponse);

  } catch (error) {
    console.error('Build plan API error:', error);
    
    let errorMessage = 'Failed to generate build plan';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'Invalid Gemini API key configuration';
        statusCode = 401;
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'Gemini API quota exceeded. Please try again later.';
        statusCode = 429;
      } else if (error.message.includes('content') || error.message.includes('policy')) {
        errorMessage = 'Content violates policy. Please modify your request.';
        statusCode = 400;
      } else if (error instanceof SyntaxError) {
        errorMessage = 'Failed to parse Gemini response. The model may have returned an invalid format.';
        statusCode = 422;
      }
    }
    
    return res.status(statusCode).json({ error: errorMessage });
  }
}