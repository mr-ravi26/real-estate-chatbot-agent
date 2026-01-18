import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    const APP_PASSWORD = process.env.APP_PASSWORD;
    
    // If no password is configured, deny access for security
    if (!APP_PASSWORD) {
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      );
    }
    
    if (password === APP_PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      // Set authentication cookie for 24 hours
      response.cookies.set('app_authenticated', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400, // 24 hours
        path: '/',
      });
      
      return response;
    }
    
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
