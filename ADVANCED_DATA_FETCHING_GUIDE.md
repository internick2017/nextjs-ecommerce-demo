# Advanced Data Fetching Guide

This guide covers advanced data fetching strategies including loading states, error handling, sequential and parallel fetching, and comprehensive state management.

## Table of Contents

1. [Loading States Management](#loading-states-management)
2. [Error Handling](#error-handling)
3. [Sequential Data Fetching](#sequential-data-fetching)
4. [Parallel Data Fetching](#parallel-data-fetching)
5. [Mixed Strategies](#mixed-strategies)
6. [Advanced Components](#advanced-components)
7. [Best Practices](#best-practices)

## Loading States Management

### LoadingStateManager

The `LoadingStateManager` provides comprehensive loading state management with progress tracking and stage information.

```typescript
import { LoadingStateManager } from '../lib/advancedDataFetching';

const loadingManager = new LoadingStateManager();

// Set loading state
loadingManager.setLoading('users', true, 'Loading users...', 0);

// Update progress
loadingManager.setProgress('users', 50, 'Halfway done...');

// Set stage
loadingManager.setStage('users', 'processing', 'Processing user data...');

// Check overall progress
const overallProgress = loadingManager.getOverallProgress(); // 0-100
```

### Loading State Interface

```typescript
interface LoadingState {
  isLoading: boolean;
  progress?: number; // 0-100
  message?: string;
  stage?: string;
}
```

### Usage Examples

```typescript
// Basic loading state
loadingManager.setLoading('products', true, 'Fetching products...');

// With progress tracking
loadingManager.setProgress('products', 25, '25% complete');

// With stage information
loadingManager.setStage('products', 'validating', 'Validating product data');

// Check if any loading is happening
const isAnyLoading = loadingManager.isAnyLoading();

// Get overall progress across all operations
const overallProgress = loadingManager.getOverallProgress();
```

## Error Handling

### ErrorStateManager

The `ErrorStateManager` provides comprehensive error handling with retry logic and error tracking.

```typescript
import { ErrorStateManager } from '../lib/advancedDataFetching';

const errorManager = new ErrorStateManager();

// Set error
errorManager.setError('users', 'Failed to fetch users', 3);

// Increment retry count
errorManager.incrementRetry('users');

// Check if can retry
const canRetry = errorManager.canRetry('users');

// Clear error
errorManager.clearError('users');
```

### Error State Interface

```typescript
interface ErrorState {
  hasError: boolean;
  error: string | null;
  retryCount: number;
  maxRetries: number;
  lastError?: Error;
}
```

### Retry Logic

```typescript
// Configure retry behavior
const config = {
  retries: 3,
  retryDelay: 1000, // Base delay in ms
  onRetry: (attempt: number) => {
    console.log(`Retry attempt ${attempt}`);
  }
};

// Exponential backoff
const delay = config.retryDelay * Math.pow(2, attempt - 1);
```

## Sequential Data Fetching

Sequential fetching executes requests one after another, supporting dependencies and conditional execution.

### Basic Sequential Fetch

```typescript
import { SequentialDataFetcher } from '../lib/advancedDataFetching';

const sequentialFetcher = new SequentialDataFetcher();

const results = await sequentialFetcher.fetchSequential([
  {
    key: 'users',
    fetcher: () => fetch('/api/users').then(res => res.json()),
    config: { retries: 2, retryDelay: 1000 }
  },
  {
    key: 'products',
    fetcher: () => fetch('/api/products').then(res => res.json()),
    config: { retries: 3, retryDelay: 1500 }
  },
  {
    key: 'categories',
    fetcher: () => fetch('/api/categories').then(res => res.json()),
    config: { retries: 2, retryDelay: 1000 }
  }
]);
```

### Dependent Sequential Fetch

```typescript
const results = await sequentialFetcher.fetchSequential([
  {
    key: 'user',
    fetcher: () => fetch('/api/users/1').then(res => res.json()),
    config: { retries: 2 }
  },
  {
    key: 'userOrders',
    fetcher: () => fetch('/api/users/1/orders').then(res => res.json()),
    config: {
      retries: 2,
      dependencies: ['user'],
      condition: (deps) => deps[0]?.id === 1 // Only fetch if user exists
    }
  },
  {
    key: 'orderDetails',
    fetcher: () => fetch('/api/orders/1/details').then(res => res.json()),
    config: {
      retries: 2,
      dependencies: ['userOrders'],
      condition: (deps) => deps[0]?.length > 0 // Only fetch if user has orders
    }
  }
], { user: previousResults.user });
```

### Conditional Sequential Fetch

```typescript
const results = await sequentialFetcher.fetchSequential([
  {
    key: 'config',
    fetcher: () => fetch('/api/config').then(res => res.json()),
    config: { retries: 2 }
  },
  {
    key: 'featuredProducts',
    fetcher: () => fetch('/api/products?featured=true').then(res => res.json()),
    config: {
      retries: 2,
      dependencies: ['config'],
      condition: (deps) => deps[0]?.showFeatured === true
    }
  },
  {
    key: 'recommendations',
    fetcher: () => fetch('/api/recommendations').then(res => res.json()),
    config: {
      retries: 2,
      dependencies: ['config'],
      condition: (deps) => deps[0]?.enableRecommendations === true
    }
  }
]);
```

## Parallel Data Fetching

Parallel fetching executes multiple requests simultaneously with concurrency control.

### Basic Parallel Fetch

```typescript
import { ParallelDataFetcher } from '../lib/advancedDataFetching';

const parallelFetcher = new ParallelDataFetcher();

const results = await parallelFetcher.fetchParallel([
  {
    key: 'products',
    fetcher: () => fetch('/api/products').then(res => res.json()),
    config: { retries: 2, retryDelay: 1000 }
  },
  {
    key: 'categories',
    fetcher: () => fetch('/api/categories').then(res => res.json()),
    config: { retries: 2, retryDelay: 1000 }
  },
  {
    key: 'users',
    fetcher: () => fetch('/api/users').then(res => res.json()),
    config: { retries: 2, retryDelay: 1000 }
  }
], 3); // Concurrency limit of 3
```

### Parallel Fetch with Error Handling

```typescript
const results = await parallelFetcher.fetchParallel([
  {
    key: 'products',
    fetcher: () => fetch('/api/products').then(res => res.json()),
    config: { retries: 2, abortOnError: false }
  },
  {
    key: 'invalidEndpoint',
    fetcher: () => fetch('/api/invalid').then(res => res.json()),
    config: { retries: 1, abortOnError: false }
  },
  {
    key: 'categories',
    fetcher: () => fetch('/api/categories').then(res => res.json()),
    config: { retries: 2, abortOnError: false }
  }
], 2);
```

### Concurrency Control

```typescript
// Low concurrency for rate-limited APIs
const results = await parallelFetcher.fetchParallel(fetches, 1);

// High concurrency for fast APIs
const results = await parallelFetcher.fetchParallel(fetches, 10);

// Adaptive concurrency based on API performance
const concurrency = Math.min(5, fetches.length);
const results = await parallelFetcher.fetchParallel(fetches, concurrency);
```

## Mixed Strategies

Combine sequential and parallel fetching for complex data loading scenarios.

### Multi-Stage Data Loading

```typescript
async function loadComplexData() {
  // Stage 1: Sequential - Authentication and user data
  const sequentialFetcher = new SequentialDataFetcher();
  const userData = await sequentialFetcher.fetchSequential([
    {
      key: 'user',
      fetcher: () => fetch('/api/users/1').then(res => res.json()),
      config: { retries: 2 }
    },
    {
      key: 'userPreferences',
      fetcher: () => fetch('/api/users/1/preferences').then(res => res.json()),
      config: { retries: 2 }
    }
  ]);

  // Stage 2: Parallel - Product data
  const parallelFetcher = new ParallelDataFetcher();
  const productData = await parallelFetcher.fetchParallel([
    {
      key: 'products',
      fetcher: () => fetch('/api/products').then(res => res.json()),
      config: { retries: 2 }
    },
    {
      key: 'categories',
      fetcher: () => fetch('/api/categories').then(res => res.json()),
      config: { retries: 2 }
    },
    {
      key: 'reviews',
      fetcher: () => fetch('/api/reviews').then(res => res.json()),
      config: { retries: 2 }
    }
  ], 3);

  // Stage 3: Sequential - Recommendations based on user and products
  const recommendationData = await sequentialFetcher.fetchSequential([
    {
      key: 'recommendations',
      fetcher: () => fetch('/api/recommendations').then(res => res.json()),
      config: { retries: 2 }
    },
    {
      key: 'personalizedOffers',
      fetcher: () => fetch('/api/offers/personalized').then(res => res.json()),
      config: { retries: 2 }
    }
  ]);

  return {
    ...userData,
    ...productData,
    ...recommendationData
  };
}
```

## Advanced Components

### AdvancedLoadingIndicator

A comprehensive loading indicator that shows progress, stages, and errors.

```typescript
import { AdvancedLoadingIndicator } from '../lib/advancedDataFetching';

function MyComponent() {
  const { loadingManager, errorManager } = useSequentialFetch();

  return (
    <div>
      {/* Your component content */}

      <AdvancedLoadingIndicator
        loadingManager={loadingManager}
        errorManager={errorManager}
        onRetry={() => {
          // Retry logic
        }}
      />
    </div>
  );
}
```

### React Hooks

#### useSequentialFetch

```typescript
import { useSequentialFetch } from '../lib/advancedDataFetching';

function SequentialComponent() {
  const {
    results,
    fetchSequential,
    loadingManager,
    errorManager,
    isLoading,
    hasErrors,
    overallProgress
  } = useSequentialFetch();

  const handleFetch = async () => {
    await fetchSequential([
      {
        key: 'users',
        fetcher: () => fetch('/api/users').then(res => res.json()),
        config: { retries: 2 }
      },
      {
        key: 'products',
        fetcher: () => fetch('/api/products').then(res => res.json()),
        config: { retries: 2 }
      }
    ]);
  };

  return (
    <div>
      <button onClick={handleFetch} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </button>

      {isLoading && (
        <div>Progress: {overallProgress}%</div>
      )}

      {hasErrors && (
        <div>Some errors occurred</div>
      )}

      {/* Display results */}
    </div>
  );
}
```

#### useParallelFetch

```typescript
import { useParallelFetch } from '../lib/advancedDataFetching';

function ParallelComponent() {
  const {
    results,
    fetchParallel,
    loadingManager,
    errorManager,
    isLoading,
    hasErrors,
    overallProgress
  } = useParallelFetch();

  const handleFetch = async () => {
    await fetchParallel([
      {
        key: 'products',
        fetcher: () => fetch('/api/products').then(res => res.json()),
        config: { retries: 2 }
      },
      {
        key: 'categories',
        fetcher: () => fetch('/api/categories').then(res => res.json()),
        config: { retries: 2 }
      }
    ], 2); // Concurrency limit
  };

  return (
    <div>
      <button onClick={handleFetch} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </button>

      {/* Display results */}
    </div>
  );
}
```

## Best Practices

### 1. Loading State Management

```typescript
// ✅ Good: Comprehensive loading states
loadingManager.setLoading('users', true, 'Loading users...', 0);
loadingManager.setProgress('users', 50, 'Processing user data...');
loadingManager.setStage('users', 'validating', 'Validating data...');

// ❌ Bad: Simple boolean loading
const [loading, setLoading] = useState(false);
```

### 2. Error Handling

```typescript
// ✅ Good: Retry with exponential backoff
const config = {
  retries: 3,
  retryDelay: 1000,
  onRetry: (attempt) => {
    const delay = config.retryDelay * Math.pow(2, attempt - 1);
    console.log(`Retrying in ${delay}ms`);
  }
};

// ❌ Bad: No retry logic
try {
  const data = await fetch('/api/data');
} catch (error) {
  console.error('Failed');
}
```

### 3. Sequential vs Parallel

```typescript
// ✅ Good: Use sequential for dependent data
const userData = await sequentialFetcher.fetchSequential([
  { key: 'user', fetcher: () => fetch('/api/user') },
  {
    key: 'userOrders',
    fetcher: () => fetch('/api/user/orders'),
    dependencies: ['user']
  }
]);

// ✅ Good: Use parallel for independent data
const productData = await parallelFetcher.fetchParallel([
  { key: 'products', fetcher: () => fetch('/api/products') },
  { key: 'categories', fetcher: () => fetch('/api/categories') }
], 3);
```

### 4. Concurrency Control

```typescript
// ✅ Good: Adaptive concurrency
const concurrency = Math.min(5, fetches.length);
const results = await parallelFetcher.fetchParallel(fetches, concurrency);

// ❌ Bad: Fixed high concurrency
const results = await parallelFetcher.fetchParallel(fetches, 10);
```

### 5. Progress Tracking

```typescript
// ✅ Good: Detailed progress tracking
loadingManager.setProgress('users', 25, '25% - Loading user list');
loadingManager.setProgress('users', 50, '50% - Processing user data');
loadingManager.setProgress('users', 75, '75% - Validating data');
loadingManager.setProgress('users', 100, '100% - Complete');

// ❌ Bad: No progress information
const [loading, setLoading] = useState(false);
```

### 6. Error Recovery

```typescript
// ✅ Good: Graceful error recovery
const results = await sequentialFetcher.fetchSequential([
  {
    key: 'critical',
    fetcher: () => fetch('/api/critical'),
    config: { retries: 3, abortOnError: true }
  },
  {
    key: 'optional',
    fetcher: () => fetch('/api/optional'),
    config: { retries: 1, abortOnError: false }
  }
]);

// ❌ Bad: All or nothing approach
const results = await Promise.all([
  fetch('/api/critical'),
  fetch('/api/optional')
]);
```

## Performance Considerations

### 1. Concurrency Limits

- **Low concurrency (1-2)**: For rate-limited APIs or heavy operations
- **Medium concurrency (3-5)**: For most APIs
- **High concurrency (6-10)**: For fast, reliable APIs

### 2. Retry Strategies

- **Exponential backoff**: Reduces server load
- **Maximum retries**: Prevents infinite loops
- **Error isolation**: One failure doesn't stop others

### 3. Progress Tracking

- **Granular updates**: Better user experience
- **Stage information**: Clear communication
- **Overall progress**: Global view of operations

### 4. Memory Management

- **Cleanup**: Clear loading states after completion
- **Cancellation**: Support for aborting operations
- **Garbage collection**: Remove completed operations

## Summary

Advanced data fetching provides:

- **Comprehensive loading states** with progress tracking
- **Robust error handling** with retry logic
- **Flexible fetching strategies** (sequential, parallel, mixed)
- **Concurrency control** for optimal performance
- **React hooks** for easy integration
- **Advanced components** for better UX

Choose the right strategy based on your data dependencies and performance requirements.
