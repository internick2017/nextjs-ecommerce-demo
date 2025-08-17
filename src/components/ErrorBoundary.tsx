'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorLogger, handleClientError, getErrorBoundaryProps, canRetryError, getRetryDelay } from '../lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number;
  showRetryButton?: boolean;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
  isRetrying: boolean;
  lastRetryTime: number | null;
}

class ErrorBoundary extends Component<Props, State> {
  private errorLogger: ErrorLogger;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false,
      lastRetryTime: null
    };
    this.errorLogger = new ErrorLogger();
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    this.errorLogger.logError(error, {
      component: 'ErrorBoundary',
      errorInfo,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount
    });

    // Handle client error
    handleClientError(error, {
      component: 'ErrorBoundary',
      errorInfo,
      errorId: this.state.errorId
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = async () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount, error } = this.state;

    if (!error || retryCount >= maxRetries) {
      return;
    }

    // Check if error is retryable
    if (!canRetryError(error)) {
      this.setState({ hasError: false, error: null, errorId: null, retryCount: 0 });
      return;
    }

    this.setState({ isRetrying: true, lastRetryTime: Date.now() });

    try {
      // Wait for retry delay with exponential backoff
      const delay = getRetryDelay(error, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Reset error state to retry
      this.setState({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: retryCount + 1,
        isRetrying: false
      });
    } catch (retryError) {
      this.setState({ isRetrying: false });
      console.error('Retry failed:', retryError);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false,
      lastRetryTime: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId, retryCount, isRetrying, lastRetryTime } = this.state;
      const { maxRetries = 3, showRetryButton = true, showErrorDetails = process.env.NODE_ENV === 'development' } = this.props;

      const errorProps = error ? getErrorBoundaryProps(error) : null;
      const canRetry = error && canRetryError(error) && retryCount < maxRetries;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto h-12 w-12 text-red-500 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              {/* Error Title */}
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                {errorProps?.title || 'Something went wrong'}
              </h2>

              {/* Error Message */}
              <p className="mt-2 text-sm text-gray-600">
                {errorProps?.message || 'We apologize for the inconvenience. An unexpected error has occurred.'}
              </p>

              {/* Error ID */}
              {errorId && (
                <p className="mt-2 text-xs text-gray-500">
                  Error ID: {errorId}
                </p>
              )}

              {/* Retry Information */}
              {retryCount > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    Retry attempt {retryCount} of {maxRetries}
                  </p>
                  {lastRetryTime && (
                    <p className="text-xs text-blue-600 mt-1">
                      Last retry: {new Date(lastRetryTime).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Retry Button */}
              {showRetryButton && canRetry && (
                <button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRetrying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Retrying...
                    </>
                  ) : (
                    'Try Again'
                  )}
                </button>
              )}

              {/* Reset Button */}
              <button
                onClick={this.handleReset}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset Component
              </button>

              {/* Go Home Button */}
              <button
                onClick={this.handleGoHome}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Home
              </button>
            </div>

            {/* Error Details (Development Only) */}
            {showErrorDetails && isDevelopment && error && (
              <details className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <summary className="cursor-pointer text-sm font-medium text-red-800">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 text-xs text-red-700 space-y-2">
                  <div>
                    <p className="font-semibold">Error Message:</p>
                    <p className="mb-2">{error.message}</p>
                  </div>

                  {errorProps?.errorDetails && (
                    <>
                      <div>
                        <p className="font-semibold">Severity:</p>
                        <p>{errorProps.errorDetails.severity}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Category:</p>
                        <p>{errorProps.errorDetails.category}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Recoverable:</p>
                        <p>{errorProps.errorDetails.recoverable ? 'Yes' : 'No'}</p>
                      </div>
                    </>
                  )}

                  <div>
                    <p className="font-semibold">Stack Trace:</p>
                    <pre className="whitespace-pre-wrap text-xs mt-1 bg-red-100 p-2 rounded">
                      {error.stack}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            {/* Recovery Strategy Information */}
            {errorProps?.recoveryStrategy && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <h4 className="text-sm font-medium text-green-800 mb-1">
                  Recovery Strategy
                </h4>
                <p className="text-xs text-green-700">
                  Type: {errorProps.recoveryStrategy.type}
                  {errorProps.recoveryStrategy.message && (
                    <span className="block mt-1">
                      {errorProps.recoveryStrategy.message}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Help Information */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Try refreshing the page</p>
                <p>• Check your internet connection</p>
                <p>• Clear your browser cache</p>
                <p>• Contact support if the problem persists</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Hook for functional components to handle errors with retry logic
export const useErrorHandler = () => {
  const errorLogger = new ErrorLogger();

  const handleError = React.useCallback(async (
    error: Error,
    context?: Record<string, unknown>,
    retryOptions?: {
      maxRetries?: number;
      retryDelay?: number;
      onRetry?: (attempt: number, error: Error) => void;
    }
  ) => {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    errorLogger.logError(error, {
      ...context,
      errorId,
      component: 'useErrorHandler'
    });

    handleClientError(error, {
      ...context,
      errorId
    });

    // Handle retry logic if provided
    if (retryOptions && canRetryError(error)) {
      const { maxRetries = 3, retryDelay = 1000, onRetry } = retryOptions;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (onRetry) {
          onRetry(attempt, error);
        }

        if (attempt < maxRetries) {
          const delay = getRetryDelay(error, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return errorId;
  }, [errorLogger]);

  return { handleError };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    maxRetries?: number;
    retryDelay?: number;
    showRetryButton?: boolean;
    showErrorDetails?: boolean;
  }
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Error boundary for specific error types
export const withSpecificErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorTypes: string[],
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary
      fallback={fallback}
      onError={(error) => {
        // Only handle specific error types
        if (errorTypes.includes(error.name) || errorTypes.includes(error.message)) {
          console.error('Specific error caught:', error);
        }
      }}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withSpecificErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};