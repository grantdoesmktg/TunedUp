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
    You are an expert automotive performance analyst. Your task is to analyze a given car and a list of modifications to estimate its new performance metrics with high accuracy.

    You MUST return your response as a single, valid JSON object. Do not include any text, code block formatting, or explanations outside of the JSON object itself.
    
    Required JSON Output Schema:
    {
      "stockPerformance": { "horsepower": number, "whp": number, "zeroToSixty": number },
      "estimatedPerformance": { "horsepower": number, "whp": number, "zeroToSixty": number },
      "explanation": "string (Detailed explanation covering your entire process, including vehicle comparisons.)",
      "confidence": "'Low' | 'Medium' | 'High'"
    }
  `;

  const userPrompt = `
    Analyze the following car and modifications.

    **Step 1: Baseline Analysis**
    Use your extensive knowledge base to find the stock (factory) specifications for the car provided. This includes crank horsepower, curb weight, and 0-60 mph time. If the user provides Drivetrain or Transmission, prioritize that information. If not provided, find the most common configuration. Also, estimate the stock wheel horsepower (WHP) by assuming a standard drivetrain loss (e.g., 15% for RWD/FWD, 20-25% for AWD).

    **Step 2: Modification Impact**
    Analyze the provided list of modifications and their likely impact on crank horsepower and WHP. Be specific in your reasoning. Consider synergistic effects where multiple complementary mods (e.g., intake + downpipe + tune) yield more power than the sum of their parts. Lean towards the optimistic but still realistic side of estimates when a build is well-thought-out.

    **Step 3: Advanced 0-60 Estimation**
    1.  Calculate the stock and new power-to-weight ratios (lbs per hp). Use the estimated new crank horsepower for this calculation.
    2.  Use the new power-to-weight ratio to get a baseline mathematical estimate for the 0-60 time.
    3.  Compare against real-world 0-60 times for vehicles with similar power-to-weight ratios and drivetrain layouts to calibrate your estimate. Mention one or two example cars you are comparing against in your explanation.
    4.  Apply adjustment factors based on the user's input for Drivetrain, Tire Type, Fuel Type, and Launch Technique.

    **Step 4: Confidence Score**
    Based on the quality of your internal data and the specificity of the user's input, provide a confidence level for your estimate ('Low', 'Medium', 'High').

    **User Provided Data:**
    - Make: ${make}
    - Model: ${model}
    - Year: ${year}
    - Trim: ${trim || 'Not provided'}
    - Drivetrain: ${drivetrain === 'Not Specified' ? 'Not provided' : drivetrain}
    - Transmission: ${transmission === 'Not Specified' ? 'Not provided' : transmission}
    - Modifications: ${modifications}
    - Tire Type: ${tireType === 'Not Specified' ? 'Not provided' : tireType}
    - Fuel Type: ${fuelType === 'Not Specified' ? 'Not provided' : fuelType}
    - Launch Technique: ${launchTechnique === 'Not Specified' ? 'Not provided' : launchTechnique}
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
      temperature: 0.1,
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