import type { CarInput, AIResponse } from '../types';

export const estimatePerformance = async (carInput: CarInput, user?: any): Promise<AIResponse> => {
  try {
    const response = await fetch('/api/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(user?.email && { 'x-user-email': user.email })
      },
      body: JSON.stringify(carInput)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Validate the response structure
    if (!data.stockPerformance || !data.estimatedPerformance || !data.explanation || !data.confidence) {
      throw new Error("API response missing required fields.");
    }
    
    return data as AIResponse;

  } catch (error) {
    console.error("Error calling performance API:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('configuration')) {
        throw new Error("API key is not configured. Please set the GEMINI_API_KEY environment variable in your deployment settings.");
      } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
        throw new Error("Network error. Please check your connection and try again.");
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        throw new Error("Gemini API quota exceeded. Please try again later.");
      }
      // Re-throw the original error message if it's already user-friendly
      throw error;
    }
    
    throw new Error("Failed to get a response from the AI. Please try again.");
  }
};