import { ErrorLogger, AppError, NetworkError } from './errorHandler';

// Global error handler configuration
export interface GlobalErrorConfig {
  enableGlobalErrorHandling?: boolean;
  enableUnhandledRejectionHandling?: boolean;
  enableNetworkErrorHandling?: boolean;
  enableConsoleErrorOverride?: boolean;
  enablePerformanceMonitoring?: boolean;
  errorReportingEndpoint?: string;
  maxErrorsPerMinute?: number;
  errorSamplingRate?: number; // 0-1, percentage of errors to report
}

// Global error context
export interface GlobalErrorContext {
  timestamp: string;
  url: string;
  userAgent: string;
  viewport: string;
  memory?: string;
  performance?: string;
  sessionId?: string;
  userId?: string;
}

// Error event types
export type ErrorEventType =
  | 'unhandledrejection'
  | 'error'
  | 'network'
  | 'console'
  | 'performance'
  | 'custom';

// Global error event
export interface GlobalErrorEvent {
  type: ErrorEventType;
  error: Error | string;
  context: GlobalErrorContext;
  stack?: string;
  source?: string;
  lineNumber?: number;
  columnNumber?: number;
  filename?: string;
  message?: string;
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private logger: ErrorLogger;
  private config: GlobalErrorConfig;
  private errorCount = 0;
  private lastErrorTime = 0;
  private sessionId: string;
  private isInitialized = false;

  private constructor(config: GlobalErrorConfig = {}) {
    this.logger = ErrorLogger.getInstance();
    this.config = {
      enableGlobalErrorHandling: true,
      enableUnhandledRejectionHandling: true,
      enableNetworkErrorHandling: true,
      enableConsoleErrorOverride: false,
      enablePerformanceMonitoring: true,
      maxErrorsPerMinute: 100,
      errorSamplingRate: 1.0,
      ...config
    };
    this.sessionId = this.generateSessionId();
  }

  static getInstance(config?: GlobalErrorConfig): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler(config);
    }
    return GlobalErrorHandler.instance;
  }

  // Initialize global error handling
  init(): void {
    if (this.isInitialized) {
      console.warn('GlobalErrorHandler already initialized');
      return;
    }

    if (this.config.enableGlobalErrorHandling) {
      this.setupGlobalErrorHandling();
    }

    if (this.config.enableUnhandledRejectionHandling) {
      this.setupUnhandledRejectionHandling();
    }

    if (this.config.enableNetworkErrorHandling) {
      this.setupNetworkErrorHandling();
    }

    if (this.config.enableConsoleErrorOverride) {
      this.setupConsoleErrorOverride();
    }

    if (this.config.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }

    this.isInitialized = true;
    console.log('🌐 Global error handling initialized');
  }

  // Setup global error event listener
  private setupGlobalErrorHandling(): void {
    window.addEventListener('error', (event) => {
      this.handleGlobalError({
        type: 'error',
        error: event.error || new Error(event.message),
        context: this.getGlobalContext(),
        stack: event.error?.stack,
        source: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        message: event.message
      });
    });
  }

  // Setup unhandled promise rejection handling
  private setupUnhandledRejectionHandling(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.handleGlobalError({
        type: 'unhandledrejection',
        error: event.reason,
        context: this.getGlobalContext(),
        stack: event.reason?.stack,
        message: event.reason?.message || String(event.reason)
      });
    });
  }

  // Setup network error monitoring
  private setupNetworkErrorHandling(): void {
    // Monitor fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        // Log failed requests
        if (!response.ok) {
          this.handleGlobalError({
            type: 'network',
            error: new NetworkError(`HTTP ${response.status}: ${response.statusText}`),
            context: this.getGlobalContext(),
            message: `Failed to fetch ${args[0]}`
          });
        }

        return response;
      } catch (error) {
        this.handleGlobalError({
          type: 'network',
          error: error as Error,
          context: this.getGlobalContext(),
          message: `Network error: ${(error as Error).message}`
        });
        throw error;
      }
    };

    // Monitor XMLHttpRequest errors
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(...args) {
      this.addEventListener('error', (event) => {
        GlobalErrorHandler.getInstance().handleGlobalError({
          type: 'network',
          error: new NetworkError('XMLHttpRequest failed'),
          context: GlobalErrorHandler.getInstance().getGlobalContext(),
          message: `XHR error for ${args[1]}`
        });
      });

      return originalXHROpen.apply(this, args);
    };
  }

  // Setup console error override
  private setupConsoleErrorOverride(): void {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Call original console.error
      originalConsoleError.apply(console, args);

      // Log to global error handler
      const errorMessage = args.map(arg =>
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' ');

      this.handleGlobalError({
        type: 'console',
        error: new Error(errorMessage),
        context: this.getGlobalContext(),
        message: errorMessage
      });
    };
  }

  // Setup performance monitoring
  private setupPerformanceMonitoring(): void {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.handleGlobalError({
                type: 'performance',
                error: new Error(`Long task detected: ${entry.duration}ms`),
                context: this.getGlobalContext(),
                message: `Performance issue: ${entry.name} took ${entry.duration}ms`
              });
            }
          }
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Performance monitoring not supported');
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          this.handleGlobalError({
            type: 'performance',
            error: new Error('High memory usage detected'),
            context: this.getGlobalContext(),
            message: `Memory usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  // Handle global error events
  private async handleGlobalError(event: GlobalErrorEvent): Promise<void> {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastErrorTime < 60000) { // Within 1 minute
      this.errorCount++;
      if (this.errorCount > (this.config.maxErrorsPerMinute || 100)) {
        return; // Skip logging
      }
    } else {
      this.errorCount = 1;
      this.lastErrorTime = now;
    }

    // Error sampling
    if (Math.random() > (this.config.errorSamplingRate || 1.0)) {
      return; // Skip based on sampling rate
    }

    // Create error details
    const errorDetails = {
      type: event.type,
      message: event.message || (event.error instanceof Error ? event.error.message : String(event.error)),
      stack: event.stack || (event.error instanceof Error ? event.error.stack : undefined),
      source: event.source,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      context: event.context,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };

    // Log error
    await this.logger.logError(
      event.error instanceof Error ? event.error : new Error(String(event.error)),
      errorDetails
    );

    // Send to error reporting service if configured
    if (this.config.errorReportingEndpoint) {
      this.sendToErrorReportingService(errorDetails);
    }

    // Trigger custom error handlers
    this.triggerCustomErrorHandlers(event);
  }

  // Get global context information
  private getGlobalContext(): GlobalErrorContext {
    const context: GlobalErrorContext = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      sessionId: this.sessionId
    };

    // Add memory information if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      context.memory = JSON.stringify({
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      });
    }

    // Add performance information
    if ('performance' in window) {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perf) {
        context.performance = JSON.stringify({
          loadTime: perf.loadEventEnd - perf.loadEventStart,
          domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
          firstPaint: (performance.getEntriesByName('first-paint')[0] as PerformanceEntry)?.startTime,
          firstContentfulPaint: (performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry)?.startTime
        });
      }
    }

    return context;
  }

  // Send error to reporting service
  private async sendToErrorReportingService(errorDetails: any): Promise<void> {
    try {
      await fetch(this.config.errorReportingEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails),
      });
    } catch (error) {
      console.warn('Failed to send error to reporting service:', error);
    }
  }

  // Trigger custom error handlers
  private triggerCustomErrorHandlers(event: GlobalErrorEvent): void {
    // Dispatch custom event for other parts of the app to listen to
    const customEvent = new CustomEvent('globalError', {
      detail: event
    });
    window.dispatchEvent(customEvent);
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Manual error reporting
  reportError(error: Error | string, context?: Partial<GlobalErrorContext>): void {
    this.handleGlobalError({
      type: 'custom',
      error: error instanceof Error ? error : new Error(error),
      context: { ...this.getGlobalContext(), ...context },
      message: error instanceof Error ? error.message : error
    });
  }

  // Get error statistics
  getErrorStats(): { errorCount: number; sessionId: string; isInitialized: boolean } {
    return {
      errorCount: this.errorCount,
      sessionId: this.sessionId,
      isInitialized: this.isInitialized
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<GlobalErrorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Cleanup
  destroy(): void {
    // Remove event listeners and restore original functions
    if (this.config.enableConsoleErrorOverride) {
      // Note: We can't easily restore console.error without storing the original
      console.warn('GlobalErrorHandler destroyed - console.error override remains active');
    }

    this.isInitialized = false;
    console.log('🌐 Global error handling destroyed');
  }
}

// Export singleton instance
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Export for manual initialization
export { GlobalErrorHandler };

// Utility functions for common error scenarios
export const globalErrorUtils = {
  // Report API errors
  reportApiError: (url: string, status: number, message: string) => {
    globalErrorHandler.reportError(
      new AppError(`API Error ${status}: ${message}`, status, 'API_ERROR'),
      { url }
    );
  },

  // Report validation errors
  reportValidationError: (field: string, value: unknown, rule: string) => {
    globalErrorHandler.reportError(
      new AppError(`Validation failed for ${field}`, 400, 'VALIDATION_ERROR'),
      { field, value: String(value), rule }
    );
  },

  // Report performance issues
  reportPerformanceIssue: (metric: string, value: number, threshold: number) => {
    globalErrorHandler.reportError(
      new Error(`Performance issue: ${metric} (${value}ms) exceeded threshold (${threshold}ms)`),
      { metric, value: String(value), threshold: String(threshold) }
    );
  },

  // Report user interaction errors
  reportUserError: (action: string, error: Error) => {
    globalErrorHandler.reportError(error, { action });
  }
};
