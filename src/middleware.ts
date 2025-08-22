import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Create route matchers for public and ignored routes
const isPublicRoute = createRouteMatcher([
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
]);

const isIgnoredRoute = createRouteMatcher([
  '/api/webhook/clerk',
  '/api/webhook/stripe',
  '/_next/(.*)',
  '/favicon.ico',
]);

// Export the middleware using clerkMiddleware
export default clerkMiddleware((auth, req) => {
  // Add custom headers for all requests
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-middleware-cache', 'no-cache');
  
  // Handle ignored routes (no authentication check)
  if (isIgnoredRoute(req)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Handle public routes (no authentication required)
  if (isPublicRoute(req)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Handle protected routes (authentication required)
  if (!auth.userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // User is authenticated, allow access to protected routes
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
