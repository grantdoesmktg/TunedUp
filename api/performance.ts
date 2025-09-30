import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkQuota, incrementUsage } from '../lib/quota.js';

// Types for the request body
interface CarInput {
  make: string;
  model: string;
  year: string;
  trim: string;
  drivetrain: string;
  transmission: string;
  modifications: string;
  tireType: string;
  fuelType: string;
  launchTechnique: string;
}

interface AIResponse {
  stockPerformance: {
    horsepower: number;
    whp: number;
    zeroToSixty: number;
  };
  estimatedPerformance: {
    horsepower: number;
    whp: number;
    zeroToSixty: number;
  };
  explanation: string;
  confidence: 'Low' | 'Medium' | 'High';
  sources: string[];
}

const createPrompts = (carInput: CarInput): { systemPrompt: string, userPrompt: string } => {
  const { make, model, year, trim, drivetrain, transmission, modifications, tireType, fuelType, launchTechnique } = carInput;
  
  const systemPrompt = `
    You are a professional automotive engineer and performance analyst. Research factory specifications and estimate realistic performance gains from modifications.

    Return your response as a single, valid JSON object:
    {
      "stockPerformance": { "horsepower": number, "whp": number, "zeroToSixty": number },
      "estimatedPerformance": { "horsepower": number, "whp": number, "zeroToSixty": number },
      "explanation": "string (Formatted explanation with bullet points)",
      "confidence": "Low" | "Medium" | "High"
    }
  `;

  const userPrompt = `
    Analyze the performance of this vehicle with the specified modifications:

    **Vehicle**: ${year} ${make} ${model}${trim ? ` ${trim}` : ''}
    **Drivetrain**: ${drivetrain === 'Not Specified' ? 'Research factory options' : drivetrain}
    **Transmission**: ${transmission === 'Not Specified' ? 'Research available options' : transmission}
    **Modifications**: ${modifications || 'Stock'}
    **Tire Type**: ${tireType === 'Not Specified' ? 'Performance tires' : tireType}
    **Fuel**: ${fuelType === 'Not Specified' ? 'Premium if turbocharged' : fuelType}
    **Launch**: ${launchTechnique === 'Not Specified' ? 'Optimal launch' : launchTechnique}

    **Analysis Requirements**:
    1. Research factory specifications (weight, horsepower, 0-60 time)
    2. Estimate optimistic but realistic power gains from each modification
    3. Calculate wheel horsepower based on drivetrain losses
    4. Estimate 0-60 time improvement based on power-to-weight ratio changes
    5. Apply tuning gains as a percentage multiplier AFTER calculating all other modifications

    **Modification Guidelines** (be optimistic within realistic bounds):
    • **Cold Air Intake**: 5-15hp naturally aspirated, 10-25hp forced induction
    • **Exhaust System**: 8-25hp naturally aspirated, 15-35hp forced induction
    • **ECU Tune/Chip**: 10-25% power increase AFTER other mods (multiplicative effect)
    • **Turbo/Supercharger**: 40-80% base power increase
    • **Internal Engine Mods**: 15-40% power increase depending on extent
    • **Nitrous**: 25-150hp depending on shot size
    • **Multiple Mods**: Apply 5-15% synergy bonus for comprehensive builds

    **Tuning Multiplier Effect**:
    When ECU tuning is mentioned, calculate base modifications first, then apply tuning as a 15-25% multiplier on top. Tuning optimizes all modifications together and unlocks additional performance.

    **Explanation Format** (use bullet points):
    • **Vehicle Specs**: Factory weight, horsepower, and 0-60 time
    • **Power Gains**: Breakdown of each modification's contribution
    • **Tuning Effect**: How ECU tuning multiplies the gains (if applicable)
    • **Final Numbers**: Total crank HP, wheel HP, estimated 0-60 time
    • **Methodology**: Brief explanation of calculations and assumptions

    **Guidelines**:
    - Be optimistic but realistic with modification gains - users want to see meaningful improvements
    - Account for synergies between modifications and comprehensive builds
    - ECU tuning should provide significant additional gains beyond bolt-on parts
    - Use proper formatting with bullet points (•) and sub-points (-)
    - No \\n\\n characters - use clean line breaks
  `;
  
  return { systemPrompt, userPrompt };
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
    const carInput = req.body as CarInput;
    
    if (!carInput || !carInput.make || !carInput.model || !carInput.year) {
      return res.status(400).json({ 
        error: 'Missing required fields: make, model, and year are required' 
      });
    }

    // Check quota (get email from header)
    const userEmail = req.headers['x-user-email'] as string || null;
    const quotaCheck = await checkQuota(userEmail, 'performance');
    
    if (!quotaCheck.allowed) {
      return res.status(429).json({ 
        error: 'QUOTA_EXCEEDED',
        ...quotaCheck
      });
    }

    console.log('Processing performance request for:', `${carInput.year} ${carInput.make} ${carInput.model}`);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const { systemPrompt, userPrompt } = createPrompts(carInput);
    
    // Combine system and user prompts for Gemini
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: fullPrompt }]
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
    if (!data.stockPerformance || !data.estimatedPerformance || !data.explanation || !data.confidence) {
      throw new Error("Gemini response missing required fields.");
    }
    
    console.log('Performance calculation completed successfully');
    
    // Increment usage after successful calculation
    await incrementUsage(userEmail, 'performance');
    
    // Add sources array for consistency with client expectations
    const aiResponse: AIResponse = { ...data, sources: [] };
    
    return res.status(200).json(aiResponse);

  } catch (error) {
    console.error('Performance API error:', error);
    
    let errorMessage = 'Failed to calculate performance';
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