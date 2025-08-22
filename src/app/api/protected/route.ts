import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId, user } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // Get user information
    const userInfo = {
      id: userId,
      email: user?.emailAddresses[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName,
      fullName: user?.fullName,
      imageUrl: user?.imageUrl,
      createdAt: user?.createdAt,
      lastSignInAt: user?.lastSignInAt,
    };

    // Get request metadata
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    return NextResponse.json({
      success: true,
      message: 'Protected API endpoint accessed successfully',
      data: {
        user: userInfo,
        session: {
          userId,
          isAuthenticated: true,
          timestamp: new Date().toISOString(),
        },
        request: {
          method: request.method,
          url: request.url,
          clientIP,
          userAgent,
        },
      },
      metadata: {
        endpoint: '/api/protected',
        authentication: 'Clerk',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Protected API error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, user } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Get request metadata
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    return NextResponse.json({
      success: true,
      message: 'Data processed successfully',
      data: {
        user: {
          id: userId,
          email: user?.emailAddresses[0]?.emailAddress,
          name: user?.fullName,
        },
        processedData: body,
        session: {
          userId,
          isAuthenticated: true,
          timestamp: new Date().toISOString(),
        },
        request: {
          method: request.method,
          url: request.url,
          clientIP,
          userAgent,
        },
      },
      metadata: {
        endpoint: '/api/protected',
        authentication: 'Clerk',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Protected API error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request'
      },
      { status: 500 }
    );
  }
}
