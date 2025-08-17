import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ErrorLogger } from "./lib/errorHandler";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();
  const errorLogger = new ErrorLogger();
  
  try {
    // Get authentication token from cookies or headers
    const authToken =
      request.cookies.get("authToken")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    // Generate request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Protected routes that require authentication
    const protectedRoutes = ["/dashboard", "/admin"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // API routes that require authentication
    const protectedApiRoutes = ["/api/admin", "/api/dashboard"];
    const isProtectedApiRoute = protectedApiRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Admin-only routes
    const adminRoutes = ["/admin"];
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

    // Check if user is authenticated for protected routes
    if (isProtectedRoute && !authToken) {
      errorLogger.logError(new Error('Unauthorized access to protected route'), {
        pathname,
        requestId,
        type: 'authentication_error'
      });
      
      // Redirect to login page for web routes
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check authentication for protected API routes
    if (isProtectedApiRoute && !authToken) {
      errorLogger.logError(new Error('Unauthorized API access'), {
        pathname,
        requestId,
        type: 'authentication_error'
      });
      
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required", requestId },
        { status: 401 }
      );
    }

    // Mock user role check (in a real app, you'd decode the JWT token)
    const mockUserRole = getUserRoleFromToken(authToken);

    // Check admin access for admin routes
    if (isAdminRoute && mockUserRole !== "admin") {
      errorLogger.logError(new Error('Forbidden admin access'), {
        pathname,
        userRole: mockUserRole,
        requestId,
        type: 'authorization_error'
      });
      
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden", message: "Admin access required", requestId },
          { status: 403 }
        );
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Add security headers
     const response = NextResponse.next();

    // Security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "origin-when-cross-origin");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    );
    response.headers.set("X-Request-ID", requestId);

    // Add custom headers for API routes
    if (pathname.startsWith("/api/")) {
      response.headers.set("X-API-Version", "1.0");
      response.headers.set("X-Powered-By", "Next.js E-Commerce");

      // CORS headers for API routes
      response.headers.set("Access-Control-Allow-Origin", "*");
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
    }

    // Rate limiting simulation (in production, use a proper rate limiting solution)
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Add rate limiting info to response headers
    response.headers.set("X-RateLimit-Limit", "100");
    response.headers.set("X-RateLimit-Remaining", "99");
    response.headers.set("X-RateLimit-Reset", String(Date.now() + 3600000));

    // Add performance timing
    const processingTime = Date.now() - startTime;
    response.headers.set("X-Processing-Time", `${processingTime}ms`);

    // Log request for analytics (in production, use proper logging)
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${pathname} - IP: ${ip} - ID: ${requestId} - Time: ${processingTime}ms`
    );

    return response;
  } catch (error) {
    // Log middleware errors
    errorLogger.logError(error as Error, {
      pathname,
      type: 'middleware_error',
      processingTime: Date.now() - startTime
    });
    
    // Return a generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request'
      },
      { status: 500 }
    );
  }
}

// Mock function to get user role from token
// In a real application, you would decode and verify the JWT token
function getUserRoleFromToken(token: string | undefined): string | null {
  if (!token) return null;

  // Mock token validation - in reality, you'd decode the JWT
  if (token === "mock-admin-token") return "admin";
  if (token === "mock-user-token") return "user";
  if (token === "mock-jwt-token") return "user"; // Default for demo

  return null;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

/*
Middleware Features Demonstrated:

1. **Route Protection**: Automatically redirect unauthenticated users from protected routes
2. **API Authentication**: Return 401 for protected API endpoints without valid tokens
3. **Role-based Access Control**: Check user roles for admin-only routes
4. **Security Headers**: Add security headers to all responses
5. **CORS Handling**: Set CORS headers for API routes
6. **Rate Limiting**: Basic rate limiting simulation with headers
7. **Request Logging**: Log all requests for analytics
8. **Custom Headers**: Add custom headers to identify API version
9. **Conditional Logic**: Different behavior for web routes vs API routes
10. **URL Manipulation**: Redirect with query parameters for better UX

This middleware runs on every request and demonstrates how Next.js middleware
can be used to implement cross-cutting concerns like authentication, security,
and request/response modification at the edge before reaching your application code.
*/
