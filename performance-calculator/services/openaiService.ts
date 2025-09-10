import OpenAI from 'openai';
import type { CarInput, AIResponse } from '../types';

// Use VITE_ prefixed environment variable for client-side access
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

let openai: OpenAI | null = null;
if (apiKey) {
  openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });
} else {
  console.warn("VITE_OPENAI_API_KEY environment variable is not set. The application will not be able to connect to the OpenAI API.");
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
    You MUST find and state the EXACT factory specifications for this specific vehicle configuration:
    - EXACT curb weight in pounds (not "approximately" or "around" - the precise manufacturer specification)
    - EXACT factory horsepower and torque ratings
    - EXACT factory 0-60 mph time from manufacturer or verified automotive publications
    - EXACT engine displacement, configuration, and boost levels (if applicable)
    
    If trim level affects specifications, you MUST identify the correct engine/drivetrain combination and provide those exact specs.

    **PHASE 2: AGGRESSIVE MODIFICATION POWER ANALYSIS** 
    For EACH modification listed, you MUST:
    1. Calculate the specific horsepower gain for that modification on this engine platform
    2. Research known power gains from dyno results and real-world examples
    3. Account for synergistic effects when multiple mods work together
    4. NEVER be conservative - if a modification is known to produce substantial gains, reflect that accurately
    5. Consider supporting modifications (fuel, ignition, etc.) and their enabling effects

    MODIFICATION GAIN GUIDELINES (be aggressive but realistic):
    - Cold air intake: 5-15hp baseline, more with tune
    - Downpipe: 15-35hp on turbocharged engines
    - Full exhaust systems: 10-25hp naturally aspirated, 15-40hp turbocharged
    - ECU tune: 15-30% power increase on turbocharged engines, 5-15% on naturally aspirated
    - Turbo upgrades: 50-150+ horsepower depending on size and supporting modifications
    - Internal engine modifications: Calculate based on compression ratio, displacement, and flow improvements

    **PHASE 3: PRECISE 0-60 CALCULATION**
    1. Calculate EXACT power-to-weight ratio using precise weight and new horsepower
    2. Use advanced formulas considering drivetrain type, transmission, tires, and launch technique
    3. Compare against documented real-world times from similar power-to-weight vehicles
    4. Apply specific corrections for:
       - AWD vs RWD vs FWD launch characteristics
       - Tire compound and size effects on grip
       - Launch control and technique factors
       - Fuel octane and knock resistance effects

    **PHASE 4: TECHNICAL VALIDATION**
    Your explanation MUST include:
    - The exact weight specification and where it comes from
    - Detailed breakdown of power gains per modification with technical justification
    - Specific comparisons to documented dyno results or similar builds
    - Mathematical validation of 0-60 time using power-to-weight formulas

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

    WORK HARD. RESEARCH THOROUGHLY. PROVIDE EXACT DATA. NO APPROXIMATIONS.
  `;
  
  return { systemPrompt, userPrompt };
};

export const estimatePerformance = async (carInput: CarInput): Promise<AIResponse> => {
   if (!openai) {
    throw new Error("API key is not configured. Please set the VITE_OPENAI_API_KEY environment variable in your deployment settings.");
  }
  
  try {
    const { systemPrompt, userPrompt } = createPrompts(carInput);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error("Received an empty response from the AI.");
    }
    
    const data = JSON.parse(content);
    
    // OpenAI doesn't provide sources like Gemini, so we'll return an empty array
    return { ...data, sources: [] };

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse JSON response from the AI. The model may have returned an invalid format.");
    }
    throw new Error("Failed to get a response from the AI. The model may have returned an invalid format or an error occurred.");
  }
};