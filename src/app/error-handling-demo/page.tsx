'use client';

import { useState } from 'react';
import { useErrorHandler } from '../../components/ErrorBoundary';
import { withErrorBoundary } from '../../components/ErrorBoundary';
import {
  ValidationError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  DatabaseError
} from '../../lib/errorHandler';

interface ErrorDemoState {
  isLoading: boolean;
  result: string;
  error: string | null;
  retryCount: number;
}

function ErrorHandlingDemo() {
  const [state, setState] = useState<ErrorDemoState>({
    isLoading: false,
    result: '',
    error: null,
    retryCount: 0
  });

  const { handleError } = useErrorHandler();

  const simulateError = async (errorType: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, result: '' }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Throw different types of errors based on the type
      switch (errorType) {
        case 'validation':
          throw new ValidationError('Invalid form data', {
            field: 'email',
            value: 'invalid-email',
            type: 'email_format'
          });

        case 'network':
          throw new NetworkError('Failed to connect to server');

        case 'not-found':
          throw new NotFoundError('User profile');

        case 'rate-limit':
          throw new RateLimitError('Too many requests', 30);

        case 'database':
          throw new DatabaseError('Database connection failed');

        case 'api':
          // Simulate API error by calling the error demo endpoint
          const response = await fetch('/api/error-demo?type=validation');
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API Error');
          }
          const data = await response.json();
          setState(prev => ({ ...prev, result: JSON.stringify(data, null, 2) }));
          break;

        case 'timeout':
          // Simulate timeout
          await new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 3000)
          );
          break;

        case 'retry':
          // Simulate retryable error
          if (state.retryCount < 3) {
            setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
            throw new NetworkError('Temporary network issue');
          }
          setState(prev => ({ ...prev, result: 'Success after retries!' }));
          break;

        default:
          throw new Error('Unknown error type');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));

      // Log error with retry logic
      await handleError(error as Error, {
        errorType,
        retryCount: state.retryCount,
        component: 'ErrorHandlingDemo'
      }, {
        maxRetries: 3,
        retryDelay: 1000,
        onRetry: (attempt, err) => {
          console.log(`Retry attempt ${attempt} for error:`, err.message);
        }
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const resetState = () => {
    setState({
      isLoading: false,
      result: '',
      error: null,
      retryCount: 0
    });
  };

  const errorTypes = [
    { type: 'validation', label: 'Validation Error', description: 'Invalid input data' },
    { type: 'network', label: 'Network Error', description: 'Connection issues' },
    { type: 'not-found', label: 'Not Found Error', description: 'Resource not found' },
    { type: 'rate-limit', label: 'Rate Limit Error', description: 'Too many requests' },
    { type: 'database', label: 'Database Error', description: 'Database connection failed' },
    { type: 'api', label: 'API Error', description: 'Real API error from endpoint' },
    { type: 'timeout', label: 'Timeout Error', description: 'Request timeout' },
    { type: 'retry', label: 'Retry Error', description: 'Error with retry logic' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Error Handling Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test different error scenarios and see how they are handled
          </p>
        </div>

        {/* Error Type Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Error Types
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {errorTypes.map(({ type, label, description }) => (
              <button
                key={type}
                onClick={() => simulateError(type)}
                disabled={state.isLoading}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <h3 className="font-medium text-gray-900 mb-1">{label}</h3>
                <p className="text-sm text-gray-600">{description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Status and Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Current Status
            </h2>

            <div className="space-y-4">
              {/* Loading State */}
              {state.isLoading && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Processing...</span>
                </div>
              )}

              {/* Retry Count */}
              {state.retryCount > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    Retry attempts: {state.retryCount}
                  </p>
                </div>
              )}

              {/* Error Display */}
              {state.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="font-medium text-red-800 mb-2">Error Occurred</h3>
                  <p className="text-sm text-red-700">{state.error}</p>
                </div>
              )}

              {/* Success Result */}
              {state.result && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-medium text-green-800 mb-2">Success</h3>
                  <pre className="text-sm text-green-700 whitespace-pre-wrap">
                    {state.result}
                  </pre>
                </div>
              )}

              {/* Reset Button */}
              {(state.error || state.result) && (
                <button
                  onClick={resetState}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Reset State
                </button>
              )}
            </div>
          </div>

          {/* Error Handling Features */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Error Handling Features
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Error Categorization</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Validation errors (400)</li>
                  <li>• Authentication errors (401)</li>
                  <li>• Authorization errors (403)</li>
                  <li>• Network errors (0)</li>
                  <li>• Database errors (500)</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-medium text-green-800 mb-2">Recovery Strategies</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Automatic retry with exponential backoff</li>
                  <li>• User-friendly error messages</li>
                  <li>• Error logging and tracking</li>
                  <li>• Graceful degradation</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="font-medium text-yellow-800 mb-2">Error Boundaries</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Component-level error isolation</li>
                  <li>• Automatic error recovery</li>
                  <li>• Fallback UI components</li>
                  <li>• Error reporting integration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Error Handling Best Practices */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Error Handling Best Practices
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Client-Side</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use error boundaries for component isolation</li>
                <li>• Implement retry logic for transient errors</li>
                <li>• Show user-friendly error messages</li>
                <li>• Log errors for debugging</li>
                <li>• Provide recovery options</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Server-Side</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Validate all inputs</li>
                <li>• Use appropriate HTTP status codes</li>
                <li>• Implement rate limiting</li>
                <li>• Log errors with context</li>
                <li>• Return structured error responses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap the component with error boundary
export default withErrorBoundary(ErrorHandlingDemo, {
  maxRetries: 3,
  retryDelay: 1000,
  showRetryButton: true,
  showErrorDetails: process.env.NODE_ENV === 'development'
});
