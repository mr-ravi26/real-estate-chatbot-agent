import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedPreferences {
  location?: string;
  budget?: number;
  minBudget?: number;
  maxBudget?: number;
  bedrooms?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  amenities?: string[];
  keywords?: string[];
  intent?: string;
}

/**
 * Uses OpenAI to extract structured property preferences from natural language
 */
export async function extractPropertyPreferences(
  userMessage: string
): Promise<ExtractedPreferences> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at understanding real estate queries. Extract property search preferences from user messages.

Extract the following information in JSON format:
- location: city, neighborhood, or area mentioned (string)
- budget: maximum budget if single value mentioned (number in dollars)
- minBudget: minimum budget for range (number in dollars)
- maxBudget: maximum budget for range (number in dollars)
- bedrooms: exact number of bedrooms (number)
- minBedrooms: minimum bedrooms for range (number)
- maxBedrooms: maximum bedrooms for range (number)
- bathrooms: number of bathrooms (number)
- propertyType: type like "apartment", "house", "condo", "villa", "studio" (string)
- amenities: list of amenities like ["parking", "gym", "pool", "garden", "security"] (array)
- keywords: other important keywords or preferences (array)
- intent: primary user intent like "search", "browse", "compare", "get_details", "greeting" (string)

Budget conversion rules:
- "K" or "thousand" = multiply by 1,000
- "M" or "million" = multiply by 1,000,000
- "lakh" = multiply by 100,000

For ranges like "between X and Y" or "X to Y", use minBudget/maxBudget or minBedrooms/maxBedrooms.
For "under", "below", "less than", "up to" use only budget or maxBudget.
For "above", "over", "more than" use minBudget.

Return ONLY valid JSON, no other text.`,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { intent: 'search' };
    }

    const extracted = JSON.parse(content) as ExtractedPreferences;
    
    // Normalize amenities to lowercase
    if (extracted.amenities) {
      extracted.amenities = extracted.amenities.map(a => a.toLowerCase());
    }
    
    return extracted;
  } catch (error) {
    console.error('Error extracting preferences with OpenAI:', error);
    console.log('⚠️  Falling back to regex-based parsing');
    // Fallback to regex parsing without circular import
    return parseUserPreferencesRegexFallback(userMessage);
  }
}

/**
 * Inline fallback regex parser to avoid circular dependencies
 */
function parseUserPreferencesRegexFallback(input: string): ExtractedPreferences {
  const preferences: ExtractedPreferences = {};
  const lowerInput = input.toLowerCase();
  
  // Extract budget
  const budgetMatch = lowerInput.match(/(?:under|below|less than|up to|max)\s*\$?\s*(\d+(?:,?\d+)*)\s*(?:k|lakhs?|thousand|million|m)?/i);
  if (budgetMatch) {
    let amount = parseInt(budgetMatch[1].replace(/,/g, ''));
    if (lowerInput.includes('lakh')) {
      amount *= 100000;
    } else if (lowerInput.includes('k') || lowerInput.includes('thousand')) {
      amount *= 1000;
    } else if (lowerInput.includes('m') || lowerInput.includes('million')) {
      amount *= 1000000;
    }
    preferences.budget = amount;
  }
  
  // Extract budget range
  const rangeMatch = lowerInput.match(/(?:between|from)\s*\$?\s*(\d+(?:,?\d+)*)\s*(?:k|thousand)?\s*(?:and|to|-)\s*\$?\s*(\d+(?:,?\d+)*)\s*(?:k|thousand)?/i);
  if (rangeMatch) {
    let min = parseInt(rangeMatch[1].replace(/,/g, ''));
    let max = parseInt(rangeMatch[2].replace(/,/g, ''));
    if (lowerInput.includes('k') || lowerInput.includes('thousand')) {
      min *= 1000;
      max *= 1000;
    }
    preferences.minBudget = min;
    preferences.maxBudget = max;
  }
  
  // Extract bedrooms
  const bedroomMatch = lowerInput.match(/(\d+)\s*(?:bhk|bed|bedroom)/i);
  if (bedroomMatch) {
    preferences.bedrooms = parseInt(bedroomMatch[1]);
  }
  
  // Extract location
  const locationKeywords = ['in', 'at', 'near', 'around'];
  for (const keyword of locationKeywords) {
    const regex = new RegExp(`${keyword}\\s+([a-z\\s,]+?)(?:\\s+with|\\s+under|\\s+below|$)`, 'i');
    const match = lowerInput.match(regex);
    if (match) {
      preferences.location = match[1].trim();
      break;
    }
  }
  
  // Extract amenities
  const amenityKeywords = ['parking', 'gym', 'pool', 'swimming pool', 'garden', 'balcony', 'security', 'elevator', 'terrace'];
  const foundAmenities: string[] = [];
  
  for (const amenity of amenityKeywords) {
    if (lowerInput.includes(amenity)) {
      foundAmenities.push(amenity);
    }
  }
  
  if (foundAmenities.length > 0) {
    preferences.amenities = foundAmenities;
  }
  
  // Detect intent
  if (/^(hi|hello|hey|greetings)/i.test(input.trim())) {
    preferences.intent = 'greeting';
  } else {
    preferences.intent = 'search';
  }
  
  return preferences;
}

/**
 * Generates a natural, conversational response based on search results
 */
export async function generateNaturalResponse(
  userMessage: string,
  preferences: ExtractedPreferences,
  matchCount: number,
  conversationContext?: string
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Agent Mira, a friendly and professional AI real estate assistant. Generate natural, conversational responses based on property search results.

Guidelines:
- Be warm, helpful, and professional
- Keep responses concise (2-3 sentences max)
- Mention specific search criteria when relevant
- If no matches found, suggest adjusting criteria
- Use emojis sparingly (1-2 per message maximum)
- For greetings, introduce yourself warmly
- Sound human and conversational, not robotic

Preference details provided:
${JSON.stringify(preferences, null, 2)}

Number of matching properties: ${matchCount}`,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return completion.choices[0]?.message?.content || 
      `I found ${matchCount} propert${matchCount === 1 ? 'y' : 'ies'} for you. Take a look!`;
  } catch (error) {
    console.error('Error generating natural response with OpenAI:', error);
    // Fallback: Generate response based on preferences
    if (matchCount === 0) {
      return "I couldn't find any properties matching your criteria. Try adjusting your budget, location, or other preferences.";
    }
    
    const preferencesText = [];
    if (preferences.bedrooms) preferencesText.push(`${preferences.bedrooms} bedroom${preferences.bedrooms > 1 ? 's' : ''}`);
    if (preferences.budget) preferencesText.push(`under $${(preferences.budget / 1000).toFixed(0)}K`);
    if (preferences.maxBudget) preferencesText.push(`under $${(preferences.maxBudget / 1000).toFixed(0)}K`);
    if (preferences.location) preferencesText.push(`in ${preferences.location}`);
    if (preferences.amenities && preferences.amenities.length > 0) {
      preferencesText.push(`with ${preferences.amenities.join(', ')}`);
    }
    
    const criteriaText = preferencesText.length > 0 
      ? preferencesText.join(' ')
      : 'your criteria';
    
    return `I found ${matchCount} propert${matchCount === 1 ? 'y' : 'ies'} matching ${criteriaText}. Check them out below!`;
  }
}

/**
 * Generates intelligent property ranking scores based on user preferences
 */
export async function generatePropertyRankingInsights(
  userMessage: string,
  preferences: ExtractedPreferences
): Promise<{ priorityFactors: string[]; searchStrategy: string }> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze the user's real estate search query and identify what factors are most important to them for ranking properties.

Return JSON with:
- priorityFactors: array of factors in priority order like ["budget", "location", "size", "amenities"]
- searchStrategy: brief description of search strategy like "budget_focused" or "amenity_driven"

User preferences:
${JSON.stringify(preferences, null, 2)}`,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { priorityFactors: ['price'], searchStrategy: 'general' };
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating ranking insights:', error);
    return { priorityFactors: ['price'], searchStrategy: 'general' };
  }
}
