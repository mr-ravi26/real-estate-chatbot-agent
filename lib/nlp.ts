import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

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

// Get configured AI provider from environment
const AI_PROVIDER = (process.env.AI_PROVIDER || 'regex').toLowerCase();

// Initialize AI clients based on provider
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Log provider configuration on startup
console.log(`🤖 AI Provider: ${AI_PROVIDER.toUpperCase()}`);
if (AI_PROVIDER === 'gemini' && !genAI) {
  console.log('⚠️  Warning: Gemini selected but no API key found. Falling back to regex.');
}
if (AI_PROVIDER === 'openai' && !openai) {
  console.log('⚠️  Warning: OpenAI selected but no API key found. Falling back to regex.');
}

/**
 * Extracts structured property preferences from natural language using configured AI provider
 */
export async function extractPropertyPreferences(
  userMessage: string,
  conversationHistory: Array<{role: string; content: string}> = []
): Promise<ExtractedPreferences> {
  // Route to appropriate provider
  switch (AI_PROVIDER) {
    case 'openai':
      return extractWithOpenAI(userMessage, conversationHistory);
    case 'gemini':
      return extractWithGemini(userMessage, conversationHistory);
    case 'regex':
    default:
      console.log(`ℹ️  Using ${AI_PROVIDER} provider for parsing`);
      return parseUserPreferencesRegexFallback(userMessage, conversationHistory.length > 1);
  }
}

/**
 * Uses OpenAI to extract preferences
 */
async function extractWithOpenAI(userMessage: string, conversationHistory: Array<{role: string; content: string}> = []): Promise<ExtractedPreferences> {
  if (!openai) {
    console.log('⚠️  No OpenAI API key found, falling back to regex parsing');
    return parseUserPreferencesRegexFallback(userMessage, conversationHistory.length > 1);
  }

  try {
    const hasHistory = conversationHistory.length > 1;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      timeout: 8000,
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(hasHistory),
        },
        ...conversationHistory.slice(-6).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
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
    if (extracted.amenities) {
      extracted.amenities = extracted.amenities.map(a => a.toLowerCase());
    }
    return extracted;
  } catch (error) {
    console.error('Error with OpenAI:', error);
    console.log('⚠️  Falling back to regex-based parsing');
    return parseUserPreferencesRegexFallback(userMessage);
  }
}

/**
 * Uses Google Gemini to extract preferences
 */
async function extractWithGemini(userMessage: string, conversationHistory: Array<{role: string; content: string}> = []): Promise<ExtractedPreferences> {
  if (!genAI) {
    console.log('⚠️  No Gemini API key found, falling back to regex parsing');
    return parseUserPreferencesRegexFallback(userMessage, conversationHistory.length > 1);
  }

  try {
    const hasHistory = conversationHistory.length > 1;
    
    // Build conversation context for Gemini
    let conversationContext = '';
    if (hasHistory) {
      conversationContext = '\n\nConversation history:\n' + 
        conversationHistory.slice(-6).map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n') + '\n\n';
    }
    
    const prompt = `${getSystemPrompt(hasHistory)}${conversationContext}
User message: ${userMessage}

CRITICAL: Return ONLY valid JSON with no other text, commentary, or explanations. Do not include thinking process or notes.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    let text = response.text;
    
    if (!text) {
      return { intent: 'search' };
    }

    // Parse JSON response - extract JSON from markdown or plain text
    let jsonText = text.trim();
    
    // Remove any meta-commentary before JSON
    jsonText = jsonText.replace(/^.*?(?=\{)/s, '');
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
    }
    
    // Remove any text after closing brace
    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace !== -1) {
      jsonText = jsonText.substring(0, lastBrace + 1);
    }
    
    const extracted = JSON.parse(jsonText) as ExtractedPreferences;
    
    // Normalize amenities to lowercase
    if (extracted.amenities) {
      extracted.amenities = extracted.amenities.map(a => a.toLowerCase());
    }
    
    // Log extracted preferences for debugging
    console.log('✅ Gemini extracted preferences:', JSON.stringify(extracted, null, 2));
    
    return extracted;
  } catch (error) {
    console.error('❌ Error extracting preferences with Gemini:', error);
    console.log('Raw response text:', text);
    console.log('⚠️  Falling back to regex-based parsing');
    return parseUserPreferencesRegexFallback(userMessage, conversationHistory.length > 1);
  }
}

/**
 * Generates a natural, conversational response based on search results
 */
export async function generateNaturalResponse(
  userMessage: string,
  preferences: ExtractedPreferences,
  matchCount: number,
  conversationHistory: Array<{role: string; content: string}> = []
): Promise<string> {
  // Route to appropriate provider
  switch (AI_PROVIDER) {
    case 'openai':
      return generateWithOpenAI(userMessage, preferences, matchCount, conversationHistory);
    case 'gemini':
      return generateWithGemini(userMessage, preferences, matchCount, conversationHistory);
    case 'regex':
    default:
      return generateFallbackResponse(preferences, matchCount);
  }
}

/**
 * Generates response using OpenAI
 */
async function generateWithOpenAI(
  userMessage: string,
  preferences: ExtractedPreferences,
  matchCount: number,
  conversationHistory: Array<{role: string; content: string}> = []
): Promise<string> {
  if (!openai) {
    return generateFallbackResponse(preferences, matchCount);
  }

  try {
    const hasHistory = conversationHistory.length > 1;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      timeout: 5000,
      messages: [
        {
          role: 'system',
          content: getResponsePrompt(preferences, matchCount, hasHistory),
        },
        ...conversationHistory.slice(-6).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || generateFallbackResponse(preferences, matchCount);
  } catch (error) {
    console.error('Error generating response with OpenAI:', error);
    return generateFallbackResponse(preferences, matchCount);
  }
}

/**
 * Generates response using Gemini
 */
async function generateWithGemini(
  userMessage: string,
  preferences: ExtractedPreferences,
  matchCount: number,
  conversationHistory: Array<{role: string; content: string}> = []
): Promise<string> {
  if (!genAI) {
    return generateFallbackResponse(preferences, matchCount);
  }

  try {
    const hasHistory = conversationHistory.length > 1;
    
    // Build conversation context for Gemini
    let conversationContext = '';
    if (hasHistory) {
      conversationContext = '\n\nConversation history:\n' + 
        conversationHistory.slice(-6).map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n') + '\n\n';
    }
    
    const prompt = `${getResponsePrompt(preferences, matchCount, hasHistory)}${conversationContext}
User message: ${userMessage}

IMPORTANT: Output ONLY the final response to the user. Do NOT include:
- Your reasoning or thinking process
- Meta-commentary about the response
- Notes about refinement or persona
- Just output the direct, natural response to the user.

Generate a response:`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    let text = response.text;
    
    if (!text) {
      return generateFallbackResponse(preferences, matchCount);
    }
    
    // Clean up Gemini's meta-commentary and thinking process
    text = text
      // Remove lines starting with meta-commentary markers
      .replace(/^(Refining|Thinking|Note|Meta|Internal|Reasoning|Analysis|Commentary|Persona|Character).*$/gmi, '')
      // Remove content in parentheses that looks like meta-commentary
      .replace(/\((?:refining|thinking|note|internal|reasoning).*?\)/gi, '')
      // Remove asterisk-prefixed meta notes
      .replace(/^\*\s*(Refining|Thinking|Note|Meta).*$/gmi, '')
      // Remove multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return text || generateFallbackResponse(preferences, matchCount);
  } catch (error) {
    console.error('Error generating natural response with Gemini:', error);
    return generateFallbackResponse(preferences, matchCount);
  }
}

/**
 * System prompt for preference extraction (shared across providers)
 */
function getSystemPrompt(hasHistory: boolean = false): string {
  return `You are an expert at understanding real estate queries. Extract property search preferences from user messages.

${hasHistory ? 'IMPORTANT: This is part of an ongoing conversation. Do NOT set intent to "greeting" unless the user is explicitly saying hello/hi for the first time. If they are asking about properties or continuing the conversation, set intent to "search".' : ''}

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

IMPORTANT: If the message is just a greeting (hi, hello, hey, etc.) or incomplete text without property details, set intent to "greeting" and leave all other fields null.`;
}

/**
 * Response generation prompt (shared across providers)
 */
function getResponsePrompt(preferences: ExtractedPreferences, matchCount: number, hasHistory: boolean = false): string {
  return `You are Agent Mira, a friendly and professional AI real estate assistant. Generate natural, conversational responses based on property search results.

Guidelines:
- Be warm, helpful, and professional
- Keep responses concise (2-3 sentences max)
- Mention specific search criteria when relevant
- If no matches found, suggest adjusting criteria
- Use emojis sparingly (1-2 per message maximum)
${hasHistory ? 
`- CRITICAL: This is an ONGOING conversation - NEVER EVER say "Hi I'm Mira" or "Hi! I'm" or introduce yourself
- Continue naturally from the previous context
- Reference what the user said previously if relevant
- Act like you already know the user from previous messages` : 
`- For first-time greetings, introduce yourself warmly`}
- Sound human and conversational, not robotic

Preference details provided:
${JSON.stringify(preferences, null, 2)}

Number of matching properties: ${matchCount}`;
}

/**
 * Fallback regex-based preference parser
 */
function parseUserPreferencesRegexFallback(input: string, hasHistory: boolean = false): ExtractedPreferences {
  const preferences: ExtractedPreferences = {};
  const lowerInput = input.toLowerCase();
  
  console.log('🔄 Using regex fallback for:', input);
  
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
    console.log('💰 Extracted budget:', amount);
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
    console.log('💰 Extracted budget range:', min, '-', max);
  }
  
  // Extract bedrooms
  const bedroomMatch = lowerInput.match(/(\d+)\s*(?:bhk|bed|bedroom)/i);
  if (bedroomMatch) {
    preferences.bedrooms = parseInt(bedroomMatch[1]);
    console.log('🛏️ Extracted bedrooms:', preferences.bedrooms);
  }
  
  // Extract location - improved patterns
  const locationPatterns = [
    /(?:in|at|near|around)\s+([a-z\s,]+?)(?:\s+with|\s+under|\s+below|\s+properties?|$)/i,
    /properties?\s+(?:in|at|near)\s+([a-z\s,]+?)(?:\s+with|\s+under|\s+below|$)/i,
    /([a-z\s]+?)\s+(?:properties?|apartments?|house|condo)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = lowerInput.match(pattern);
    if (match && match[1]) {
      const location = match[1].trim();
      // Filter out common non-location words
      if (location.length > 2 && !['any', 'the', 'for', 'rental', 'rent', 'sale', 'buy'].includes(location)) {
        preferences.location = location;
        console.log('📍 Extracted location:', location);
        break;
      }
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
    console.log('🏠 Extracted amenities:', foundAmenities);
  }
  
  // Detect intent
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy|sup)/i.test(input.trim())) {
    preferences.intent = 'greeting';
  } else if (hasHistory && input.trim().length < 15 && !/\d/.test(input) && !/bhk|bed|room|location|property/i.test(input)) {
    // In ongoing conversation, avoid greeting for short queries
    preferences.intent = 'search';
  } else if (input.trim().length < 10 && !/\d/.test(input) && !/bhk|bed|room|location|property/i.test(input)) {
    // Short messages without numbers or property keywords are likely greetings
    preferences.intent = 'greeting';
  } else {
    preferences.intent = 'search';
  }
  
  console.log('✅ Regex extracted preferences:', JSON.stringify(preferences, null, 2));
  
  return preferences;
}

/**
 * Generates fallback response without AI
 */
function generateFallbackResponse(
  preferences: ExtractedPreferences,
  matchCount: number
): string {
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
