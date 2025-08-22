import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    '/',
    '/products',
    '/products/(.*)',
    '/api/products',
    '/api/products/(.*)',
    '/api/categories',
    '/api-demo',
    '/data-fetching-demo',
    '/server-actions-demo',
    '/database-operations-demo',
    '/error-handling-demo',
    '/global-error-demo',
    '/headers-cookies-demo',
    '/middleware-demo',
    '/optimistic-actions-demo',
    '/redirects-cache-demo',
    '/ssr-streaming-demo',
    '/suspense-rendering-demo',
    '/advanced-data-fetching-demo',
    '/context-forms-demo',
    '/crud-demo',
    '/params-demo',
    '/api/cache/(.*)',
    '/api/error-demo',
    '/api/database/(.*)',
    '/api/orders',
    '/api/reviews',
    '/api/users',
    '/api/cache/stats',
    '/api/cache/test',
  ],

  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [
    '/api/webhook/clerk',
    '/api/webhook/stripe',
    '/_next/(.*)',
    '/favicon.ico',
  ],

  // Optional: Customize the behavior for specific routes
  beforeAuth: (req) => {
    // Add custom headers or logging before authentication
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-middleware-cache', 'no-cache');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  },

  afterAuth: (auth, req) => {
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // If the user is logged in and trying to access a protected route, allow them to access route
    if (auth.userId && !auth.isPublicRoute) {
      return NextResponse.next();
    }

    // Allow users visiting public routes to access them
    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
