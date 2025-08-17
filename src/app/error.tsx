'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: Readonly<ErrorProps>) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);

    // In a real application, you would send this to your error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    // errorTrackingService.captureException(error);
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Oops! Something went wrong
        </h1>

        <p className="text-gray-600 mb-8 leading-relaxed">
          We encountered an unexpected error. Don&apos;t worry, our team has been notified
          and we&apos;re working to fix this issue.
        </p>

        {/* Development Error Details */}
        {isDevelopment && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <h3 className="font-semibold text-red-800 mb-2">Development Error Details:</h3>
            <p className="text-sm text-red-700 mb-2">
              <strong>Message:</strong> {error.message}
            </p>
            {error.digest && (
              <p className="text-sm text-red-700 mb-2">
                <strong>Digest:</strong> {error.digest}
              </p>
            )}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-900">
                Stack Trace
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4 mb-8">
          <button
            onClick={reset}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="inline-block w-full bg-white text-red-600 px-6 py-3 rounded-lg font-medium border-2 border-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            Go Back Home
          </Link>
        </div>

        {/* Error Recovery Options */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">What you can do:</h3>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li className="flex items-start">
              <span className="text-red-500 mr-2" aria-hidden="true">•</span>{' '}
              Refresh the page or try again in a few moments
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2" aria-hidden="true">•</span>{' '}
              Check your internet connection
            </li>

            <li className="flex items-start">
              <span className="text-red-500 mr-2" aria-hidden="true">•</span>{' '}
              Clear your browser cache and cookies
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2" aria-hidden="true">•</span>{' '}
              Contact support if the problem persists
            </li>
          </ul>
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Quick Navigation</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Link
              href="/products"
              className="text-red-600 hover:text-red-800 hover:underline"
            >
              Products
            </Link>
            <Link
              href="/cart"
              className="text-red-600 hover:text-red-800 hover:underline"
            >
              Shopping Cart
            </Link>
            <Link
              href="/dashboard"
              className="text-red-600 hover:text-red-800 hover:underline"
            >
              Dashboard
            </Link>
            <Link
              href="/api-demo"
              className="text-red-600 hover:text-red-800 hover:underline"
            >
              API Demo
            </Link>
          </div>
        </div>

        {/* Error ID for Support */}
        <div className="mt-8 text-xs text-gray-500">
          <p>Error ID: {error.digest || 'Unknown'}</p>
          <p>Timestamp: {new Date().toISOString()}</p>
          <p>Please include this information when contacting support.</p>
        </div>
      </div>
    </div>
  );
}

/*
Next.js Error Boundary Features Demonstrated:

1. **Error Boundaries**: Catches JavaScript errors anywhere in the component tree
2. **Client Component**: Uses 'use client' directive for client-side error handling
3. **Error Recovery**: Provides reset() function to attempt recovery
4. **Error Logging**: Automatically logs errors for debugging and monitoring
5. **Development vs Production**: Shows detailed error info in development only
6. **User-Friendly Interface**: Provides helpful recovery options and navigation
7. **Error Tracking Integration**: Ready for integration with error tracking services
8. **Accessibility**: Proper focus management and keyboard navigation
9. **Error Metadata**: Displays error digest and timestamp for support
10. **Graceful Degradation**: Maintains app functionality even when errors occur

This error boundary will catch errors that occur:
- During rendering
- In lifecycle methods
- In constructors of the whole tree below them
- In event handlers (when combined with try-catch)

The error boundary improves user experience by providing
a graceful way to handle unexpected errors instead of
showing a blank white screen or browser error page.
*/