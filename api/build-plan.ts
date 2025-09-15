import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  return `
You are a professional automotive tuning consultant with extensive knowledge of modification costs, installation complexity, and performance gains. You must provide a comprehensive build plan with accurate cost estimates.

CRITICAL REQUIREMENTS:
1. All prices must be realistic 2024 market prices
2. Include both parts cost AND labor cost estimates  
3. Provide two labor cost tiers: DIY/Small Shop rates and Professional Shop rates
4. Account for regional variations but use average US pricing
5. Be specific about actual parts, not generic categories

Vehicle: ${vehicleSpec.year} ${vehicleSpec.make} ${vehicleSpec.model} ${vehicleSpec.trim}
Customer Request: ${vehicleSpec.question}

RESPONSE FORMAT - Return valid JSON only:
{
  "stage": "Descriptive build type based on customer request (e.g., 'Budget Build', 'Stage 1 Performance', 'Track Prep')",
  "totalPartsCost": number,
  "totalDIYCost": number, 
  "totalProfessionalCost": number,
  "recommendations": [
    {
      "name": "Specific part/modification name",
      "partPrice": number,
      "diyShopCost": number,
      "professionalShopCost": number, 
      "description": "What this does and why it's recommended"
    }
  ],
  "explanation": "Detailed strategy explanation covering why these mods are chosen, installation order, expected gains, and how they work together",
  "timeframe": "Realistic timeframe (e.g., '2-4 weeks', '1-2 months')",
  "difficulty": "Beginner|Intermediate|Advanced|Professional",
  "warnings": ["Important considerations", "Potential issues", "Prerequisites"]
}

PRICING GUIDELINES:
- DIY Shop: $80-120/hour labor rates, basic facilities
- Professional Shop: $150-200/hour labor rates, specialized tools/expertise
- Research actual part prices from major suppliers (APR, Cobb, Injen, etc.)
- Include supporting modifications needed (gaskets, fluids, misc hardware)

ANALYSIS APPROACH:
- Parse customer request for budget, goals, and experience level
- Recommend appropriate modifications based on their specific needs
- Consider budget constraints and prioritize modifications
- Factor in vehicle platform capabilities and common issues
- Suggest realistic timelines and difficulty levels

Analyze this specific vehicle platform and customer request to provide realistic, actionable recommendations.
`;
};

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