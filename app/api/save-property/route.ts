import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SavedProperty } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { propertyId, userSessionId } = await request.json();
    
    if (!propertyId || !userSessionId) {
      return NextResponse.json(
        { error: 'Property ID and session ID are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db('real-estate-chatbot');
    const collection = db.collection<SavedProperty>('savedProperties');
    
    // Check if already saved
    const existing = await collection.findOne({
      userSessionId,
      propertyId: Number(propertyId),
    });
    
    if (existing) {
      return NextResponse.json({
        message: 'Property already saved',
        saved: true,
      });
    }
    
    // Save the property
    const savedProperty: SavedProperty = {
      userSessionId,
      propertyId: Number(propertyId),
      savedAt: new Date(),
    };
    
    await collection.insertOne(savedProperty);
    
    return NextResponse.json({
      message: 'Property saved successfully',
      saved: true,
    });
    
  } catch (error) {
    console.error('Save property error:', error);
    return NextResponse.json(
      { error: 'Failed to save property' },
      { status: 500 }
    );
  }
}

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
    
    const savedProperties = await collection
      .find({ userSessionId })
      .sort({ savedAt: -1 })
      .toArray();
    
    return NextResponse.json({
      savedProperties: savedProperties.map(sp => sp.propertyId),
    });
    
  } catch (error) {
    console.error('Get saved properties error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve saved properties' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { propertyId, userSessionId } = await request.json();
    
    if (!propertyId || !userSessionId) {
      return NextResponse.json(
        { error: 'Property ID and session ID are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db('real-estate-chatbot');
    const collection = db.collection<SavedProperty>('savedProperties');
    
    await collection.deleteOne({
      userSessionId,
      propertyId: Number(propertyId),
    });
    
    return NextResponse.json({
      message: 'Property removed from saved list',
      saved: false,
    });
    
  } catch (error) {
    console.error('Delete saved property error:', error);
    return NextResponse.json(
      { error: 'Failed to remove property' },
      { status: 500 }
    );
  }
}
