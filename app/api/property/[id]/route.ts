import { NextRequest, NextResponse } from 'next/server';
import { getAllProperties } from '@/lib/propertyUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = parseInt(params.id);
    
    if (isNaN(propertyId)) {
      return NextResponse.json(
        { error: 'Invalid property ID' },
        { status: 400 }
      );
    }
    
    const allProperties = getAllProperties();
    const property = allProperties.find(p => p.id === propertyId);
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ property });
    
  } catch (error) {
    console.error('Get property error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve property' },
      { status: 500 }
    );
  }
}
