import { NextRequest, NextResponse } from 'next/server';
import { AppError, createApiErrorResponse, ErrorLogger } from './errorHandler';

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// API Route Handler Wrapper
export function withErrorHandler<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const logger = ErrorLogger.getInstance();

    try {
      // Add request ID to headers for tracking
      const response = await handler(request, ...args);
      
      // Add request tracking headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
      
      return response;
    } catch (error) {
      // Log the error with context
      await logger.logError(error as Error, {
        requestId,
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        responseTime: `${Date.now() - startTime}ms`,
      });

      // Create standardized error response
      const errorResponse = createApiErrorResponse(error as Error, requestId);
      const statusCode = error instanceof AppError ? error.statusCode : 500;

      return NextResponse.json(errorResponse, { 
        status: statusCode,
        headers: {
          'X-Request-ID': requestId,
          'X-Response-Time': `${Date.now() - startTime}ms`,
        },
      });
    }
  };
}

// Validation middleware
export function withValidation<T>(
  schema: (data: unknown) => T,
  handler: (request: NextRequest, validatedData: T, ...args: unknown[]) => Promise<NextResponse>
) {
  return withErrorHandler(async (request: NextRequest, ...args: unknown[]) => {
    try {
      const body = await request.json();
      const validatedData = schema(body);
      return await handler(request, validatedData, ...args);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new AppError('Invalid JSON format', 400, 'INVALID_JSON');
      }
      throw error;
    }
  });
}

// Rate limiting middleware
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return function <T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return withErrorHandler(async (request: NextRequest, ...args: T) => {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      const now = Date.now();
      const userRequests = requests.get(ip);

      if (!userRequests || now > userRequests.resetTime) {
        // Reset or initialize
        requests.set(ip, { count: 1, resetTime: now + windowMs });
      } else {
        userRequests.count++;
        
        if (userRequests.count > maxRequests) {
          throw new AppError(
            `Rate limit exceeded. Try again in ${Math.ceil((userRequests.resetTime - now) / 1000)} seconds`,
            429,
            'RATE_LIMIT_EXCEEDED'
          );
        }
      }

      const response = await handler(request, ...args);
      
      // Add rate limit headers
      const remaining = Math.max(0, maxRequests - (userRequests?.count || 0));
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', (userRequests?.resetTime || now + windowMs).toString());
      
      return response;
    });
  };
}

// Authentication middleware
export function withAuth(
  handler: (request: NextRequest, userId: string, ...args: unknown[]) => Promise<NextResponse>
) {
  return withErrorHandler(async (request: NextRequest, ...args: unknown[]) => {
    const authToken = request.cookies.get('authToken')?.value ||
                     request.headers.get('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Mock token validation (replace with actual JWT validation)
    const userId = validateAuthToken(authToken);
    
    if (!userId) {
      throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }

    return await handler(request, userId, ...args);
  });
}

// Mock token validation (replace with actual implementation)
function validateAuthToken(token: string): string | null {
  // In a real app, you would:
  // 1. Verify JWT signature
  // 2. Check expiration
  // 3. Validate against database
  // 4. Return user ID or null
  
  if (token === 'demo-token' || token === 'admin-token') {
    return token === 'admin-token' ? 'admin-user' : 'demo-user';
  }
  
  return null;
}

// CORS middleware
export function withCors(
  origins: string[] = ['*'],
  methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
) {
  return function <T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return withErrorHandler(async (request: NextRequest, ...args: T) => {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': origins.includes('*') ? '*' : origins.join(', '),
            'Access-Control-Allow-Methods': methods.join(', '),
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      const response = await handler(request, ...args);
      
      // Add CORS headers to response
      response.headers.set('Access-Control-Allow-Origin', origins.includes('*') ? '*' : origins.join(', '));
      response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      return response;
    });
  };
}

// Logging middleware
export function withLogging(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>
) {
  return withErrorHandler(async (request: NextRequest, ...args: unknown[]) => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers.get('user-agent');
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

    console.log(`🌐 ${method} ${url} - IP: ${ip}`);

    try {
      const response = await handler(request, ...args);
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${method} ${url} ${response.status} in ${duration}ms`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const statusCode = error instanceof AppError ? error.statusCode : 500;
      
      console.error(`❌ ${method} ${url} ${statusCode} in ${duration}ms - ${(error as Error).message}`);
      
      throw error;
    }
  });
}

// Compose multiple middlewares
export function compose<T extends unknown[]>(
  ...middlewares: Array<(handler: (request: NextRequest, ...args: T) => Promise<NextResponse>) => (request: NextRequest, ...args: T) => Promise<NextResponse>>
) {
  return (handler: (request: NextRequest, ...args: T) => Promise<NextResponse>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}