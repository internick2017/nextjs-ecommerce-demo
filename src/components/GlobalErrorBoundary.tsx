'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { globalErrorHandler, GlobalErrorEvent } from '../lib/globalErrorHandler';
import { getErrorBoundaryProps, canRetryError, getRetryDelay } from '../lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onGlobalError?: (event: GlobalErrorEvent) => void;
  enableGlobalErrorHandling?: boolean;
  showErrorDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
  isRetrying: boolean;
  lastRetryTime: number | null;
  globalErrorStats: {
    errorCount: number;
    sessionId: string;
    isInitialized: boolean;
  };
}

class GlobalErrorBoundary extends Component<Props, State> {
  private globalErrorListener: ((event: CustomEvent) => void) | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false,
      lastRetryTime: null,
      globalErrorStats: {
        errorCount: 0,
        sessionId: '',
        isInitialized: false
      }
    };
  }

  componentDidMount() {
    // Initialize global error handling
    if (this.props.enableGlobalErrorHandling !== false) {
      globalErrorHandler.init();

      // Listen for global error events
      this.globalErrorListener = (event: CustomEvent) => {
        const globalError = event.detail as GlobalErrorEvent;

        // Call custom handler if provided
        if (this.props.onGlobalError) {
          this.props.onGlobalError(globalError);
        }

        // Update error stats
        this.setState({
          globalErrorStats: globalErrorHandler.getErrorStats()
        });

        // Handle critical errors that should trigger the error boundary
        if (this.shouldTriggerErrorBoundary(globalError)) {
          this.setState({
            hasError: true,
            error: globalError.error instanceof Error ? globalError.error : new Error(String(globalError.error)),
            errorId: `GLOBAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
        }
      };

      window.addEventListener('globalError', this.globalErrorListener as EventListener);
    }

    // Update initial stats
    this.setState({
      globalErrorStats: globalErrorHandler.getErrorStats()
    });
  }

  componentWillUnmount() {
    // Clean up global error listener
    if (this.globalErrorListener) {
      window.removeEventListener('globalError', this.globalErrorListener as EventListener);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `BOUNDARY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Report error to global error handler
    globalErrorHandler.reportError(error, {
      component: 'GlobalErrorBoundary',
      errorInfo: errorInfo.componentStack
    });
  }

  private shouldTriggerErrorBoundary(globalError: GlobalErrorEvent): boolean {
    // Only trigger error boundary for certain types of errors
    const criticalErrorTypes = ['error', 'unhandledrejection'];
    const criticalErrorMessages = [
      'Script error',
      'NetworkError',
      'TypeError',
      'ReferenceError',
      'SyntaxError'
    ];

    return (
      criticalErrorTypes.includes(globalError.type) ||
      criticalErrorMessages.some(msg =>
        globalError.message?.includes(msg) ||
        (globalError.error instanceof Error && globalError.error.message.includes(msg))
      )
    );
  }

  handleRetry = async () => {
    const { retryCount, error } = this.state;
    const maxRetries = 3;

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

  handleReload = () => {
    window.location.reload();
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

      const { error, errorId, retryCount, isRetrying, lastRetryTime, globalErrorStats } = this.state;
      const { showErrorDetails = process.env.NODE_ENV === 'development' } = this.props;

      const errorProps = error ? getErrorBoundaryProps(error) : null;
      const canRetry = error && canRetryError(error) && retryCount < 3;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            {/* Error Header */}
            <div className="text-center mb-8">
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

              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {errorProps?.title || 'Application Error'}
              </h1>

              <p className="text-lg text-gray-600 mb-6">
                {errorProps?.message || 'We encountered an unexpected error. Our team has been notified.'}
              </p>

              {/* Error ID and Session Info */}
              <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">Error ID:</p>
                    <p className="text-gray-600 font-mono">{errorId}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Session ID:</p>
                    <p className="text-gray-600 font-mono">{globalErrorStats.sessionId}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Total Errors:</p>
                    <p className="text-gray-600">{globalErrorStats.errorCount}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Retry Attempts:</p>
                    <p className="text-gray-600">{retryCount}</p>
                  </div>
                </div>
              </div>

              {/* Retry Information */}
              {retryCount > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Retry attempt {retryCount} of 3
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Retry Button */}
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRetrying ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Retrying...
                    </div>
                  ) : (
                    'Try Again'
                  )}
                </button>
              )}

              {/* Reset Button */}
              <button
                onClick={this.handleReset}
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reset Application
              </button>

              {/* Reload Button */}
              <button
                onClick={this.handleReload}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Reload Page
              </button>

              {/* Go Home Button */}
              <button
                onClick={this.handleGoHome}
                className="w-full bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border-2 border-gray-300 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Go to Home
              </button>
            </div>

            {/* Error Details (Development Only) */}
            {showErrorDetails && isDevelopment && error && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Error Details (Development Only)</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Error Message:</p>
                    <p className="text-gray-600 font-mono bg-gray-100 p-2 rounded">{error.message}</p>
                  </div>

                  {errorProps?.errorDetails && (
                    <>
                      <div>
                        <p className="font-medium text-gray-700">Severity:</p>
                        <p className="text-gray-600">{errorProps.errorDetails.severity}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Category:</p>
                        <p className="text-gray-600">{errorProps.errorDetails.category}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Recoverable:</p>
                        <p className="text-gray-600">{errorProps.errorDetails.recoverable ? 'Yes' : 'No'}</p>
                      </div>
                    </>
                  )}

                  <div>
                    <p className="font-medium text-gray-700">Stack Trace:</p>
                    <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Recovery Strategy Information */}
            {errorProps?.recoveryStrategy && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                <h4 className="font-medium text-green-800 mb-2">Recovery Strategy</h4>
                <p className="text-sm text-green-700">
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
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">What you can do:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2" aria-hidden="true">•</span>
                    Try the retry button above
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2" aria-hidden="true">•</span>
                    Refresh the page
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2" aria-hidden="true">•</span>
                    Clear your browser cache
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2" aria-hidden="true">•</span>
                    Contact support if the problem persists
                  </li>
                </ul>
              </div>
            </div>

            {/* Support Information */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>If you continue to experience issues, please contact our support team.</p>
              <p className="mt-1">Include the Error ID and Session ID above for faster assistance.</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;

// Hook for functional components to access global error handler
export const useGlobalErrorHandler = () => {
  const reportError = React.useCallback((error: Error | string, context?: any) => {
    globalErrorHandler.reportError(error, context);
  }, []);

  const getStats = React.useCallback(() => {
    return globalErrorHandler.getErrorStats();
  }, []);

  return { reportError, getStats };
};

// Higher-order component for wrapping components with global error boundary
export const withGlobalErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    enableGlobalErrorHandling?: boolean;
    showErrorDetails?: boolean;
  }
) => {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary {...options}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );

  WrappedComponent.displayName = `withGlobalErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
