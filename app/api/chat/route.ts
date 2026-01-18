import { NextRequest, NextResponse } from 'next/server';
import { getAllProperties, filterPropertiesNLP, rankPropertiesNLP } from '@/lib/propertyUtils';
import { extractPropertyPreferences, generateNaturalResponse } from '@/lib/nlp';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Use OpenAI to extract preferences from natural language
    const preferences = await extractPropertyPreferences(message);
    
    // Handle greetings and non-search intents
    if (preferences.intent === 'greeting') {
      const greetingResponse = await generateNaturalResponse(
        message,
        preferences,
        0
      ).catch(() => 
        "👋 Hi! I'm Agent Mira, your AI real estate assistant. Tell me what you're looking for - budget, location, bedrooms, or amenities!"
      );
      
      // Add suggestion chips for greeting responses
      const suggestions = [
        '2 BHK under $500K',
        'Luxury properties with pool',
        '3 bedroom house',
        'Show properties in Miami',
      ];
      
      return NextResponse.json({
        message: greetingResponse,
        properties: [],
        preferences,
        suggestions,
      });
    }
    
    // Get all properties
    const allProperties = getAllProperties();
    
    // Filter based on NLP-extracted preferences
    let matchedProperties = filterPropertiesNLP(allProperties, preferences);
    
    // Rank properties based on preferences and user intent
    matchedProperties = rankPropertiesNLP(matchedProperties, preferences);
    
    // Generate natural response using OpenAI
    const responseMessage = await generateNaturalResponse(
      message,
      preferences,
      matchedProperties.length
    );
    
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
