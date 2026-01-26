import { NextRequest, NextResponse } from 'next/server';
import { getAllProperties, filterPropertiesNLP, rankPropertiesNLP } from '@/lib/propertyUtils';
import { extractPropertyPreferences, generateNaturalResponse } from '@/lib/nlp';

// Configure maximum duration for this route (60 seconds for Pro plan, 10 for Hobby)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Check if this is the first user message (only initial greeting in history)
    const isFirstMessage = conversationHistory.filter((m: any) => m.role === 'user').length === 0;
    
    // Use OpenAI to extract preferences from natural language with timeout
    const preferences = await Promise.race([
      extractPropertyPreferences(message, conversationHistory),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Preference extraction timeout')), 8000)
      )
    ]).catch((error) => {
      console.error('Preference extraction error:', error);
      return { intent: 'search' };
    }) as any;
    
    // Force search intent if we have conversation history (prevent greeting loops)
    if (!isFirstMessage && preferences.intent === 'greeting') {
      preferences.intent = 'search';
    }
    
    // Handle greetings or vague messages
    const isVagueQuery = !preferences.location && 
                        !preferences.budget && 
                        !preferences.minBudget && 
                        !preferences.maxBudget && 
                        !preferences.bedrooms && 
                        !preferences.minBedrooms && 
                        !preferences.maxBedrooms && 
                        !preferences.bathrooms && 
                        !preferences.propertyType && 
                        (!preferences.amenities || preferences.amenities.length === 0);
    
    if (preferences.intent === 'greeting' || isVagueQuery) {
      const greetingResponse = await Promise.race([
        generateNaturalResponse(message, preferences, 0, conversationHistory),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Response generation timeout')), 5000)
        )
      ]).catch(() => {
        if (isFirstMessage) {
          return "👋 Hi! I'm Agent Mira, your AI real estate assistant. Tell me what you're looking for - budget, location, bedrooms, or amenities!";
        } else {
          return "It seems like we're not quite on the same page yet! Could you share what you're looking for in terms of location, budget, or any specific features?";
        }
      }) as string;
      
      // Add suggestion chips for greeting/vague responses
      const suggestions = [
        '2 BHK under $500K',
        'Luxury properties with pool',
        '3 bedroom house in Miami',
        'Show properties with parking',
      ];
      
      return NextResponse.json({
        message: greetingResponse,
        properties: [], // Don't show properties for vague queries
        preferences,
        suggestions,
      });
    }
    
    // Get all properties
    const allProperties = getAllProperties();
    
    console.log(`🔍 Searching with preferences:`, JSON.stringify(preferences, null, 2));
    
    // Filter based on NLP-extracted preferences
    let matchedProperties = filterPropertiesNLP(allProperties, preferences);
    
    console.log(`📊 Found ${matchedProperties.length} properties after filtering`);
    
    // Rank properties based on preferences and user intent
    matchedProperties = rankPropertiesNLP(matchedProperties, preferences);
    
    // Generate natural response using OpenAI with timeout and conversation context
    let responseMessage = await Promise.race([
      generateNaturalResponse(message, preferences, matchedProperties.length, conversationHistory),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Response generation timeout')), 5000)
      )
    ]).catch(() => {
      // Fallback response
      const count = matchedProperties.length;
      if (count === 0) return "I couldn't find any properties matching your criteria. Try adjusting your search!";
      return `I found ${count} propert${count === 1 ? 'y' : 'ies'} for you. Check them out below!`;
    }) as string;
    
    // Post-process: Remove greeting phrases in ongoing conversations
    if (!isFirstMessage) {
      // Remove common greeting patterns
      responseMessage = responseMessage
        .replace(/^Hi!?\s*I'?m\s+(Agent\s+)?Mira[,.]?\s*/i, '')
        .replace(/^Hello!?\s*I'?m\s+(Agent\s+)?Mira[,.]?\s*/i, '')
        .replace(/^Hey!?\s*I'?m\s+(Agent\s+)?Mira[,.]?\s*/i, '')
        .replace(/^👋\s*Hi!?\s*I'?m\s+(Agent\s+)?Mira[,.]?\s*/i, '')
        .replace(/I'?m\s+Mira,?\s+your\s+(friendly\s+)?real\s+estate\s+assistant\.?/i, '')
        .replace(/I'?m\s+(Agent\s+)?Mira,?\s+and\s+I'?m\s+/i, 'I\'m ')
        .trim();
      
      // If response was entirely a greeting, use fallback
      if (!responseMessage || responseMessage.length < 10) {
        const count = matchedProperties.length;
        responseMessage = count === 0 
          ? "I couldn't find any properties matching your criteria. Try adjusting your search!"
          : `I found ${count} propert${count === 1 ? 'y' : 'ies'} for you. Check them out below!`;
      }
    }
    
    // Generate contextual suggestions based on search results
    const suggestions: string[] = [];
    
    if (matchedProperties.length > 0) {
      // Suggest related searches
      if (preferences.bedrooms) {
        suggestions.push(`Show ${preferences.bedrooms + 1} bedroom options`);
      }
      if (preferences.location) {
        const otherLocations = ['New York', 'Miami', 'California', 'Texas', 'Boston'];
        const otherLoc = otherLocations.find(loc => 
          !preferences.location?.toLowerCase().includes(loc.toLowerCase())
        );
        if (otherLoc) suggestions.push(`Similar properties in ${otherLoc}`);
      }
      if (preferences.budget) {
        const higherBudget = Math.round(preferences.budget * 1.2 / 10000) * 10000;
        suggestions.push(`Under $${higherBudget.toLocaleString()}`);
      }
      suggestions.push('Show properties with pool');
      suggestions.push('Properties with parking');
    } else {
      // No results - suggest broader searches
      suggestions.push('Show all properties');
      suggestions.push('2 BHK under $500K');
      suggestions.push('Luxury properties');
      suggestions.push('Properties in Miami');
    }
    
    return NextResponse.json({
      message: responseMessage,
      properties: matchedProperties.slice(0, 12), // Limit to 12 properties
      preferences,
      suggestions: suggestions.slice(0, 4), // Limit to 4 suggestions
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}
