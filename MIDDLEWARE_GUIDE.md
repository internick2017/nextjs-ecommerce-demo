# Middleware System Guide

This document provides a comprehensive guide to the middleware system implemented in the Next.js e-commerce application for route validation, authentication, and protection.

## Overview

The middleware system provides robust route protection, authentication, validation, and security features for API routes and pages. It includes session management, role-based access control, rate limiting, and comprehensive validation.

## Architecture

### Core Components

1. **RouteMiddleware** (`src/lib/routeMiddleware.ts`)
   - Authentication middleware
   - Guest middleware (for login pages)
   - Rate limiting middleware
   - Validation middleware
   - CORS middleware
   - Logging middleware

2. **SessionManager**
   - Session creation and management
   - Token validation
   - Session expiration handling
   - Permission management

3. **Middleware Composition**
   - Flexible middleware chaining
   - Conditional middleware application
   - Configurable protection levels

## Authentication Middleware

### Basic Authentication
```typescript
import { withAuth } from '../../../lib/routeMiddleware';

const handler = withAuth({
  requireAuth: true,
  redirectTo: '/login'
})(yourHandler);
```

### Role-Based Access Control
```typescript
const handler = withAuth({
  requireAuth: true,
  roles: ['admin', 'moderator'],
  permissions: ['read', 'write']
})(yourHandler);
```

### Optional Authentication
```typescript
const handler = withAuth({
  requireAuth: false,
  allowGuest: true
})(yourHandler);
```

### Configuration Options
```typescript
interface AuthMiddlewareConfig {
  requireAuth: boolean;           // Require authentication
  roles?: string[];              // Allowed roles
  permissions?: string[];        // Required permissions
  redirectTo?: string;           // Redirect URL if not authenticated
  allowGuest?: boolean;          // Allow guest access
  sessionTimeout?: number;       // Session timeout in milliseconds
}
```

## Guest Middleware

### Login Page Protection
```typescript
import { withGuest } from '../../../lib/routeMiddleware';

const handler = withGuest({
  requireGuest: true,
  redirectIfAuthenticated: '/dashboard'
})(yourHandler);
```

### Configuration Options
```typescript
interface GuestMiddlewareConfig {
  redirectIfAuthenticated?: string;  // Redirect if already authenticated
  allowPartialAuth?: boolean;        // Allow partial authentication
  requireGuest: boolean;             // Require guest status
}
```

## Rate Limiting Middleware

### Basic Rate Limiting
```typescript
import { withRateLimit } from '../../../lib/routeMiddleware';

const handler = withRateLimit(100, 15 * 60 * 1000)(yourHandler);
// 100 requests per 15 minutes
```

### Advanced Rate Limiting
```typescript
const handler = withRateLimit(
  50,                    // maxRequests
  5 * 60 * 1000,        // windowMs (5 minutes)
  true                   // skipSuccessfulRequests
)(yourHandler);
```

### Rate Limit Headers
The middleware automatically adds rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

## Validation Middleware

### Request Validation
```typescript
import { withValidation } from '../../../lib/routeMiddleware';

const handler = withValidation({
  requiredHeaders: ['content-type', 'authorization'],
  requiredQueryParams: ['action', 'id'],
  maxBodySize: 1024 * 1024, // 1MB
  validateContentType: true
})(yourHandler);
```

### Validation Options
```typescript
interface ValidationConfig {
  requiredHeaders?: string[];        // Required request headers
  requiredQueryParams?: string[];    // Required query parameters
  maxBodySize?: number;              // Maximum body size in bytes
  validateContentType?: boolean;     // Validate content type for POST/PUT
}
```

## CORS Middleware

### Basic CORS
```typescript
import { withCors } from '../../../lib/routeMiddleware';

const handler = withCors()(yourHandler);
```

### Custom CORS Configuration
```typescript
const handler = withCors(
  ['http://localhost:3000', 'https://yourdomain.com'], // origins
  ['GET', 'POST', 'PUT', 'DELETE']                     // methods
)(yourHandler);
```

## Logging Middleware

### Request Logging
```typescript
import { withLogging } from '../../../lib/routeMiddleware';

const handler = withLogging(yourHandler);
```

### Logged Information
- Request method and URL
- Client IP address
- User agent
- Response status and timing
- Error details

## Session Management

### Session Interface
```typescript
interface Session {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  expiresAt: number;
  lastActivity: number;
}
```

### Session Utilities
```typescript
import { sessionUtils } from '../../../lib/routeMiddleware';

// Get current session
const session = await sessionUtils.getSession(request);

// Create session
const token = await sessionUtils.createSession(userId, email, role, permissions);

// Invalidate session
await sessionUtils.invalidateSession(token);

// Update session
await sessionUtils.updateSession(token, { permissions: ['read', 'write'] });

// Check permissions
const hasPermission = sessionUtils.hasPermission(session, 'admin');
const hasRole = sessionUtils.hasRole(session, 'admin');
const hasAnyRole = sessionUtils.hasAnyRole(session, ['admin', 'moderator']);
```

## Middleware Composition

### Compose Multiple Middlewares
```typescript
import { compose } from '../../../lib/routeMiddleware';

const handler = compose(
  withAuth({ requireAuth: true, roles: ['admin'] }),
  withRateLimit(100, 15 * 60 * 1000),
  withValidation({ validateContentType: true }),
  withCors(['http://localhost:3000']),
  withLogging
)(yourHandler);
```

### Route Protection Utility
```typescript
import { protectRoute } from '../../../lib/routeMiddleware';

const handler = protectRoute({
  auth: {
    requireAuth: true,
    roles: ['user', 'admin'],
    permissions: ['read']
  },
  rateLimit: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000
  },
  validation: {
    requiredHeaders: ['content-type'],
    validateContentType: true
  },
  cors: {
    origins: ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
})(yourHandler);
```

## API Route Examples

### Protected API Route
```typescript
// src/app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRateLimit, withValidation, Session } from '../../../lib/routeMiddleware';
import { headerUtils } from '../../../lib/headerHandler';

const protectedHandler = async (request: NextRequest, session: Session) => {
  return headerUtils.createResponse({
    success: true,
    data: {
      user: {
        id: session.userId,
        email: session.email,
        role: session.role
      }
    }
  });
};

export const GET = withAuth({
  requireAuth: true,
  roles: ['user', 'admin']
})(
  withRateLimit(100, 15 * 60 * 1000)(
    withValidation({
      requiredQueryParams: ['action']
    })(protectedHandler)
  )
);
```

### Login API Route
```typescript
// src/app/api/auth/route.ts
import { withGuest, withRateLimit, withValidation } from '../../../lib/routeMiddleware';

const loginHandler = async (request: NextRequest) => {
  // Login logic here
};

export const POST = compose(
  withGuest({ requireGuest: true, redirectIfAuthenticated: '/dashboard' }),
  withRateLimit(10, 15 * 60 * 1000), // 10 login attempts per 15 minutes
  withValidation({
    requiredHeaders: ['content-type'],
    validateContentType: true,
    maxBodySize: 1024 * 1024
  })
)(loginHandler);
```

## Page Protection Examples

### Protected Page
```typescript
// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth?action=verify', {
          credentials: 'include'
        });

        if (!response.ok) {
          router.push('/login');
          return;
        }

        const data = await response.json();
        setUser(data.data.user);
      } catch (err) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}!</p>
    </div>
  );
};

export default DashboardPage;
```

### Login Page with Guest Protection
```typescript
// src/app/(auth)/login/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth?action=verify', {
          credentials: 'include'
        });

        if (response.ok) {
          router.push('/dashboard');
        }
      } catch (err) {
        // User not authenticated, stay on login page
      }
    };

    checkAuth();
  }, [router]);

  // Login form logic here
};
```

## Error Handling

### Authentication Errors
```typescript
// 401 Unauthorized
throw new AppError('Authentication required', 401, 'UNAUTHORIZED');

// 403 Forbidden
throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');

// 429 Too Many Requests
throw new AppError('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
```

### Validation Errors
```typescript
// 400 Bad Request
throw new AppError('Missing required header: content-type', 400, 'MISSING_HEADER');
throw new AppError('Invalid content type. Expected application/json', 400, 'INVALID_CONTENT_TYPE');
throw new AppError('Request body too large', 413, 'PAYLOAD_TOO_LARGE');
```

## Best Practices

### Security
1. **Always validate input** - Use validation middleware for all inputs
2. **Implement rate limiting** - Prevent abuse and DDoS attacks
3. **Use HTTPS** - Ensure secure communication
4. **Validate sessions** - Check session expiration and validity
5. **Implement proper CORS** - Control cross-origin requests

### Performance
1. **Optimize middleware order** - Place most restrictive middleware first
2. **Use caching** - Cache authentication results when appropriate
3. **Monitor rate limits** - Track and adjust rate limiting based on usage
4. **Log efficiently** - Avoid logging sensitive information

### User Experience
1. **Provide clear error messages** - Help users understand what went wrong
2. **Implement graceful redirects** - Redirect users to appropriate pages
3. **Handle loading states** - Show loading indicators during authentication
4. **Maintain session state** - Keep users logged in appropriately

## Testing

### Using the Demo Page
1. Navigate to `/middleware-demo`
2. Test authentication flows
3. Test rate limiting
4. Test validation rules
5. Monitor response headers

### Manual Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookies.txt

# Test protected route
curl -X GET http://localhost:3000/api/protected?action=info \
  -b cookies.txt

# Test rate limiting
for i in {1..10}; do
  curl -X GET http://localhost:3000/api/protected?action=info -b cookies.txt
done
```

## Configuration

### Environment Variables
```env
# Session configuration
SESSION_SECRET=your-secret-key
SESSION_TIMEOUT=86400000

# Rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Production Considerations
1. **Use secure session storage** - Redis or database instead of memory
2. **Implement session persistence** - Survive server restarts
3. **Add monitoring** - Track authentication and rate limiting metrics
4. **Configure proper CORS** - Restrict origins to production domains
5. **Use HTTPS** - Ensure all communication is encrypted

## Conclusion

The middleware system provides comprehensive route protection and validation capabilities. It includes authentication, authorization, rate limiting, validation, and logging features that can be easily composed and configured for different use cases.

For more information, refer to the demo page at `/middleware-demo` and the individual component documentation.
