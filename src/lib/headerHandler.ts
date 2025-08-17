import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './errorHandler';

// Header and cookie configuration interfaces
export interface HeaderConfig {
  security?: {
    enableHSTS?: boolean;
    enableCSP?: boolean;
    enableXFrameOptions?: boolean;
    enableXContentTypeOptions?: boolean;
    enableReferrerPolicy?: boolean;
    enablePermissionsPolicy?: boolean;
  };
  cors?: {
    origins?: string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
    maxAge?: number;
  };
  cache?: {
    enableETag?: boolean;
    maxAge?: number;
    staleWhileRevalidate?: number;
    cacheControl?: string;
  };
  compression?: {
    enableGzip?: boolean;
    enableBrotli?: boolean;
  };
}

export interface CookieConfig {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
  expires?: Date;
}

// Default configurations
export const defaultHeaderConfig: HeaderConfig = {
  security: {
    enableHSTS: true,
    enableCSP: true,
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true,
  },
  cors: {
    origins: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false,
    maxAge: 86400,
  },
  cache: {
    enableETag: true,
    maxAge: 300,
    staleWhileRevalidate: 60,
    cacheControl: 'public, max-age=300, stale-while-revalidate=60',
  },
  compression: {
    enableGzip: true,
    enableBrotli: true,
  },
};

export const defaultCookieConfig: CookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/',
};

// Header handler class
export class HeaderHandler {
  private config: HeaderConfig;

  constructor(config: HeaderConfig = {}) {
    this.config = { ...defaultHeaderConfig, ...config };
  }

  // Apply security headers
  applySecurityHeaders(response: NextResponse): NextResponse {
    const { security } = this.config;

    if (security?.enableHSTS) {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    if (security?.enableCSP) {
      response.headers.set('Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;"
      );
    }

    if (security?.enableXFrameOptions) {
      response.headers.set('X-Frame-Options', 'DENY');
    }

    if (security?.enableXContentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    if (security?.enableReferrerPolicy) {
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    if (security?.enablePermissionsPolicy) {
      response.headers.set('Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=()'
      );
    }

    // Additional security headers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-DNS-Prefetch-Control', 'off');

    return response;
  }

  // Apply CORS headers
  applyCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
    const { cors } = this.config;
    const origin = request.headers.get('origin');

    if (cors?.origins?.includes('*') || cors?.origins?.includes(origin || '')) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    }

    if (cors?.methods) {
      response.headers.set('Access-Control-Allow-Methods', cors.methods.join(', '));
    }

    if (cors?.headers) {
      response.headers.set('Access-Control-Allow-Headers', cors.headers.join(', '));
    }

    if (cors?.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (cors?.maxAge) {
      response.headers.set('Access-Control-Max-Age', cors.maxAge.toString());
    }

    return response;
  }

  // Apply cache headers
  applyCacheHeaders(response: NextResponse, etag?: string): NextResponse {
    const { cache } = this.config;

    if (cache?.enableETag && etag) {
      response.headers.set('ETag', etag);
    }

    if (cache?.cacheControl) {
      response.headers.set('Cache-Control', cache.cacheControl);
    } else if (cache?.maxAge) {
      const cacheControl = `public, max-age=${cache.maxAge}`;
      if (cache.staleWhileRevalidate) {
        cacheControl += `, stale-while-revalidate=${cache.staleWhileRevalidate}`;
      }
      response.headers.set('Cache-Control', cacheControl);
    }

    return response;
  }

  // Apply compression headers
  applyCompressionHeaders(response: NextResponse): NextResponse {
    const { compression } = this.config;

    if (compression?.enableGzip) {
      response.headers.set('Content-Encoding', 'gzip');
    } else if (compression?.enableBrotli) {
      response.headers.set('Content-Encoding', 'br');
    }

    return response;
  }

  // Apply all headers
  applyAllHeaders(response: NextResponse, request: NextRequest, etag?: string): NextResponse {
    response = this.applySecurityHeaders(response);
    response = this.applyCorsHeaders(response, request);
    response = this.applyCacheHeaders(response, etag);
    response = this.applyCompressionHeaders(response);
    return response;
  }

  // Generate ETag for content
  generateETag(content: string): string {
    const crypto = require('crypto');
    return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
  }

  // Check if content has changed
  checkETag(request: NextRequest, etag: string): boolean {
    const ifNoneMatch = request.headers.get('if-none-match');
    return ifNoneMatch === etag;
  }
}

// Cookie handler class
export class CookieHandler {
  private config: CookieConfig;

  constructor(config: CookieConfig = {}) {
    this.config = { ...defaultCookieConfig, ...config };
  }

  // Set a cookie
  setCookie(response: NextResponse, name: string, value: string, config?: CookieConfig): NextResponse {
    const cookieConfig = { ...this.config, ...config };
    const cookieParts = [`${name}=${encodeURIComponent(value)}`];

    if (cookieConfig.httpOnly) {
      cookieParts.push('HttpOnly');
    }

    if (cookieConfig.secure) {
      cookieParts.push('Secure');
    }

    if (cookieConfig.sameSite) {
      cookieParts.push(`SameSite=${cookieConfig.sameSite}`);
    }

    if (cookieConfig.maxAge) {
      cookieParts.push(`Max-Age=${cookieConfig.maxAge}`);
    }

    if (cookieConfig.path) {
      cookieParts.push(`Path=${cookieConfig.path}`);
    }

    if (cookieConfig.domain) {
      cookieParts.push(`Domain=${cookieConfig.domain}`);
    }

    if (cookieConfig.expires) {
      cookieParts.push(`Expires=${cookieConfig.expires.toUTCString()}`);
    }

    response.headers.append('Set-Cookie', cookieParts.join('; '));
    return response;
  }

  // Get a cookie value
  getCookie(request: NextRequest, name: string): string | undefined {
    return request.cookies.get(name)?.value;
  }

  // Delete a cookie
  deleteCookie(response: NextResponse, name: string, config?: CookieConfig): NextResponse {
    const deleteConfig = {
      ...this.config,
      ...config,
      maxAge: 0,
      expires: new Date(0),
    };

    return this.setCookie(response, name, '', deleteConfig);
  }

  // Set multiple cookies
  setCookies(response: NextResponse, cookies: Record<string, { value: string; config?: CookieConfig }>): NextResponse {
    Object.entries(cookies).forEach(([name, { value, config }]) => {
      this.setCookie(response, name, value, config);
    });
    return response;
  }

  // Get all cookies
  getAllCookies(request: NextRequest): Record<string, string> {
    const cookies: Record<string, string> = {};
    request.cookies.getAll().forEach(cookie => {
      cookies[cookie.name] = cookie.value;
    });
    return cookies;
  }

  // Validate cookie value
  validateCookie(value: string, pattern?: RegExp): boolean {
    if (!value) return false;
    if (pattern) return pattern.test(value);
    return value.length > 0 && value.length <= 4096; // RFC 6265 limit
  }
}

// Request header utilities
export class RequestHeaderUtils {
  // Get client IP address
  static getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           request.headers.get('x-client-ip') ||
           'unknown';
  }

  // Get user agent
  static getUserAgent(request: NextRequest): string {
    return request.headers.get('user-agent') || 'unknown';
  }

  // Get accept language
  static getAcceptLanguage(request: NextRequest): string {
    return request.headers.get('accept-language') || 'en';
  }

  // Get content type
  static getContentType(request: NextRequest): string {
    return request.headers.get('content-type') || 'application/json';
  }

  // Check if request is AJAX
  static isAjaxRequest(request: NextRequest): boolean {
    return request.headers.get('x-requested-with') === 'XMLHttpRequest' ||
           request.headers.get('accept')?.includes('application/json');
  }

  // Check if request accepts JSON
  static acceptsJSON(request: NextRequest): boolean {
    const accept = request.headers.get('accept') || '';
    return accept.includes('application/json') || accept.includes('*/*');
  }

  // Get request size
  static getRequestSize(request: NextRequest): number {
    const contentLength = request.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  }

  // Validate request headers
  static validateHeaders(request: NextRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Check content length
    const size = this.getRequestSize(request);
    if (size > maxSize) {
      errors.push(`Request too large: ${size} bytes (max: ${maxSize})`);
    }

    // Check content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = this.getContentType(request);
      if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
        errors.push(`Invalid content type: ${contentType}`);
      }
    }

    // Check user agent
    const userAgent = this.getUserAgent(request);
    if (userAgent === 'unknown' || userAgent.length < 10) {
      errors.push('Invalid or missing user agent');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Response header utilities
export class ResponseHeaderUtils {
  // Set common response headers
  static setCommonHeaders(response: NextResponse, request: NextRequest): NextResponse {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
    response.headers.set('X-Powered-By', 'Next.js E-Commerce API');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;
  }

  // Set rate limit headers
  static setRateLimitHeaders(
    response: NextResponse,
    limit: number,
    remaining: number,
    resetTime: number
  ): NextResponse {
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());
    return response;
  }

  // Set pagination headers
  static setPaginationHeaders(
    response: NextResponse,
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsPerPage: number
  ): NextResponse {
    response.headers.set('X-Pagination-Current-Page', currentPage.toString());
    response.headers.set('X-Pagination-Total-Pages', totalPages.toString());
    response.headers.set('X-Pagination-Total-Items', totalItems.toString());
    response.headers.set('X-Pagination-Items-Per-Page', itemsPerPage.toString());
    return response;
  }

  // Set cache headers
  static setCacheHeaders(
    response: NextResponse,
    maxAge: number = 300,
    staleWhileRevalidate: number = 60
  ): NextResponse {
    response.headers.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
    return response;
  }

  // Set no-cache headers
  static setNoCacheHeaders(response: NextResponse): NextResponse {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }
}

// Middleware for header handling
export function withHeaders(config?: HeaderConfig) {
  const headerHandler = new HeaderHandler(config);

  return function <T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const response = await handler(request, ...args);
      return headerHandler.applyAllHeaders(response, request);
    };
  };
}

// Middleware for cookie handling
export function withCookies(config?: CookieConfig) {
  const cookieHandler = new CookieHandler(config);

  return function <T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const response = await handler(request, ...args);

      // Add cookie handler to response for easy access
      (response as any).cookieHandler = cookieHandler;

      return response;
    };
  };
}

// Middleware for request validation
export function withRequestValidation() {
  return function <T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const validation = RequestHeaderUtils.validateHeaders(request);

      if (!validation.valid) {
        throw new AppError(
          `Request validation failed: ${validation.errors.join(', ')}`,
          400,
          'INVALID_REQUEST_HEADERS'
        );
      }

      return handler(request, ...args);
    };
  };
}

// Utility functions
export const headerUtils = {
  // Create a response with proper headers
  createResponse: (data: any, status: number = 200, headers?: Record<string, string>): NextResponse => {
    const response = NextResponse.json(data, { status });

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  },

  // Create a redirect response
  createRedirect: (url: string, status: number = 302): NextResponse => {
    return NextResponse.redirect(url, status);
  },

  // Create a file response
  createFileResponse: (file: Buffer, filename: string, contentType: string): NextResponse => {
    const response = new NextResponse(file);
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    return response;
  },

  // Parse authorization header
  parseAuthorization: (request: NextRequest): { type: string; token: string } | null => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return { type, token };
  },

  // Get preferred language
  getPreferredLanguage: (request: NextRequest): string => {
    const acceptLanguage = request.headers.get('accept-language');
    if (!acceptLanguage) return 'en';

    const languages = acceptLanguage.split(',').map(lang => {
      const [code, quality = '1'] = lang.trim().split(';q=');
      return { code: code.split('-')[0], quality: parseFloat(quality) };
    });

    languages.sort((a, b) => b.quality - a.quality);
    return languages[0]?.code || 'en';
  }
};
