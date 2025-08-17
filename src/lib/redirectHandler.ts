import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './errorHandler';

// Redirect types and status codes
export enum RedirectType {
  PERMANENT = 301,
  TEMPORARY = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308
}

// Redirect configuration interface
export interface RedirectConfig {
  type: RedirectType;
  preserveQuery?: boolean;
  preserveMethod?: boolean;
  addTracking?: boolean;
  cacheControl?: string;
  headers?: Record<string, string>;
}

// Redirect rule interface
export interface RedirectRule {
  pattern: string | RegExp;
  destination: string | ((request: NextRequest) => string);
  config?: RedirectConfig;
  priority?: number;
  conditions?: {
    userAgent?: string | RegExp;
    referer?: string | RegExp;
    queryParams?: Record<string, string>;
    headers?: Record<string, string>;
  };
}

// Redirect tracking interface
export interface RedirectTracking {
  originalUrl: string;
  destinationUrl: string;
  redirectType: RedirectType;
  timestamp: string;
  userAgent?: string;
  referer?: string;
  ip?: string;
  queryParams?: Record<string, string>;
}

// Default redirect configuration
export const defaultRedirectConfig: RedirectConfig = {
  type: RedirectType.TEMPORARY,
  preserveQuery: true,
  preserveMethod: false,
  addTracking: true,
  cacheControl: 'public, max-age=3600',
  headers: {}
};

// Redirect handler class
export class RedirectHandler {
  private rules: RedirectRule[] = [];
  private tracking: RedirectTracking[] = [];
  private maxTrackingEntries = 1000;

  constructor(rules: RedirectRule[] = []) {
    this.rules = rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  // Add a redirect rule
  addRule(rule: RedirectRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  // Add multiple redirect rules
  addRules(rules: RedirectRule[]): void {
    this.rules.push(...rules);
    this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  // Check if a request should be redirected
  shouldRedirect(request: NextRequest): { should: boolean; rule?: RedirectRule; destination?: string } {
    const url = new URL(request.url);
    const pathname = url.pathname;

    for (const rule of this.rules) {
      if (this.matchesRule(request, rule)) {
        const destination = typeof rule.destination === 'function'
          ? rule.destination(request)
          : rule.destination;

        return { should: true, rule, destination };
      }
    }

    return { should: false };
  }

  // Check if a request matches a redirect rule
  private matchesRule(request: NextRequest, rule: RedirectRule): boolean {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check pattern match
    const patternMatches = typeof rule.pattern === 'string'
      ? pathname === rule.pattern || pathname.startsWith(rule.pattern)
      : rule.pattern.test(pathname);

    if (!patternMatches) return false;

    // Check conditions
    if (rule.conditions) {
      const { userAgent, referer, queryParams, headers } = rule.conditions;

      // Check user agent
      if (userAgent) {
        const requestUserAgent = request.headers.get('user-agent') || '';
        const userAgentMatches = typeof userAgent === 'string'
          ? requestUserAgent.includes(userAgent)
          : userAgent.test(requestUserAgent);
        if (!userAgentMatches) return false;
      }

      // Check referer
      if (referer) {
        const requestReferer = request.headers.get('referer') || '';
        const refererMatches = typeof referer === 'string'
          ? requestReferer.includes(referer)
          : referer.test(requestReferer);
        if (!refererMatches) return false;
      }

      // Check query parameters
      if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
          if (url.searchParams.get(key) !== value) return false;
        }
      }

      // Check headers
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          if (request.headers.get(key) !== value) return false;
        }
      }
    }

    return true;
  }

  // Create a redirect response
  createRedirect(
    request: NextRequest,
    destination: string,
    config: RedirectConfig = defaultRedirectConfig
  ): NextResponse {
    const url = new URL(request.url);
    let redirectUrl = destination;

    // Preserve query parameters if configured
    if (config.preserveQuery && url.search) {
      const destinationUrl = new URL(redirectUrl, url.origin);
      url.searchParams.forEach((value, key) => {
        destinationUrl.searchParams.set(key, value);
      });
      redirectUrl = destinationUrl.toString();
    }

    // Add tracking parameters if configured
    if (config.addTracking) {
      const trackingUrl = new URL(redirectUrl);
      trackingUrl.searchParams.set('redirected', 'true');
      trackingUrl.searchParams.set('from', url.pathname);
      trackingUrl.searchParams.set('timestamp', Date.now().toString());
      redirectUrl = trackingUrl.toString();
    }

    // Create redirect response
    const response = NextResponse.redirect(redirectUrl, config.type);

    // Add custom headers
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    // Add cache control
    if (config.cacheControl) {
      response.headers.set('Cache-Control', config.cacheControl);
    }

    // Add redirect tracking headers
    response.headers.set('X-Redirect-From', url.pathname);
    response.headers.set('X-Redirect-To', destination);
    response.headers.set('X-Redirect-Type', config.type.toString());

    // Track the redirect
    this.trackRedirect(request, destination, config.type);

    return response;
  }

  // Track a redirect
  private trackRedirect(request: NextRequest, destination: string, type: RedirectType): void {
    const url = new URL(request.url);
    const tracking: RedirectTracking = {
      originalUrl: url.pathname,
      destinationUrl: destination,
      redirectType: type,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || undefined,
      referer: request.headers.get('referer') || undefined,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip') || undefined,
      queryParams: Object.fromEntries(url.searchParams.entries())
    };

    this.tracking.push(tracking);

    // Limit tracking entries
    if (this.tracking.length > this.maxTrackingEntries) {
      this.tracking = this.tracking.slice(-this.maxTrackingEntries);
    }
  }

  // Get redirect tracking data
  getTrackingData(): RedirectTracking[] {
    return [...this.tracking];
  }

  // Clear tracking data
  clearTrackingData(): void {
    this.tracking = [];
  }

  // Get redirect statistics
  getRedirectStats(): {
    totalRedirects: number;
    redirectsByType: Record<RedirectType, number>;
    redirectsByPath: Record<string, number>;
    recentRedirects: RedirectTracking[];
  } {
    const redirectsByType: Record<RedirectType, number> = {} as any;
    const redirectsByPath: Record<string, number> = {};

    this.tracking.forEach(redirect => {
      redirectsByType[redirect.redirectType] = (redirectsByType[redirect.redirectType] || 0) + 1;
      redirectsByPath[redirect.originalUrl] = (redirectsByPath[redirect.originalUrl] || 0) + 1;
    });

    return {
      totalRedirects: this.tracking.length,
      redirectsByType,
      redirectsByPath,
      recentRedirects: this.tracking.slice(-10)
    };
  }

  // Validate redirect URL
  static validateRedirectUrl(url: string, allowedDomains: string[] = []): boolean {
    try {
      const redirectUrl = new URL(url);

      // Check if it's a relative URL (always allowed)
      if (!redirectUrl.protocol) return true;

      // Check if it's a valid protocol
      if (!['http:', 'https:'].includes(redirectUrl.protocol)) return false;

      // Check domain restrictions
      if (allowedDomains.length > 0) {
        return allowedDomains.some(domain => redirectUrl.hostname === domain || redirectUrl.hostname.endsWith(`.${domain}`));
      }

      return true;
    } catch {
      return false;
    }
  }

  // Create common redirect rules
  static createCommonRules(): RedirectRule[] {
    return [
      // Remove trailing slashes
      {
        pattern: /^(.+)\/$/,
        destination: (request: NextRequest) => {
          const url = new URL(request.url);
          return url.pathname.slice(0, -1) + url.search;
        },
        config: { type: RedirectType.PERMANENT },
        priority: 100
      },

      // Force HTTPS in production
      {
        pattern: /^http:/,
        destination: (request: NextRequest) => {
          const url = new URL(request.url);
          return url.href.replace('http:', 'https:');
        },
        config: { type: RedirectType.PERMANENT },
        priority: 90,
        conditions: {
          userAgent: /^(?!.*bot|spider|crawl)/i
        }
      },

      // Redirect www to non-www
      {
        pattern: /^https:\/\/www\./,
        destination: (request: NextRequest) => {
          const url = new URL(request.url);
          return url.href.replace('www.', '');
        },
        config: { type: RedirectType.PERMANENT },
        priority: 80
      }
    ];
  }
}

// Middleware for handling redirects
export function withRedirects(rules: RedirectRule[] = []) {
  const redirectHandler = new RedirectHandler(rules);

  return function <T extends unknown[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      // Check if request should be redirected
      const redirectCheck = redirectHandler.shouldRedirect(request);

      if (redirectCheck.should && redirectCheck.destination) {
        return redirectHandler.createRedirect(
          request,
          redirectCheck.destination,
          redirectCheck.rule?.config
        );
      }

      // Continue with normal handler
      return handler(request, ...args);
    };
  };
}

// Utility functions for common redirects
export const redirectUtils = {
  // Permanent redirect
  permanent: (destination: string, preserveQuery = true): NextResponse => {
    const response = NextResponse.redirect(destination, RedirectType.PERMANENT);
    if (preserveQuery) {
      response.headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
    return response;
  },

  // Temporary redirect
  temporary: (destination: string, preserveQuery = true): NextResponse => {
    const response = NextResponse.redirect(destination, RedirectType.TEMPORARY);
    if (preserveQuery) {
      response.headers.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
    return response;
  },

  // See other (for POST redirects)
  seeOther: (destination: string): NextResponse => {
    return NextResponse.redirect(destination, RedirectType.SEE_OTHER);
  },

  // Not modified
  notModified: (etag?: string): NextResponse => {
    const response = new NextResponse(null, { status: RedirectType.NOT_MODIFIED });
    if (etag) {
      response.headers.set('ETag', etag);
    }
    return response;
  },

  // Temporary redirect (preserves method)
  temporaryPreserveMethod: (destination: string): NextResponse => {
    return NextResponse.redirect(destination, RedirectType.TEMPORARY_REDIRECT);
  },

  // Permanent redirect (preserves method)
  permanentPreserveMethod: (destination: string): NextResponse => {
    return NextResponse.redirect(destination, RedirectType.PERMANENT_REDIRECT);
  },

  // Conditional redirect
  conditional: (
    request: NextRequest,
    condition: boolean,
    destination: string,
    config: RedirectConfig = defaultRedirectConfig
  ): NextResponse | null => {
    if (condition) {
      const redirectHandler = new RedirectHandler();
      return redirectHandler.createRedirect(request, destination, config);
    }
    return null;
  },

  // Redirect with query preservation
  withQuery: (destination: string, query: Record<string, string>): string => {
    const url = new URL(destination);
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  },

  // Redirect with hash
  withHash: (destination: string, hash: string): string => {
    return `${destination}#${hash}`;
  }
};
