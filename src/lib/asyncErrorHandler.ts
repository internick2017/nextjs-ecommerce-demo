import {
  AppError,
  NetworkError,
  ValidationError,
  RateLimitError,
  asyncHandler,
  canRetryError,
  getRetryDelay,
  ErrorLogger
} from './errorHandler';

// Configuration for async operations
export interface AsyncOperationConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
  retryCondition?: (error: Error) => boolean;
}

// Result wrapper for async operations
export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  retryCount?: number;
  duration?: number;
}

// Enhanced fetch wrapper with error handling
export async function fetchWithErrorHandling<T = unknown>(
  url: string,
  options: RequestInit = {},
  config: AsyncOperationConfig = {}
): Promise<AsyncResult<T>> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 10000,
    onRetry,
    onSuccess,
    onError,
    onTimeout,
    retryCondition = canRetryError
  } = config;

  const startTime = Date.now();
  let lastError: Error;
  let retryCount = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Add abort signal to fetch options
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        let error: AppError;
        switch (response.status) {
          case 400:
            error = new ValidationError(errorData.message || 'Bad request');
            break;
          case 401:
            error = new AppError('Unauthorized', 401, 'UNAUTHORIZED');
            break;
          case 403:
            error = new AppError('Forbidden', 403, 'FORBIDDEN');
            break;
          case 404:
            error = new AppError('Not found', 404, 'NOT_FOUND');
            break;
          case 429:
            error = new RateLimitError(errorData.message || 'Rate limit exceeded');
            break;
          case 500:
            error = new AppError('Internal server error', 500, 'INTERNAL_ERROR');
            break;
          default:
            error = new AppError(
              errorData.message || `HTTP ${response.status}`,
              response.status,
              'HTTP_ERROR'
            );
        }

        throw error;
      }

      const data = await response.json();
      const duration = Date.now() - startTime;

      const result: AsyncResult<T> = {
        success: true,
        data,
        retryCount,
        duration
      };

      if (onSuccess) {
        onSuccess(data);
      }

      return result;

    } catch (error) {
      lastError = error as Error;

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        if (onTimeout) {
          onTimeout();
        }
        throw new AppError('Request timeout', 0, 'TIMEOUT_ERROR');
      }

      // Don't retry on certain error types
      if (error instanceof ValidationError ||
          (error instanceof AppError && !error.recoverable) ||
          !retryCondition(error)) {
        break;
      }

      if (attempt < maxRetries) {
        retryCount++;

        if (onRetry) {
          onRetry(attempt, lastError);
        }

        // Exponential backoff
        const delay = getRetryDelay(lastError, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  const duration = Date.now() - startTime;

  if (onError) {
    onError(lastError);
  }

  return {
    success: false,
    error: lastError,
    retryCount,
    duration
  };
}

// Generic async operation wrapper
export function createAsyncOperation<T>(
  operation: () => Promise<T>,
  config: AsyncOperationConfig = {}
) {
  return async (): Promise<AsyncResult<T>> => {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      onRetry,
      onSuccess,
      onError,
      retryCondition = canRetryError
    } = config;

    const startTime = Date.now();
    let lastError: Error;
    let retryCount = 0;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        const duration = Date.now() - startTime;

        const asyncResult: AsyncResult<T> = {
          success: true,
          data: result,
          retryCount,
          duration
        };

        if (onSuccess) {
          onSuccess(result);
        }

        return asyncResult;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (error instanceof ValidationError ||
            (error instanceof AppError && !error.recoverable) ||
            !retryCondition(error)) {
          break;
        }

        if (attempt < maxRetries) {
          retryCount++;

          if (onRetry) {
            onRetry(attempt, lastError);
          }

          // Exponential backoff
          const delay = getRetryDelay(lastError, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const duration = Date.now() - startTime;

    if (onError) {
      onError(lastError);
    }

    return {
      success: false,
      error: lastError,
      retryCount,
      duration
    };
  };
}

// Batch operation handler
export async function batchAsyncOperations<T>(
  operations: Array<() => Promise<T>>,
  config: AsyncOperationConfig & {
    concurrency?: number;
    stopOnError?: boolean;
  } = {}
): Promise<Array<AsyncResult<T>>> {
  const {
    concurrency = 5,
    stopOnError = false,
    ...operationConfig
  } = config;

  const results: Array<AsyncResult<T>> = [];
  const running: Array<Promise<void>> = [];
  let operationIndex = 0;

  const executeOperation = async (index: number) => {
    if (index >= operations.length) return;

    const operation = operations[index];
    const result = await createAsyncOperation(operation, operationConfig)();

    results[index] = result;

    if (stopOnError && !result.success) {
      throw result.error;
    }
  };

  // Start initial batch
  for (let i = 0; i < Math.min(concurrency, operations.length); i++) {
    running.push(executeOperation(operationIndex++));
  }

  // Process remaining operations
  while (operationIndex < operations.length) {
    // Wait for one operation to complete
    await Promise.race(running);

    // Remove completed operations and start new ones
    const completedIndex = running.findIndex(p => p.then(() => true).catch(() => true));
    if (completedIndex !== -1) {
      running.splice(completedIndex, 1);
      running.push(executeOperation(operationIndex++));
    }
  }

  // Wait for remaining operations
  await Promise.all(running);

  return results;
}

// Debounced async operation
export function createDebouncedAsyncOperation<T>(
  operation: () => Promise<T>,
  delay: number = 300,
  config: AsyncOperationConfig = {}
) {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<AsyncResult<T>> | null = null;

  return async (): Promise<AsyncResult<T>> => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // If there's a pending promise, wait for it
    if (pendingPromise) {
      return pendingPromise;
    }

    // Create new promise
    pendingPromise = new Promise<AsyncResult<T>>((resolve) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await createAsyncOperation(operation, config)();
          resolve(result);
        } finally {
          pendingPromise = null;
        }
      }, delay);
    });

    return pendingPromise;
  };
}

// Throttled async operation
export function createThrottledAsyncOperation<T>(
  operation: () => Promise<T>,
  interval: number = 1000,
  config: AsyncOperationConfig = {}
) {
  let lastExecution = 0;
  let pendingPromise: Promise<AsyncResult<T>> | null = null;

  return async (): Promise<AsyncResult<T>> => {
    const now = Date.now();

    // If enough time has passed, execute immediately
    if (now - lastExecution >= interval) {
      lastExecution = now;
      return createAsyncOperation(operation, config)();
    }

    // Otherwise, wait for the next interval
    if (!pendingPromise) {
      pendingPromise = new Promise<AsyncResult<T>>((resolve) => {
        const waitTime = interval - (now - lastExecution);
        setTimeout(async () => {
          lastExecution = Date.now();
          try {
            const result = await createAsyncOperation(operation, config)();
            resolve(result);
          } finally {
            pendingPromise = null;
          }
        }, waitTime);
      });
    }

    return pendingPromise;
  };
}

// Circuit breaker pattern
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000,
    private monitoringPeriod: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError('Circuit breaker is open', 0, 'CIRCUIT_OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }
}

// Error recovery strategies
export class ErrorRecoveryManager {
  private logger = ErrorLogger.getInstance();

  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    recoveryStrategies: Array<{
      condition: (error: Error) => boolean;
      action: (error: Error) => Promise<T>;
    }>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const recoveryStrategy = recoveryStrategies.find(strategy =>
        strategy.condition(error as Error)
      );

      if (recoveryStrategy) {
        try {
          return await recoveryStrategy.action(error as Error);
        } catch (recoveryError) {
          await this.logger.logError(recoveryError as Error, {
            originalError: error,
            recoveryStrategy: 'failed'
          });
          throw recoveryError;
        }
      }

      throw error;
    }
  }

  // Common recovery strategies
  static createFallbackStrategy<T>(fallbackValue: T) {
    return {
      condition: () => true,
      action: async () => fallbackValue
    };
  }

  static createRetryStrategy<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ) {
    return {
      condition: canRetryError,
      action: async (error: Error) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await operation();
          } catch (retryError) {
            if (attempt === maxRetries) throw retryError;
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
          }
        }
        throw error;
      }
    };
  }
}
