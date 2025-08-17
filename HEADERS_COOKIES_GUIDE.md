# Headers & Cookies Handling System Guide

This document provides a comprehensive guide to the headers and cookies handling system implemented in the Next.js e-commerce application.

## Overview

The headers and cookies handling system provides robust, secure, and configurable management of HTTP headers and cookies across all API routes. It includes security headers, CORS configuration, caching strategies, and secure cookie management.

## Architecture

### Core Components

1. **HeaderHandler** (`src/lib/headerHandler.ts`)
   - Security headers management
   - CORS configuration
   - Cache control
   - Compression headers
   - ETag generation and validation

2. **CookieHandler** (`src/lib/headerHandler.ts`)
   - Secure cookie management
   - Cookie validation
   - HttpOnly, Secure, SameSite configuration
   - Cookie expiration and domain management

3. **RequestHeaderUtils** (`src/lib/headerHandler.ts`)
   - Client IP detection
   - User agent parsing
   - Request validation
   - Content type checking

4. **ResponseHeaderUtils** (`src/lib/headerHandler.ts`)
   - Common response headers
   - Rate limit headers
   - Pagination headers
   - Cache control headers

## Security Headers

### HSTS (HTTP Strict Transport Security)
```typescript
response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
```
Forces HTTPS connections and prevents protocol downgrade attacks.

### CSP (Content Security Policy)
```typescript
response.headers.set('Content-Security-Policy',
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;"
);
```
Prevents XSS attacks by controlling resource loading.

### X-Frame-Options
```typescript
response.headers.set('X-Frame-Options', 'DENY');
```
Prevents clickjacking attacks by controlling iframe embedding.

### X-Content-Type-Options
```typescript
response.headers.set('X-Content-Type-Options', 'nosniff');
```
Prevents MIME type sniffing attacks.

### Referrer Policy
```typescript
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
```
Controls referrer information in requests.

### Permissions Policy
```typescript
response.headers.set('Permissions-Policy',
  'camera=(), microphone=(), geolocation=(), payment=()'
);
```
Controls browser feature access.

## CORS Configuration

### Basic CORS Setup
```typescript
const corsConfig = {
  origins: ['http://localhost:3000', 'https://yourdomain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
};
```

### CORS Headers Applied
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`
- `Access-Control-Allow-Credentials`
- `Access-Control-Max-Age`

## Cookie Management

### Secure Cookie Configuration
```typescript
const cookieConfig = {
  httpOnly: true,           // Prevents XSS access
  secure: true,             // HTTPS only in production
  sameSite: 'strict',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/',                // Cookie scope
  domain: '.yourdomain.com' // Domain restriction
};
```

### Setting Cookies
```typescript
const cookieHandler = new CookieHandler(config);

// Set a single cookie
cookieHandler.setCookie(response, 'authToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60
});

// Set multiple cookies
cookieHandler.setCookies(response, {
  'authToken': { value: token, config: { httpOnly: true } },
  'userInfo': { value: JSON.stringify(userInfo), config: { httpOnly: false } }
});
```

### Reading Cookies
```typescript
// Get a specific cookie
const authToken = cookieHandler.getCookie(request, 'authToken');

// Get all cookies
const allCookies = cookieHandler.getAllCookies(request);
```

### Deleting Cookies
```typescript
// Delete a cookie
cookieHandler.deleteCookie(response, 'authToken');

// Delete with specific config
cookieHandler.deleteCookie(response, 'authToken', {
  path: '/',
  domain: '.yourdomain.com'
});
```

## Cache Control

### Cache Headers
```typescript
// Set cache headers
ResponseHeaderUtils.setCacheHeaders(response, 300, 60);

// Set no-cache headers
ResponseHeaderUtils.setNoCacheHeaders(response);
```

### ETag Support
```typescript
const headerHandler = new HeaderHandler(config);

// Generate ETag
const etag = headerHandler.generateETag(JSON.stringify(data));

// Check if content changed
if (headerHandler.checkETag(request, etag)) {
  return new NextResponse(null, { status: 304 });
}

// Set ETag header
response.headers.set('ETag', etag);
```

## Request Validation

### Header Validation
```typescript
const validation = RequestHeaderUtils.validateHeaders(request);

if (!validation.valid) {
  throw new AppError(`Request validation failed: ${validation.errors.join(', ')}`, 400);
}
```

### Validation Checks
- Content length limits (10MB default)
- Content type validation for POST/PUT requests
- User agent validation
- Request size validation

### Client Information
```typescript
const clientIP = RequestHeaderUtils.getClientIP(request);
const userAgent = RequestHeaderUtils.getUserAgent(request);
const acceptLanguage = RequestHeaderUtils.getAcceptLanguage(request);
const contentType = RequestHeaderUtils.getContentType(request);
```

## Response Headers

### Common Headers
```typescript
ResponseHeaderUtils.setCommonHeaders(response, request);
```
Sets:
- `X-Request-ID`
- `X-Response-Time`
- `X-Powered-By`
- `X-Content-Type-Options`

### Rate Limit Headers
```typescript
ResponseHeaderUtils.setRateLimitHeaders(response, limit, remaining, resetTime);
```
Sets:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### Pagination Headers
```typescript
ResponseHeaderUtils.setPaginationHeaders(response, currentPage, totalPages, totalItems, itemsPerPage);
```
Sets:
- `X-Pagination-Current-Page`
- `X-Pagination-Total-Pages`
- `X-Pagination-Total-Items`
- `X-Pagination-Items-Per-Page`

## Middleware Integration

### Header Middleware
```typescript
const handler = withHeaders({
  security: {
    enableHSTS: true,
    enableCSP: true,
    enableXFrameOptions: true,
  },
  cors: {
    origins: ['http://localhost:3000'],
    credentials: true,
  },
  cache: {
    maxAge: 300,
    staleWhileRevalidate: 60,
  }
})(yourHandler);
```

### Cookie Middleware
```typescript
const handler = withCookies({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60
})(yourHandler);
```

### Request Validation Middleware
```typescript
const handler = withRequestValidation()(yourHandler);
```

## Configuration Options

### HeaderConfig Interface
```typescript
interface HeaderConfig {
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
```

### CookieConfig Interface
```typescript
interface CookieConfig {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
  expires?: Date;
}
```

## Authentication Example

### Login Handler
```typescript
const loginHandler = async (request: NextRequest) => {
  // Validate request
  const validation = RequestHeaderUtils.validateHeaders(request);
  if (!validation.valid) {
    throw new AppError(`Request validation failed: ${validation.errors.join(', ')}`, 400);
  }

  // Process login
  const { email, password } = await request.json();
  const user = await authenticateUser(email, password);
  const token = generateToken(user.id);

  // Create response
  const response = headerUtils.createResponse({
    success: true,
    message: 'Login successful',
    data: { user, token }
  });

  // Set security headers
  ResponseHeaderUtils.setNoCacheHeaders(response);

  // Set authentication cookies
  const cookieHandler = new CookieHandler({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  cookieHandler.setCookie(response, 'authToken', token, {
    maxAge: 7 * 24 * 60 * 60
  });

  cookieHandler.setCookie(response, 'userInfo', JSON.stringify({
    id: user.id,
    name: user.name,
    role: user.role
  }), {
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60
  });

  return response;
};
```

## Utility Functions

### Response Creation
```typescript
// Create JSON response
const response = headerUtils.createResponse(data, 200, {
  'X-Custom-Header': 'value'
});

// Create redirect response
const redirect = headerUtils.createRedirect('/dashboard', 302);

// Create file response
const fileResponse = headerUtils.createFileResponse(
  fileBuffer,
  'document.pdf',
  'application/pdf'
);
```

### Authorization Parsing
```typescript
const auth = headerUtils.parseAuthorization(request);
// Returns: { type: 'Bearer', token: 'abc123' } or null
```

### Language Detection
```typescript
const language = headerUtils.getPreferredLanguage(request);
// Returns preferred language code (e.g., 'en', 'es', 'fr')
```

## Best Practices

### Security
1. **Always use HttpOnly for sensitive cookies**
2. **Enable Secure flag in production**
3. **Use SameSite=strict for authentication cookies**
4. **Implement proper CORS policies**
5. **Set appropriate security headers**

### Performance
1. **Use ETags for caching**
2. **Implement proper cache control**
3. **Set appropriate max-age values**
4. **Use compression when possible**

### Validation
1. **Validate all request headers**
2. **Check content length limits**
3. **Validate cookie values**
4. **Implement rate limiting**

### Monitoring
1. **Log client information**
2. **Track request/response times**
3. **Monitor rate limit usage**
4. **Track authentication events**

## Testing

### Using the Demo Page
1. Navigate to `/headers-cookies-demo`
2. Test authentication endpoints
3. Test CRUD operations
4. Monitor response headers
5. Manage cookies interactively

### Manual Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookies.txt

# Test with cookies
curl -X POST http://localhost:3000/api/auth?action=verify \
  -b cookies.txt

# Test CORS
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3000/api/auth
```

## Integration with CRUD Routes

The headers and cookies system is automatically integrated with CRUD routes:

```typescript
export const { GET, POST, PUT, PATCH, DELETE } = createCrudRoutes<User>(
  userOperations,
  'User',
  ['email', 'name', 'role'],
  {
    enableAuth: true,
    enableCors: true,
    enableRequestValidation: true,
    headers: {
      security: { enableHSTS: true, enableCSP: true },
      cache: { maxAge: 300 }
    },
    cookies: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  }
);
```

## Conclusion

The headers and cookies handling system provides a comprehensive, secure, and performant solution for managing HTTP headers and cookies in Next.js API routes. It includes built-in security features, caching strategies, and validation mechanisms that follow web security best practices.

For more information, refer to the demo page at `/headers-cookies-demo` and the individual component documentation.
