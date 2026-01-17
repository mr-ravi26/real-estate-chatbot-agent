import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SavedProperty } from '@/lib/types';
import { getAllProperties } from '@/lib/propertyUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userSessionId = searchParams.get('sessionId');
    
    if (!userSessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db('real-estate-chatbot');
    const collection = db.collection<SavedProperty>('savedProperties');
    
    // Get all saved property IDs for this session
    const savedProperties = await collection
      .find({ userSessionId })
      .sort({ savedAt: -1 })
      .toArray();
    
    // Get all properties
    const allProperties = getAllProperties();
    
    // Filter to only include saved properties with full details
    const savedPropertyIds = new Set(savedProperties.map(sp => sp.propertyId));
    const propertiesWithDetails = allProperties.filter(property => 
      savedPropertyIds.has(property.id)
    );
    
    // Sort by saved date (most recent first)
    const savedPropertyMap = new Map(
      savedProperties.map(sp => [sp.propertyId, sp.savedAt])
    );
    
    propertiesWithDetails.sort((a, b) => {
      const dateA = savedPropertyMap.get(a.id);
      const dateB = savedPropertyMap.get(b.id);
      if (!dateA || !dateB) return 0;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    return NextResponse.json({
      properties: propertiesWithDetails,
      count: propertiesWithDetails.length,
    });
    
  } catch (error) {
    console.error('Get saved properties details error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve saved properties' },
      { status: 500 }
    );
  }
}
