import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './errorHandler';
import { RequestHeaderUtils } from './headerHandler';
import { redirectUtils } from './redirectHandler';

// Middleware types
export enum MiddlewareType {
  AUTH = 'auth',
  GUEST = 'guest',
  ADMIN = 'admin',
  RATE_LIMIT = 'rate_limit',
  VALIDATION = 'validation',
  CORS = 'cors',
  LOGGING = 'logging'
}

// Middleware configuration
export interface MiddlewareConfig {
  type: MiddlewareType;
  options?: Record<string, any>;
  redirectTo?: string;
  excludePaths?: string[];
  includePaths?: string[];
}

// Authentication middleware configuration
export interface AuthMiddlewareConfig {
  requireAuth: boolean;
  roles?: string[];
  permissions?: string[];
  redirectTo?: string;
  allowGuest?: boolean;
  sessionTimeout?: number;
}

// Guest middleware configuration (for login/register pages)
export interface GuestMiddlewareConfig {
  redirectIfAuthenticated?: string;
  allowPartialAuth?: boolean;
  requireGuest: boolean;
}

// Route protection configuration
export interface RouteProtectionConfig {
  auth?: AuthMiddlewareConfig;
  guest?: GuestMiddlewareConfig;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
    skipSuccessfulRequests?: boolean;
  };
  validation?: {
    requiredHeaders?: string[];
    requiredQueryParams?: string[];
    maxBodySize?: number;
  };
  cors?: {
    origins: string[];
    methods: string[];
    credentials: boolean;
  };
}

// Session interface
export interface Session {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  expiresAt: number;
  lastActivity: number;
}

// Mock session storage (replace with real implementation)
class SessionManager {
  private sessions = new Map<string, Session>();

  async getSession(token: string): Promise<Session | null> {
    const session = this.sessions.get(token);

    if (!session) return null;

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    // Update last activity
    session.lastActivity = Date.now();
    this.sessions.set(token, session);

    return session;
  }

  async createSession(userId: string, email: string, role: string, permissions: string[] = []): Promise<string> {
    const token = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const session: Session = {
      userId,
      email,
      role,
      permissions,
      expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours
      lastActivity: now
    };

    this.sessions.set(token, session);
    return token;
  }

  async invalidateSession(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }

  async updateSession(token: string, updates: Partial<Session>): Promise<boolean> {
    const session = this.sessions.get(token);
    if (!session) return false;

    Object.assign(session, updates);
    this.sessions.set(token, session);
    return true;
  }
}

// Global session manager instance
const sessionManager = new SessionManager();

// Authentication middleware
export function withAuth(config: AuthMiddlewareConfig = { requireAuth: true }) {
  return function <T extends unknown[]>(
    handler: (request: NextRequest, session: Session, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const token = request.cookies.get('authToken')?.value ||
                   request.headers.get('authorization')?.replace('Bearer ', '');

      // If authentication is not required, continue without session
      if (!config.requireAuth) {
        const session = token ? await sessionManager.getSession(token) : null;
        return handler(request, session as any, ...args);
      }

      // Authentication is required
      if (!token) {
        if (config.redirectTo) {
          return redirectUtils.temporary(config.redirectTo);
        }
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const session = await sessionManager.getSession(token);
      if (!session) {
        if (config.redirectTo) {
          return redirectUtils.temporary(config.redirectTo);
        }
        throw new AppError('Invalid or expired session', 401, 'INVALID_SESSION');
      }

      // Check role requirements
      if (config.roles && !config.roles.includes(session.role)) {
        throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // Check permission requirements
      if (config.permissions && !config.permissions.every(permission => session.permissions.includes(permission))) {
        throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      return handler(request, session, ...args);
    };
  };
}

// Guest middleware (for login/register pages)
export function withGuest(config: GuestMiddlewareConfig = { requireGuest: true }) {
  return function <T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const token = request.cookies.get('authToken')?.value ||
                   request.headers.get('authorization')?.replace('Bearer ', '');

      if (token) {
        const session = await sessionManager.getSession(token);

        // If user is authenticated and guest access is not allowed
        if (session && config.requireGuest) {
          if (config.redirectIfAuthenticated) {
            return redirectUtils.temporary(config.redirectIfAuthenticated);
          }
          throw new AppError('Already authenticated', 403, 'ALREADY_AUTHENTICATED');
        }
      }

      return handler(request, ...args);
    };
  };
}

// Rate limiting middleware
export function withRateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return function <T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const identifier = RequestHeaderUtils.getClientIP(request);
      const now = Date.now();
      const userRequests = requests.get(identifier);

      if (!userRequests || now > userRequests.resetTime) {
        requests.set(identifier, { count: 1, resetTime: now + windowMs });
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
    };
  };
}

// Validation middleware
export function withValidation(config: {
  requiredHeaders?: string[];
  requiredQueryParams?: string[];
  maxBodySize?: number;
  validateContentType?: boolean;
} = {}) {
  return function <T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      // Validate required headers
      if (config.requiredHeaders) {
        for (const header of config.requiredHeaders) {
          if (!request.headers.get(header)) {
            throw new AppError(`Missing required header: ${header}`, 400, 'MISSING_HEADER');
          }
        }
      }

      // Validate required query parameters
      if (config.requiredQueryParams) {
        const url = new URL(request.url);
        for (const param of config.requiredQueryParams) {
          if (!url.searchParams.has(param)) {
            throw new AppError(`Missing required query parameter: ${param}`, 400, 'MISSING_QUERY_PARAM');
          }
        }
      }

      // Validate body size
      if (config.maxBodySize) {
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > config.maxBodySize) {
          throw new AppError(`Request body too large. Maximum size: ${config.maxBodySize} bytes`, 413, 'PAYLOAD_TOO_LARGE');
        }
      }

      // Validate content type for POST/PUT requests
      if (config.validateContentType && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new AppError('Invalid content type. Expected application/json', 400, 'INVALID_CONTENT_TYPE');
        }
      }

      return handler(request, ...args);
    };
  };
}

// CORS middleware
export function withCors(origins: string[] = ['*'], methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
  return function <T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
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
    };
  };
}

// Logging middleware
export function withLogging(handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>) {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;
    const userAgent = RequestHeaderUtils.getUserAgent(request);
    const ip = RequestHeaderUtils.getClientIP(request);

    console.log(`🌐 ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);

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
  };
}

// Compose multiple middlewares
export function compose<T extends unknown[]>(
  ...middlewares: Array<(handler: (request: NextRequest, ...args: T) => Promise<NextResponse>) => (request: NextRequest, ...args: T) => Promise<NextResponse>>
) {
  return (handler: (request: NextRequest, ...args: T) => Promise<NextResponse>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

// Route protection utility
export function protectRoute(config: RouteProtectionConfig) {
  const middlewares: any[] = [];

  // Add authentication middleware
  if (config.auth) {
    middlewares.push(withAuth(config.auth));
  }

  // Add guest middleware
  if (config.guest) {
    middlewares.push(withGuest(config.guest));
  }

  // Add rate limiting middleware
  if (config.rateLimit) {
    middlewares.push(withRateLimit(config.rateLimit.maxRequests, config.rateLimit.windowMs));
  }

  // Add validation middleware
  if (config.validation) {
    middlewares.push(withValidation(config.validation));
  }

  // Add CORS middleware
  if (config.cors) {
    middlewares.push(withCors(config.cors.origins, config.cors.methods));
  }

  // Add logging middleware
  middlewares.push(withLogging);

  return compose(...middlewares);
}

// Session utilities
export const sessionUtils = {
  // Get current session
  getSession: async (request: NextRequest): Promise<Session | null> => {
    const token = request.cookies.get('authToken')?.value ||
                 request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) return null;

    return await sessionManager.getSession(token);
  },

  // Create session
  createSession: async (userId: string, email: string, role: string, permissions: string[] = []): Promise<string> => {
    return await sessionManager.createSession(userId, email, role, permissions);
  },

  // Invalidate session
  invalidateSession: async (token: string): Promise<boolean> => {
    return await sessionManager.invalidateSession(token);
  },

  // Update session
  updateSession: async (token: string, updates: Partial<Session>): Promise<boolean> => {
    return await sessionManager.updateSession(token, updates);
  },

  // Check if user has permission
  hasPermission: (session: Session, permission: string): boolean => {
    return session.permissions.includes(permission);
  },

  // Check if user has role
  hasRole: (session: Session, role: string): boolean => {
    return session.role === role;
  },

  // Check if user has any of the roles
  hasAnyRole: (session: Session, roles: string[]): boolean => {
    return roles.includes(session.role);
  }
};

// Export session manager for direct access
export { sessionManager };
