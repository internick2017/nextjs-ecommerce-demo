import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandler,
  withLogging,
  withRateLimit,
  compose
} from '../../../lib/apiErrorHandler';
import {
  withHeaders,
  withCookies,
  withRequestValidation,
  CookieHandler,
  RequestHeaderUtils,
  ResponseHeaderUtils,
  headerUtils,
  HeaderConfig,
  CookieConfig
} from '../../../lib/headerHandler';
import { AppError } from '../../../lib/errorHandler';

// Authentication configuration
const authHeaderConfig: HeaderConfig = {
  security: {
    enableHSTS: true,
    enableCSP: true,
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true,
  },
  cors: {
    origins: ['http://localhost:3000', 'https://yourdomain.com'],
    methods: ['POST', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600,
  },
  cache: {
    enableETag: false,
    maxAge: 0,
  },
};

const authCookieConfig: CookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/',
};

// Mock user database
const users = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'admin123', // In real app, this would be hashed
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
    name: 'Regular User'
  }
];

// Mock JWT token generation (in real app, use a proper JWT library)
function generateToken(userId: string, role: string): string {
  const payload = {
    userId,
    role,
    iat: Date.now(),
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Mock JWT token validation
function validateToken(token: string): { userId: string; role: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

// Login handler
const loginHandler = async (request: NextRequest) => {
  // Validate request headers
  const validation = RequestHeaderUtils.validateHeaders(request);
  if (!validation.valid) {
    throw new AppError(`Request validation failed: ${validation.errors.join(', ')}`, 400);
  }

  // Check if request accepts JSON
  if (!RequestHeaderUtils.acceptsJSON(request)) {
    throw new AppError('Request must accept JSON', 406);
  }

  const body = await request.json();
  const { email, password } = body;

  // Validate input
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Find user
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Generate token
  const token = generateToken(user.id, user.role);

  // Get client information
  const clientIP = RequestHeaderUtils.getClientIP(request);
  const userAgent = RequestHeaderUtils.getUserAgent(request);
  const acceptLanguage = RequestHeaderUtils.getAcceptLanguage(request);

  // Create response
  const response = headerUtils.createResponse({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token: token
    },
    metadata: {
      clientIP,
      userAgent,
      language: acceptLanguage,
      timestamp: new Date().toISOString()
    }
  });

  // Set security headers
  ResponseHeaderUtils.setNoCacheHeaders(response);
  response.headers.set('X-Auth-Status', 'authenticated');
  response.headers.set('X-User-Role', user.role);

  // Set authentication cookies
  const cookieHandler = new CookieHandler(authCookieConfig);

  // Set auth token cookie
  cookieHandler.setCookie(response, 'authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });

  // Set user info cookie (non-sensitive data)
  cookieHandler.setCookie(response, 'userInfo', JSON.stringify({
    id: user.id,
    name: user.name,
    role: user.role
  }), {
    httpOnly: false, // Accessible by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  });

  // Set session cookie
  cookieHandler.setCookie(response, 'sessionId', `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  });

  return response;
};

// Logout handler
const logoutHandler = async (request: NextRequest) => {
  // Get client information
  const clientIP = RequestHeaderUtils.getClientIP(request);
  const userAgent = RequestHeaderUtils.getUserAgent(request);

  // Create response
  const response = headerUtils.createResponse({
    success: true,
    message: 'Logout successful',
    metadata: {
      clientIP,
      userAgent,
      timestamp: new Date().toISOString()
    }
  });

  // Set no-cache headers
  ResponseHeaderUtils.setNoCacheHeaders(response);

  // Clear authentication cookies
  const cookieHandler = new CookieHandler(authCookieConfig);

  cookieHandler.deleteCookie(response, 'authToken');
  cookieHandler.deleteCookie(response, 'userInfo');
  cookieHandler.deleteCookie(response, 'sessionId');

  return response;
};

// Verify token handler
const verifyHandler = async (request: NextRequest) => {
  // Get auth token from cookies or headers
  const authToken = request.cookies.get('authToken')?.value ||
                   request.headers.get('authorization')?.replace('Bearer ', '');

  if (!authToken) {
    throw new AppError('No authentication token provided', 401);
  }

  // Validate token
  const tokenData = validateToken(authToken);
  if (!tokenData) {
    throw new AppError('Invalid or expired token', 401);
  }

  // Find user
  const user = users.find(u => u.id === tokenData.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get client information
  const clientIP = RequestHeaderUtils.getClientIP(request);
  const userAgent = RequestHeaderUtils.getUserAgent(request);

  const response = headerUtils.createResponse({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      tokenData: {
        userId: tokenData.userId,
        role: tokenData.role
      }
    },
    metadata: {
      clientIP,
      userAgent,
      timestamp: new Date().toISOString()
    }
  });

  // Set security headers
  ResponseHeaderUtils.setNoCacheHeaders(response);
  response.headers.set('X-Auth-Status', 'valid');
  response.headers.set('X-User-Role', user.role);

  return response;
};

// Main handler
const authHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'login':
      return await loginHandler(request);
    case 'logout':
      return await logoutHandler(request);
    case 'verify':
      return await verifyHandler(request);
    default:
      throw new AppError('Invalid action. Use ?action=login, ?action=logout, or ?action=verify', 400);
  }
};

// Export handlers with middleware
export const POST = compose(
  withRequestValidation(),
  withLogging,
  withRateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
  withHeaders(authHeaderConfig),
  withCookies(authCookieConfig),
  withErrorHandler
)(authHandler);

// Handle OPTIONS for CORS preflight
export const OPTIONS = async (request: NextRequest) => {
  const response = new NextResponse(null, { status: 200 });

  // Assuming HeaderHandler is imported or defined elsewhere
  // const headerHandler = new HeaderHandler(authHeaderConfig);
  // return headerHandler.applyCorsHeaders(response, request);
  return response; // Placeholder for now
};
