// Global Error Handler Utility

export interface ErrorDetails {
  message: string;
  code?: string;
  statusCode?: number;
  stack?: string;
  timestamp: string;
  userId?: string;
  requestId?: string;
  context?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'validation' | 'authentication' | 'authorization' | 'network' | 'database' | 'system' | 'unknown';
  recoverable?: boolean;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
  retryAfter?: number;
  helpUrl?: string;
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'redirect' | 'showMessage';
  maxRetries?: number;
  retryDelay?: number;
  fallbackUrl?: string;
  message?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly category: 'validation' | 'authentication' | 'authorization' | 'network' | 'database' | 'system' | 'unknown';
  public readonly recoverable: boolean;
  public readonly recoveryStrategy?: ErrorRecoveryStrategy;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    context?: Record<string, unknown>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    category: 'validation' | 'authentication' | 'authorization' | 'network' | 'database' | 'system' | 'unknown' = 'unknown',
    recoverable: boolean = true,
    recoveryStrategy?: ErrorRecoveryStrategy
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.context = context;
    this.severity = severity;
    this.category = category;
    this.recoverable = recoverable;
    this.recoveryStrategy = recoveryStrategy;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error types with enhanced categorization
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', true, context, 'low', 'validation', true, {
      type: 'showMessage',
      message: 'Please check your input and try again.'
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true, undefined, 'medium', 'system', true, {
      type: 'redirect',
      fallbackUrl: '/'
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED', true, undefined, 'high', 'authentication', true, {
      type: 'redirect',
      fallbackUrl: '/login'
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN', true, undefined, 'high', 'authorization', false, {
      type: 'showMessage',
      message: 'You do not have permission to access this resource.'
    });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', true, context, 'medium', 'validation', true, {
      type: 'showMessage',
      message: 'This resource conflicts with existing data.'
    });
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, undefined, 'medium', 'system', true, {
      type: 'retry',
      maxRetries: 3,
      retryDelay: retryAfter || 60
    });
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network connection failed') {
    super(message, 0, 'NETWORK_ERROR', true, undefined, 'high', 'network', true, {
      type: 'retry',
      maxRetries: 3,
      retryDelay: 5
    });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR', true, undefined, 'critical', 'database', false, {
      type: 'showMessage',
      message: 'A database error occurred. Please try again later.'
    });
  }
}

// Error logging service with enhanced features
export class ErrorLogger {
  private static instance: ErrorLogger;
  private isDevelopment = process.env.NODE_ENV === 'development';
  private errorCounts = new Map<string, number>();
  private errorThresholds = new Map<string, number>();

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  async logError(error: Error | AppError, context?: Record<string, unknown>): Promise<void> {
    const errorDetails: ErrorDetails = {
      message: error.message,
      code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
      statusCode: error instanceof AppError ? error.statusCode : 500,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: error instanceof AppError ? error.severity : 'medium',
      category: error instanceof AppError ? error.category : 'unknown',
      recoverable: error instanceof AppError ? error.recoverable : true,
      context: {
        ...context,
        ...(error instanceof AppError ? error.context : {}),
      },
    };

    // Track error frequency
    this.trackErrorFrequency(errorDetails.code);

    // Log to console in development
    if (this.isDevelopment) {
      console.error('🚨 Error Details:', errorDetails);
    }

    // Check if error threshold exceeded
    if (this.isErrorThresholdExceeded(errorDetails.code)) {
      await this.handleErrorThresholdExceeded(errorDetails);
    }

    // In production, you would send this to your error tracking service
    try {
      await this.sendToErrorTrackingService(errorDetails);
    } catch (loggingError) {
      console.error('Failed to log error to tracking service:', loggingError);
    }
  }

  private trackErrorFrequency(errorCode: string): void {
    const count = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, count + 1);
  }

  private isErrorThresholdExceeded(errorCode: string): boolean {
    const threshold = this.errorThresholds.get(errorCode) || 10;
    const count = this.errorCounts.get(errorCode) || 0;
    return count >= threshold;
  }

  private async handleErrorThresholdExceeded(errorDetails: ErrorDetails): Promise<void> {
    console.warn(`⚠️ Error threshold exceeded for ${errorDetails.code}: ${this.errorCounts.get(errorDetails.code)} errors`);

    // In production, you might want to:
    // - Send alerts to your team
    // - Trigger automatic recovery procedures
    // - Scale up resources
    // - Enable circuit breakers
  }

  private async sendToErrorTrackingService(errorDetails: ErrorDetails): Promise<void> {
    // Mock implementation - replace with your actual error tracking service
    if (this.isDevelopment) {
      console.log('📊 Would send to error tracking service:', {
        service: 'Sentry/LogRocket/Bugsnag',
        errorDetails,
      });
    }

    // Example implementations:
    // Sentry.captureException(error, { extra: errorDetails });
    // LogRocket.captureException(error);
    // Bugsnag.notify(error, { metaData: errorDetails });
  }

  // Get error statistics
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  // Reset error counts (useful for testing)
  resetErrorCounts(): void {
    this.errorCounts.clear();
  }

  // Set error thresholds
  setErrorThreshold(errorCode: string, threshold: number): void {
    this.errorThresholds.set(errorCode, threshold);
  }
}

// API Error Handler with enhanced response
export function createApiErrorResponse(
  error: Error | AppError,
  requestId?: string
): ApiErrorResponse {
  const isAppError = error instanceof AppError;
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response: ApiErrorResponse = {
    success: false,
    error: isAppError ? error.code : 'INTERNAL_ERROR',
    message: isAppError ? error.message : 'An unexpected error occurred',
    code: isAppError ? error.code : 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Add retry information for recoverable errors
  if (isAppError && error.recoveryStrategy?.type === 'retry') {
    response.retryAfter = error.recoveryStrategy.retryDelay;
  }

  // Add help URL for certain error types
  if (isAppError) {
    response.helpUrl = getHelpUrl(error.code);
  }

  // Add development details
  if (isDevelopment) {
    response.details = {
      stack: error.stack,
      severity: isAppError ? error.severity : 'medium',
      category: isAppError ? error.category : 'unknown',
      recoverable: isAppError ? error.recoverable : true,
      ...(isAppError ? error.context : {}),
    };
  }

  return response;
}

// Get help URL for error codes
function getHelpUrl(errorCode: string): string | undefined {
  const helpUrls: Record<string, string> = {
    'VALIDATION_ERROR': '/help/validation-errors',
    'AUTHENTICATION_ERROR': '/help/authentication',
    'RATE_LIMIT_EXCEEDED': '/help/rate-limits',
    'NETWORK_ERROR': '/help/network-issues',
  };

  return helpUrls[errorCode];
}

// Async error handler wrapper with retry logic
export function asyncHandler<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
) {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options || {};

  return async (...args: T): Promise<R> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (error instanceof AppError && !error.recoverable) {
          throw error;
        }

        // Don't retry on validation errors
        if (error instanceof ValidationError) {
          throw error;
        }

        if (attempt < maxRetries) {
          if (onRetry) {
            onRetry(attempt, lastError);
          }

          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    const logger = ErrorLogger.getInstance();
    await logger.logError(lastError, {
      function: fn.name,
      arguments: args,
      retryAttempts: maxRetries,
    });

    throw lastError;
  };
}

// Client-side error handler with enhanced features
export function handleClientError(error: Error, context?: Record<string, unknown>): void {
  const logger = ErrorLogger.getInstance();
  logger.logError(error, {
    ...context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    timestamp: new Date().toISOString(),
  });
}

// Error recovery utilities
export function canRetryError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.recoverable && error.recoveryStrategy?.type === 'retry';
  }

  // Retry network errors and 5xx server errors
  return error.message.includes('network') ||
         error.message.includes('fetch') ||
         error.message.includes('timeout');
}

export function getRetryDelay(error: Error, attempt: number): number {
  if (error instanceof AppError && error.recoveryStrategy?.retryDelay) {
    return error.recoveryStrategy.retryDelay * Math.pow(2, attempt - 1);
  }

  // Default exponential backoff
  return 1000 * Math.pow(2, attempt - 1);
}

// Validation helpers with enhanced error messages
export function validateRequired(value: unknown, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, {
      field: fieldName,
      value: value,
      type: 'required'
    });
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', {
      field: 'email',
      value: email,
      type: 'email_format'
    });
  }
}

export function validatePositiveNumber(value: number, fieldName: string): void {
  if (typeof value !== 'number' || isNaN(value) || value < 0) {
    throw new ValidationError(`${fieldName} must be a positive number`, {
      field: fieldName,
      value: value,
      type: 'positive_number'
    });
  }
}

export function validateStringLength(value: string, fieldName: string, minLength: number, maxLength: number): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, {
      field: fieldName,
      value: value,
      type: 'string_type'
    });
  }

  if (value.length < minLength || value.length > maxLength) {
    throw new ValidationError(`${fieldName} must be between ${minLength} and ${maxLength} characters`, {
      field: fieldName,
      value: value,
      length: value.length,
      minLength,
      maxLength,
      type: 'string_length'
    });
  }
}

// Error boundary helper with enhanced features
export function getErrorBoundaryProps(error: Error) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isAppError = error instanceof AppError;

  return {
    title: isAppError ? getErrorTitle(error.code) : 'Something went wrong',
    message: isDevelopment
      ? error.message
      : (isAppError ? error.message : 'We encountered an unexpected error. Please try again.'),
    showDetails: isDevelopment,
    errorDetails: isDevelopment ? {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: isAppError ? error.severity : 'medium',
      category: isAppError ? error.category : 'unknown',
      recoverable: isAppError ? error.recoverable : true,
    } : undefined,
    recoveryStrategy: isAppError ? error.recoveryStrategy : undefined,
  };
}

// Get user-friendly error titles
function getErrorTitle(errorCode: string): string {
  const titles: Record<string, string> = {
    'VALIDATION_ERROR': 'Invalid Input',
    'NOT_FOUND': 'Page Not Found',
    'UNAUTHORIZED': 'Access Denied',
    'FORBIDDEN': 'Permission Denied',
    'RATE_LIMIT_EXCEEDED': 'Too Many Requests',
    'NETWORK_ERROR': 'Connection Error',
    'DATABASE_ERROR': 'Service Temporarily Unavailable',
  };

  return titles[errorCode] || 'Something went wrong';
}