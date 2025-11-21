// Content Moderation Utility using OpenAI Moderation API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    'hate/threatening': boolean;
    harassment: boolean;
    'harassment/threatening': boolean;
    'self-harm': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    sexual: boolean;
    'sexual/minors': boolean;
    violence: boolean;
    'violence/graphic': boolean;
  };
  category_scores: {
    [key: string]: number;
  };
}

/**
 * Check if text content violates moderation policies
 * @param text - The text to moderate
 * @returns Promise with moderation result
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    if (!text || text.trim().length === 0) {
      return {
        flagged: false,
        categories: {
          hate: false,
          'hate/threatening': false,
          harassment: false,
          'harassment/threatening': false,
          'self-harm': false,
          'self-harm/intent': false,
          'self-harm/instructions': false,
          sexual: false,
          'sexual/minors': false,
          violence: false,
          'violence/graphic': false,
        },
        category_scores: {},
      };
    }

    const moderation = await openai.moderations.create({
      input: text,
    });

    const result = moderation.results[0];

    console.log('🛡️ Moderation check:', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      flagged: result.flagged,
      categories: Object.entries(result.categories)
        .filter(([_, value]) => value)
        .map(([key]) => key),
    });

    return {
      flagged: result.flagged,
      categories: result.categories as any,
      category_scores: result.category_scores as any,
    };
  } catch (error) {
    console.error('❌ Moderation API error:', error);
    // Fail open: if moderation API fails, allow the content
    // You can change this to fail closed (reject content) if preferred
    return {
      flagged: false,
      categories: {
        hate: false,
        'hate/threatening': false,
        harassment: false,
        'harassment/threatening': false,
        'self-harm': false,
        'self-harm/intent': false,
        'self-harm/instructions': false,
        sexual: false,
        'sexual/minors': false,
        violence: false,
        'violence/graphic': false,
      },
      category_scores: {},
    };
  }
}

/**
 * Get a user-friendly error message for flagged content
 * @param result - The moderation result
 * @returns A user-friendly error message
 */
export function getModerationErrorMessage(result: ModerationResult): string {
  if (!result.flagged) {
    return '';
  }

  const flaggedCategories = Object.entries(result.categories)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  if (flaggedCategories.length === 0) {
    return 'This content violates our community guidelines.';
  }

  // Provide specific feedback based on category
  if (flaggedCategories.some(cat => cat.includes('hate'))) {
    return 'This content contains hate speech or discriminatory language, which violates our community guidelines.';
  }
  if (flaggedCategories.some(cat => cat.includes('harassment'))) {
    return 'This content contains harassing or threatening language, which is not allowed.';
  }
  if (flaggedCategories.some(cat => cat.includes('self-harm'))) {
    return 'This content discusses self-harm, which violates our community guidelines. If you need support, please reach out to a crisis helpline.';
  }
  if (flaggedCategories.some(cat => cat.includes('sexual'))) {
    return 'This content contains inappropriate sexual content, which is not allowed.';
  }
  if (flaggedCategories.some(cat => cat.includes('violence'))) {
    return 'This content contains violent or graphic content, which violates our community guidelines.';
  }

  return 'This content violates our community guidelines. Please revise and try again.';
}

/**
 * Moderate multiple text fields at once
 * @param fields - Object with field names and text values
 * @returns Promise with moderation result and which field failed
 */
export async function moderateMultipleFields(
  fields: Record<string, string>
): Promise<{ passed: boolean; failedField?: string; message?: string }> {
  for (const [fieldName, text] of Object.entries(fields)) {
    if (!text || text.trim().length === 0) continue;

    const result = await moderateContent(text);
    if (result.flagged) {
      return {
        passed: false,
        failedField: fieldName,
        message: getModerationErrorMessage(result),
      };
    }
  }

  return { passed: true };
}
