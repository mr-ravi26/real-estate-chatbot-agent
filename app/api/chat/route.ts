import { NextRequest, NextResponse } from 'next/server';
import { getAllProperties, parseUserPreferences, filterProperties, rankProperties } from '@/lib/propertyUtils';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Parse user preferences from the message
    const preferences = parseUserPreferences(message);
    
    // Get all properties
    const allProperties = getAllProperties();
    
    // Filter based on preferences
    let matchedProperties = filterProperties(allProperties, preferences);
    
    // Rank properties
    matchedProperties = rankProperties(matchedProperties);
    
    // Generate response message
    let responseMessage = '';
    
    if (matchedProperties.length === 0) {
      responseMessage = "I couldn't find any properties matching your criteria. Try adjusting your budget, location, or other preferences.";
    } else {
      const preferencesText = [];
      if (preferences.bedrooms) preferencesText.push(`${preferences.bedrooms} bedroom${preferences.bedrooms > 1 ? 's' : ''}`);
      if (preferences.budget) preferencesText.push(`under $${(preferences.budget / 1000).toFixed(0)}K`);
      if (preferences.location) preferencesText.push(`in ${preferences.location}`);
      if (preferences.amenities && preferences.amenities.length > 0) {
        preferencesText.push(`with ${preferences.amenities.join(', ')}`);
      }
      
      const criteriaText = preferencesText.length > 0 
        ? preferencesText.join(' ')
        : 'your criteria';
      
      responseMessage = `I found ${matchedProperties.length} propert${matchedProperties.length === 1 ? 'y' : 'ies'} matching ${criteriaText}. Check them out below!`;
    }
    
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
