import { GoogleGenAI } from "@google/genai";
import type { CarInput, AIResponse, GroundingChunk } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using a mock response.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const generatePrompt = (carInput: CarInput): string => {
  const { make, model, year, trim, drivetrain, transmission, modifications, tireType, fuelType, launchTechnique } = carInput;
  return `
    You are an expert automotive performance analyst. Your task is to analyze a given car and a list of modifications to estimate its new performance metrics with high accuracy.

    **Step 1: Baseline Analysis**
    You MUST use Google Search to find the stock (factory) specifications for the car provided. This includes crank horsepower, curb weight, and 0-60 mph time. If the user provides Drivetrain or Transmission, prioritize that information, but verify it. If not provided, find the most common configuration. Also, estimate the stock wheel horsepower (WHP) by assuming a standard drivetrain loss (e.g., 15% for RWD/FWD, 20-25% for AWD).

    **Step 2: Modification Impact**
    Analyze the provided list of modifications and their likely impact on crank horsepower and WHP. Be specific in your reasoning.

    **Step 3: Advanced 0-60 Estimation**
    Do not simply guess the new 0-60 time. You must follow this process:
    1.  Calculate the stock and new power-to-weight ratios (lbs per hp). Use the estimated new crank horsepower for this calculation.
    2.  Use the new power-to-weight ratio to get a baseline mathematical estimate for the 0-60 time.
    3.  Use Google Search to find real-world 0-60 times for vehicles with similar power-to-weight ratios and drivetrain layouts to calibrate your estimate. Mention one or two example cars you are comparing against in your explanation.
    4.  Apply adjustment factors based on the user's input for Drivetrain, Tire Type, Fuel Type, and Launch Technique. For example, AWD and better tires will improve launch, reducing the 0-60 time, while a normal launch on all-season tires will limit it.

    **Step 4: Confidence Score**
    Based on the quality of information found and the specificity of the user's input, provide a confidence level for your estimate ('Low', 'Medium', or 'High'). For example, a common car with specific mods will yield high confidence, while a rare car with vague mods will be low confidence.

    **Step 5: Final Output**
    You MUST return your response as a single, valid JSON object. Do not include any text, code block formatting, or explanations outside of the JSON object itself.

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

    **Required JSON Output Schema:**
    {
      "stockPerformance": {
        "horsepower": number,
        "whp": number,
        "zeroToSixty": number
      },
      "estimatedPerformance": {
        "horsepower": number,
        "whp": number,
        "zeroToSixty": number
      },
      "explanation": "string (Detailed explanation covering your entire process from steps 1-4, including vehicle comparisons.)",
      "confidence": "'Low' | 'Medium' | 'High'"
    }
    `;
};

export const estimatePerformance = async (carInput: CarInput): Promise<AIResponse> => {
  if (!process.env.API_KEY) {
    // Mock response for development without API key
    await new Promise(res => setTimeout(res, 3000));
    return {
      stockPerformance: { horsepower: 300, whp: 255, zeroToSixty: 5.5 },
      estimatedPerformance: { horsepower: 350, whp: 300, zeroToSixty: 5.0 },
      explanation: "This is a mock response. The stock 3.5L V6 engine produces 300 horsepower, which is about 255 WHP assuming a 15% drivetrain loss. The addition of a cold air intake and a cat-back exhaust likely adds around 20-25 horsepower. The ECU tune optimizes for these mods and better fuel, adding another 25-30 horsepower for a total of 350 crank HP (approx. 300 WHP).\n\nThe improved power-to-weight ratio provides a baseline for a better 0-60 time. Compared to cars like the Audi S4, the estimated 0-60 time is around 5.0 seconds, factoring in the RWD layout and performance summer tires which improve traction off the line.",
      confidence: 'Medium',
      sources: [
        { web: { uri: "https://www.example.com", title: "Example Source 1" } },
        { web: { uri: "https://www.example.com", title: "Example Source 2" } }
      ]
    };
  }

  try {
    const prompt = generatePrompt(carInput);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
    const jsonText = response.text.trim().replace(/^```json\n?/, '').replace(/```$/, '');
    const data = JSON.parse(jsonText);
    
    return { ...data, sources };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get a response from the AI. The model may have returned an invalid format or an error occurred.");
  }
};