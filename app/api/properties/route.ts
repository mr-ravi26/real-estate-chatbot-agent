import { NextRequest, NextResponse } from 'next/server';
import { getAllProperties } from '@/lib/propertyUtils';

export async function GET(request: NextRequest) {
  try {
    const properties = getAllProperties();
    
    return NextResponse.json({
      properties,
      total: properties.length,
    });
  } catch (error) {
    console.error('Get all properties error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve properties' },
      { status: 500 }
    );
  }
}
