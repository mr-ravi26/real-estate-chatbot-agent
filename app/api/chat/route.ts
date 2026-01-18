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
      return NextResponse.json({
        message: greetingResponse,
        properties: [],
        preferences,
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
    
    return NextResponse.json({
      message: responseMessage,
      properties: matchedProperties.slice(0, 12), // Limit to 12 properties
      preferences,
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}
