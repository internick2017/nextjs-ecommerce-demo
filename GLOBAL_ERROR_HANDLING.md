# Global Error Handling System

This document provides a comprehensive guide to the global error handling system implemented in the Next.js e-commerce application.

## Overview

The global error handling system provides comprehensive error monitoring, reporting, and recovery capabilities across the entire application. It captures errors at multiple levels and provides tools for debugging, monitoring, and user recovery.

## Architecture

### Core Components

1. **GlobalErrorHandler** (`src/lib/globalErrorHandler.ts`)
   - Singleton class that manages global error handling
   - Captures errors from various sources
   - Provides error reporting and monitoring

2. **GlobalErrorBoundary** (`src/components/GlobalErrorBoundary.tsx`)
   - React error boundary that wraps the entire application
   - Handles critical errors and provides recovery options
   - Integrates with the global error handler

3. **GlobalErrorMonitor** (`src/components/GlobalErrorMonitor.tsx`)
   - Development tool for real-time error monitoring
   - Shows error statistics and recent errors
   - Provides testing capabilities

## Features

### 1. Automatic Error Capture

The system automatically captures errors from multiple sources:

- **JavaScript Errors**: Syntax errors, type errors, reference errors
- **Unhandled Promise Rejections**: Async operation failures
- **Network Errors**: Failed fetch requests, timeouts
- **Performance Issues**: Long tasks, memory leaks
- **Console Errors**: Override console.error for logging

### 2. Error Categorization

Errors are categorized for better organization and handling:

```typescript
type ErrorEventType =
  | 'unhandledrejection'
  | 'error'
  | 'network'
  | 'console'
  | 'performance'
  | 'custom';
```

### 3. Context Collection

Each error includes rich context information:

```typescript
interface GlobalErrorContext {
  timestamp: string;
  url: string;
  userAgent: string;
  viewport: string;
  memory?: string;
  performance?: string;
  sessionId?: string;
  userId?: string;
}
```

### 4. Rate Limiting & Sampling

- **Rate Limiting**: Prevents error spam (configurable per minute)
- **Error Sampling**: Configurable sampling rate for production
- **Threshold Monitoring**: Alerts when error thresholds are exceeded

### 5. Performance Monitoring

- **Long Task Detection**: Monitors tasks longer than 50ms
- **Memory Usage**: Tracks memory consumption and alerts on high usage
- **Performance Metrics**: Collects load times and performance data

## Usage

### Basic Setup

The global error handling is automatically initialized in the root layout:

```tsx
// src/app/layout.tsx
<GlobalErrorBoundary
  enableGlobalErrorHandling={true}
  showErrorDetails={process.env.NODE_ENV === 'development'}
  onGlobalError={(event) => {
    console.log('Global error detected:', event);
  }}
>
  {/* Your app content */}
</GlobalErrorBoundary>
```

### Manual Error Reporting

```typescript
import { globalErrorHandler, globalErrorUtils } from '../lib/globalErrorHandler';

// Report a custom error
globalErrorHandler.reportError(
  new Error('Custom error message'),
  { source: 'component', action: 'user-click' }
);

// Report API errors
globalErrorUtils.reportApiError('/api/users', 500, 'Internal server error');

// Report validation errors
globalErrorUtils.reportValidationError('email', 'invalid-email', 'email_format');

// Report performance issues
globalErrorUtils.reportPerformanceIssue('loadTime', 5000, 3000);
```

### Using the Hook

```typescript
import { useGlobalErrorHandler } from '../components/GlobalErrorBoundary';

const MyComponent = () => {
  const { reportError, getStats } = useGlobalErrorHandler();

  const handleError = () => {
    reportError(new Error('Something went wrong'), {
      component: 'MyComponent',
      action: 'button-click'
    });
  };

  const stats = getStats();
  console.log('Error count:', stats.errorCount);

  return (
    <button onClick={handleError}>
      Trigger Error
    </button>
  );
};
```

## Configuration

### GlobalErrorHandler Configuration

```typescript
interface GlobalErrorConfig {
  enableGlobalErrorHandling?: boolean;
  enableUnhandledRejectionHandling?: boolean;
  enableNetworkErrorHandling?: boolean;
  enableConsoleErrorOverride?: boolean;
  enablePerformanceMonitoring?: boolean;
  errorReportingEndpoint?: string;
  maxErrorsPerMinute?: number;
  errorSamplingRate?: number;
}
```

### Example Configuration

```typescript
// Initialize with custom configuration
const globalErrorHandler = GlobalErrorHandler.getInstance({
  enableGlobalErrorHandling: true,
  enablePerformanceMonitoring: true,
  maxErrorsPerMinute: 50,
  errorSamplingRate: 0.1, // 10% sampling in production
  errorReportingEndpoint: 'https://api.example.com/errors'
});

globalErrorHandler.init();
```

## Error Recovery Strategies

### 1. Automatic Retry

The system includes automatic retry logic for recoverable errors:

```typescript
// Retry configuration
const retryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  onRetry: (attempt, error) => {
    console.log(`Retry attempt ${attempt} for error:`, error.message);
  }
};
```

### 2. Error Boundaries

React error boundaries provide component-level error isolation:

```typescript
import { withErrorBoundary } from '../components/ErrorBoundary';

const MyComponent = () => {
  // Component logic
};

export default withErrorBoundary(MyComponent, {
  maxRetries: 3,
  retryDelay: 1000,
  showRetryButton: true,
  showErrorDetails: process.env.NODE_ENV === 'development'
});
```

### 3. Circuit Breaker Pattern

For external API calls, implement circuit breaker pattern:

```typescript
import { CircuitBreaker } from '../lib/asyncErrorHandler';

const circuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 minute timeout

const apiCall = async () => {
  return circuitBreaker.execute(async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('API call failed');
    return response.json();
  });
};
```

## Monitoring & Debugging

### Development Monitor

In development mode, the `GlobalErrorMonitor` component provides:

- Real-time error statistics
- Recent error history
- Error testing capabilities
- Session information

### Error Statistics

```typescript
const stats = globalErrorHandler.getErrorStats();
console.log({
  errorCount: stats.errorCount,
  sessionId: stats.sessionId,
  isInitialized: stats.isInitialized
});
```

### Custom Event Listeners

Listen for global error events:

```typescript
window.addEventListener('globalError', (event) => {
  const errorEvent = event.detail;
  console.log('Global error:', errorEvent);

  // Custom error handling logic
  if (errorEvent.type === 'network') {
    // Handle network errors specifically
  }
});
```

## Integration with Error Tracking Services

### Sentry Integration

```typescript
// In your error reporting service
private async sendToErrorTrackingService(errorDetails: ErrorDetails): Promise<void> {
  if (typeof Sentry !== 'undefined') {
    Sentry.captureException(errorDetails.error, {
      extra: {
        context: errorDetails.context,
        sessionId: errorDetails.sessionId,
        timestamp: errorDetails.timestamp
      }
    });
  }
}
```

### LogRocket Integration

```typescript
// In your error reporting service
private async sendToErrorTrackingService(errorDetails: ErrorDetails): Promise<void> {
  if (typeof LogRocket !== 'undefined') {
    LogRocket.captureException(errorDetails.error, {
      extra: errorDetails
    });
  }
}
```

## Best Practices

### 1. Error Classification

Always classify errors appropriately:

```typescript
// Good: Specific error types
throw new ValidationError('Invalid email format', {
  field: 'email',
  value: email,
  type: 'email_format'
});

// Avoid: Generic errors
throw new Error('Something went wrong');
```

### 2. Context Information

Provide rich context for better debugging:

```typescript
globalErrorHandler.reportError(error, {
  component: 'UserProfile',
  action: 'save-profile',
  userId: user.id,
  formData: { email, name },
  timestamp: new Date().toISOString()
});
```

### 3. Error Boundaries

Use error boundaries strategically:

```typescript
// Wrap critical components
<ErrorBoundary fallback={<ErrorFallback />}>
  <CriticalComponent />
</ErrorBoundary>

// Wrap entire sections
<ErrorBoundary>
  <UserDashboard />
</ErrorBoundary>
```

### 4. Performance Monitoring

Monitor performance proactively:

```typescript
// Monitor long operations
const startTime = Date.now();
await performOperation();
const duration = Date.now() - startTime;

if (duration > 1000) {
  globalErrorUtils.reportPerformanceIssue('operationDuration', duration, 1000);
}
```

## Testing

### Error Demo Pages

The application includes comprehensive error demo pages:

1. **Error Handling Demo** (`/error-handling-demo`)
   - Tests component-level error handling
   - Demonstrates retry logic and recovery

2. **Global Error Demo** (`/global-error-demo`)
   - Tests global error capture
   - Demonstrates all error types and categories

### Manual Testing

```typescript
// Test JavaScript errors
throw new Error('Test error');

// Test network errors
fetch('/api/non-existent');

// Test unhandled rejections
Promise.reject(new Error('Test rejection'));

// Test performance issues
const start = Date.now();
while (Date.now() - start < 100) {
  // Block for 100ms
}
```

## Production Considerations

### 1. Error Sampling

In production, use error sampling to reduce noise:

```typescript
const config = {
  errorSamplingRate: 0.1, // 10% of errors
  maxErrorsPerMinute: 100
};
```

### 2. Error Reporting Endpoint

Configure a proper error reporting endpoint:

```typescript
const config = {
  errorReportingEndpoint: process.env.ERROR_REPORTING_URL
};
```

### 3. Performance Impact

Monitor the performance impact of error handling:

```typescript
// Disable in performance-critical sections
const config = {
  enablePerformanceMonitoring: false
};
```

### 4. Security

Ensure sensitive information is not logged:

```typescript
// Sanitize error context
const sanitizedContext = {
  ...context,
  password: undefined,
  token: undefined,
  sensitiveData: '[REDACTED]'
};
```

## Troubleshooting

### Common Issues

1. **Errors not being captured**
   - Check if global error handler is initialized
   - Verify error boundary is wrapping components
   - Check browser console for initialization messages

2. **Performance impact**
   - Reduce error sampling rate
   - Disable performance monitoring if not needed
   - Check error reporting endpoint performance

3. **Memory leaks**
   - Ensure error listeners are properly cleaned up
   - Monitor memory usage in development
   - Use error sampling to reduce memory usage

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// In development
const config = {
  enableConsoleErrorOverride: true,
  errorSamplingRate: 1.0
};
```

## Conclusion

The global error handling system provides a robust foundation for error monitoring, reporting, and recovery in the Next.js application. By following the best practices outlined in this document, you can ensure reliable error handling and improve the overall user experience.

For more information, refer to the individual component documentation and the demo pages in the application.
