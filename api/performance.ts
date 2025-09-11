import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

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
    You are a professional automotive engineer and performance analyst with access to comprehensive automotive databases and technical specifications. You MUST provide EXACT, PRECISE data - no approximations, estimates, or "about" values are acceptable.

    CRITICAL REQUIREMENTS:
    1. You MUST find the EXACT factory specifications including precise weight, horsepower, and 0-60 times
    2. You MUST be aggressive and realistic about modification power gains - many builds produce significant power
    3. You MUST justify every number with specific technical reasoning
    4. You MUST provide precise weights to the exact pound, not ranges or approximations
    5. NEVER underestimate power gains from well-planned modification lists

    You MUST return your response as a single, valid JSON object. Do not include any text, code block formatting, or explanations outside of the JSON object itself.
    
    Required JSON Output Schema:
    {
      "stockPerformance": { "horsepower": number, "whp": number, "zeroToSixty": number },
      "estimatedPerformance": { "horsepower": number, "whp": number, "zeroToSixty": number },
      "explanation": "string (Detailed explanation covering your entire process, including exact specifications found, specific power gains per modification, and technical justification for all numbers)",
      "confidence": "'Low' | 'Medium' | 'High'"
    }
  `;

  const userPrompt = `
    MANDATORY ANALYSIS PROTOCOL - NO SHORTCUTS ALLOWED

    **PHASE 1: EXACT FACTORY SPECIFICATION RESEARCH**
    You MUST find and state the EXACT factory specifications for this SPECIFIC vehicle configuration:
    - EXACT curb weight in pounds (not "approximately" or "around" - the precise manufacturer specification)
    - EXACT factory CRANK horsepower and torque ratings (NOT wheel horsepower)
    - EXACT factory 0-60 mph time from manufacturer or verified automotive publications
    - EXACT engine displacement, configuration, and boost levels (if applicable)
    
    CRITICAL: If user specifies a trim level, you MUST use that EXACT trim - do NOT substitute or assume different trims.
    Research the specifications for the user-specified trim only.

    **PHASE 2: AGGRESSIVE MODIFICATION POWER ANALYSIS** 
    For EACH modification listed, you MUST:
    1. Calculate the specific horsepower gain for that modification on this engine platform
    2. Research known power gains from dyno results and real-world examples
    3. Account for synergistic effects when multiple mods work together
    4. NEVER be conservative - if a modification is known to produce substantial gains, reflect that accurately
    5. Consider supporting modifications (fuel, ignition, etc.) and their enabling effects

    CRITICAL CALCULATION ORDER:
    1. Start with stock horsepower
    2. Add ALL hardware modifications first (intake, exhaust, turbo, internals, etc.)
    3. Apply ECU tune percentage to the MODIFIED horsepower total (not stock)
    
    MODIFICATION GAIN GUIDELINES (be aggressive but realistic):
    - Cold air intake: 5-15hp baseline, more with tune
    - Downpipe: 15-35hp on turbocharged engines
    - Full exhaust systems: 10-25hp naturally aspirated, 15-40hp turbocharged
    - Turbo upgrades: 50-150+ horsepower depending on size and supporting modifications
    - Internal engine modifications: Calculate based on compression ratio, displacement, and flow improvements
    - ECU tune: Apply 15-30% gain to the TOTAL after all other mods (turbocharged), 5-15% (naturally aspirated)

    **PHASE 3: CORRECT CALCULATION METHODOLOGY**
    
    CRITICAL CALCULATION RULES - FOLLOW EXACTLY:
    
    1. **CRANK HORSEPOWER CALCULATION:**
       - Start with stock CRANK horsepower
       - Add modification gains to get new CRANK horsepower
       - Formula: Stock Crank HP + Total Modification Gains = New Crank HP
    
    2. **WHEEL HORSEPOWER CALCULATION:**
       - Calculate wheel horsepower based on crank horsepower and drivetrain type
    
    3. **POWER-TO-WEIGHT RATIO:**
       - Use CRANK horsepower (not wheel horsepower)
       - Formula: Vehicle Weight ÷ Crank Horsepower = lbs/hp
       - Result should be 6-15 lbs/hp for most cars (NOT 1.11 or other impossible values!)
    
    4. **0-60 TIME CALCULATION - MANDATORY DETAILED ANALYSIS:**
       - Calculate EXACT power-to-weight ratio (Weight ÷ Crank HP)
       - Use established power-to-weight formulas for baseline 0-60 estimate
       - Research and compare against 3+ real vehicles with similar power-to-weight ratios
       - Apply specific corrections for:
         * Drivetrain type (AWD launches faster than RWD/FWD)
         * Transmission type (manual vs automatic vs DCT)
         * Tire compound and grip levels
         * Launch control systems
       - The 0-60 time MUST change significantly based on power increases
       - Stock vs modified 0-60 times should show substantial improvement (typically 0.5-2.0+ seconds faster)

    **PHASE 4: TECHNICAL VALIDATION**
    Your explanation MUST include:
    - The exact weight specification and where it comes from
    - Confirmation that you used the EXACT trim specified by the user
    - Step-by-step calculation showing: Stock HP + Hardware Mods + (Tune % × Modified HP) = Final Crank HP
    - Calculation showing how wheel HP was derived from crank HP
    - Power-to-weight calculation: Weight ÷ Crank HP = lbs/hp (must be >1, typically 6-15)
    - Detailed 0-60 time analysis showing:
      * Stock power-to-weight ratio and corresponding 0-60 estimate
      * Modified power-to-weight ratio and corresponding 0-60 estimate
      * Specific vehicle comparisons with similar ratios
      * Corrections applied for drivetrain, transmission, tires, launch technique
    - Detailed breakdown of each modification's power gain with technical justification
    - Specific comparisons to documented dyno results or similar builds

    **TARGET VEHICLE SPECIFICATIONS:**
    - Make: ${make}
    - Model: ${model}  
    - Year: ${year}
    - Trim: ${trim || 'Research most common/performance trim'}
    - Drivetrain: ${drivetrain === 'Not Specified' ? 'Research factory drivetrain options' : drivetrain}
    - Transmission: ${transmission === 'Not Specified' ? 'Research available transmissions' : transmission}
    - Modifications: ${modifications}
    - Tire Type: ${tireType === 'Not Specified' ? 'Assume performance tires' : tireType}
    - Fuel Type: ${fuelType === 'Not Specified' ? 'Assume premium fuel if turbocharged' : fuelType}
    - Launch Technique: ${launchTechnique === 'Not Specified' ? 'Assume optimal launch' : launchTechnique}

    **MANDATORY ERROR CHECKS - VERIFY BEFORE RESPONDING:**
    1. Power-to-weight ratio MUST be >1 (typically 6-15 lbs/hp for cars)
    2. Wheel HP MUST be less than Crank HP (due to drivetrain loss)
    3. You MUST use the exact trim specified by user - DO NOT SUBSTITUTE
    4. Show your math: Stock HP + Mod gains = Total Crank HP
    5. Calculate wheel HP appropriately based on drivetrain type
    6. DO NOT copy formula examples - calculate with ACTUAL numbers for THIS car
    7. Every calculation must use the real horsepower YOU calculated, not example numbers
    8. 0-60 times MUST be different between stock and modified versions
    9. Modified 0-60 time MUST be faster (lower number) than stock 0-60 time
    10. Significant power increases (50+ hp) should result in 0.5+ second improvements in 0-60
    
    CRITICAL: DO NOT use any example numbers in your calculations. Use only the actual specifications and modifications for this specific vehicle.
    
    WORK HARD. RESEARCH THOROUGHLY. PROVIDE EXACT DATA. NO APPROXIMATIONS.
    DOUBLE-CHECK ALL CALCULATIONS BEFORE SUBMITTING.
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
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return res.status(500).json({ 
        error: 'Server configuration error: OpenAI API key not configured' 
      });
    }

    // Parse and validate request body
    const carInput = req.body as CarInput;
    
    if (!carInput || !carInput.make || !carInput.model || !carInput.year) {
      return res.status(400).json({ 
        error: 'Missing required fields: make, model, and year are required' 
      });
    }

    console.log('Processing performance request for:', `${carInput.year} ${carInput.make} ${carInput.model}`);

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const { systemPrompt, userPrompt } = createPrompts(carInput);
    
    // Try o3-mini first, fallback to gpt-4o if not available
    let response: any;
    try {
      response = await openai.chat.completions.create({
        model: "o3-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "perf_schema",
            strict: true,
            schema: {
              type: "object",
              required: ["stockPerformance", "estimatedPerformance", "explanation", "confidence"],
              properties: {
                stockPerformance: {
                  type: "object",
                  required: ["horsepower", "whp", "zeroToSixty"],
                  properties: {
                    horsepower: { type: "number" },
                    whp: { type: "number" },
                    zeroToSixty: { type: "number" }
                  },
                  additionalProperties: false
                },
                estimatedPerformance: {
                  type: "object", 
                  required: ["horsepower", "whp", "zeroToSixty"],
                  properties: {
                    horsepower: { type: "number" },
                    whp: { type: "number" },
                    zeroToSixty: { type: "number" }
                  },
                  additionalProperties: false
                },
                explanation: { type: "string" },
                confidence: { 
                  type: "string", 
                  enum: ["Low", "Medium", "High"] 
                }
              },
              additionalProperties: false
            }
          }
        },
        tools: [{
          type: "function",
          function: {
            name: "fetch_exact_specs",
            description: "Research and return exact factory specifications for a specific vehicle configuration. Use this to get precise weight, horsepower, and performance data.",
            parameters: {
              type: "object",
              properties: {
                year: { type: "integer" },
                make: { type: "string" },
                model: { type: "string" },
                trim: { type: "string" }
              },
              required: ["year", "make", "model", "trim"],
              additionalProperties: false
            },
            strict: true
          }
        }]
      });
    } catch (o3Error) {
      console.log("o3-mini not available, falling back to gpt-4o:", o3Error);
      // Fallback to gpt-4o with structured schema
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "perf_schema",
            strict: true,
            schema: {
              type: "object",
              required: ["stockPerformance", "estimatedPerformance", "explanation", "confidence"],
              properties: {
                stockPerformance: {
                  type: "object",
                  required: ["horsepower", "whp", "zeroToSixty"],
                  properties: {
                    horsepower: { type: "number" },
                    whp: { type: "number" },
                    zeroToSixty: { type: "number" }
                  },
                  additionalProperties: false
                },
                estimatedPerformance: {
                  type: "object", 
                  required: ["horsepower", "whp", "zeroToSixty"],
                  properties: {
                    horsepower: { type: "number" },
                    whp: { type: "number" },
                    zeroToSixty: { type: "number" }
                  },
                  additionalProperties: false
                },
                explanation: { type: "string" },
                confidence: { 
                  type: "string", 
                  enum: ["Low", "Medium", "High"] 
                }
              },
              additionalProperties: false
            }
          }
        }
      });
    }

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Received an empty response from OpenAI.");
    }
    
    const data = JSON.parse(content);
    
    // Validate the response structure
    if (!data.stockPerformance || !data.estimatedPerformance || !data.explanation || !data.confidence) {
      throw new Error("OpenAI response missing required fields.");
    }
    
    console.log('Performance calculation completed successfully');
    
    // OpenAI doesn't provide sources like Gemini, so we'll return an empty array
    const aiResponse: AIResponse = { ...data, sources: [] };
    
    return res.status(200).json(aiResponse);

  } catch (error) {
    console.error('Performance API error:', error);
    
    let errorMessage = 'Failed to calculate performance';
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
      } else if (error instanceof SyntaxError) {
        errorMessage = 'Failed to parse AI response. The model may have returned an invalid format.';
        statusCode = 422;
      }
    }
    
    return res.status(statusCode).json({ error: errorMessage });
  }
}