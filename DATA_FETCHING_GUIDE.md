# Data Fetching Strategies in Next.js App Router

This guide covers different approaches for fetching data in Next.js App Router, including server components, client components, and hybrid approaches.

## Table of Contents

1. [Server Components](#server-components)
2. [Client Components](#client-components)
3. [Data Fetching Utilities](#data-fetching-utilities)
4. [Best Practices](#best-practices)
5. [Performance Considerations](#performance-considerations)
6. [Error Handling](#error-handling)

## Server Components

Server components run on the server and can fetch data during the build time or request time. They provide excellent performance and SEO benefits.

### Basic Server Component

```typescript
// Server Component - Basic
export default async function ServerComponent() {
  const data = await fetch('/api/data', {
    cache: 'force-cache', // Cache indefinitely
    revalidate: 3600, // Revalidate every hour
    tags: ['data'], // Tag for cache invalidation
  });

  const result = await data.json();

  return (
    <div>
      {result.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Server Component with Error Handling

```typescript
// Server Component - Safe Data Fetching
export default async function SafeServerComponent() {
  try {
    const data = await fetch('/api/data', {
      cache: 'force-cache',
      revalidate: 3600,
    });

    if (!data.ok) {
      throw new Error('Failed to fetch data');
    }

    const result = await data.json();

    return (
      <div>
        {result.map(item => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    );
  } catch (error) {
    // Fallback UI
    return (
      <div>
        <p>Unable to load data</p>
        <p>Please try again later</p>
      </div>
    );
  }
}
```

### Parallel Data Fetching

```typescript
// Server Component - Parallel Fetching
export default async function ParallelServerComponent() {
  // Fetch multiple resources in parallel
  const [users, posts, comments] = await Promise.all([
    fetch('/api/users').then(res => res.json()),
    fetch('/api/posts').then(res => res.json()),
    fetch('/api/comments').then(res => res.json()),
  ]);

  return (
    <div>
      <h2>Users: {users.length}</h2>
      <h2>Posts: {posts.length}</h2>
      <h2>Comments: {comments.length}</h2>
    </div>
  );
}
```

### Streaming Server Component

```typescript
// Server Component - Streaming
export default async function StreamingServerComponent() {
  const data = await fetch('/api/large-dataset', {
    cache: 'no-store', // No caching for real-time data
  });

  const result = await data.json();

  return (
    <div>
      {result.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## Client Components

Client components run in the browser and can provide interactive data fetching with real-time updates.

### useQuery Hook

```typescript
'use client';

import { useQuery } from '../lib/dataFetching';

export function ClientComponentWithQuery() {
  const { data, loading, error, refetch } = useQuery(
    'products',
    () => fetch('/api/products').then(res => res.json()),
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### useSWR Hook

```typescript
'use client';

import { useSWR } from '../lib/dataFetching';

export function ClientComponentWithSWR() {
  const { data, loading, error, mutate } = useSWR(
    'products-swr',
    () => fetch('/api/products').then(res => res.json()),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
      <button onClick={() => mutate()}>Refresh</button>
    </div>
  );
}
```

### Manual Fetch with State

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ClientDataFetcher } from '../lib/dataFetching';

export function ClientComponentManual() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await ClientDataFetcher.fetch('/api/data');

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Optimistic Updates

```typescript
'use client';

import { useState } from 'react';
import { ClientDataFetcher } from '../lib/dataFetching';

export function OptimisticComponent() {
  const [items, setItems] = useState([]);

  const handleAddItem = async (newItem) => {
    // Optimistic update
    const originalItems = [...items];
    setItems([...items, newItem]);

    try {
      // API call
      const result = await ClientDataFetcher.fetch('/api/items', {
        method: 'POST',
        body: newItem,
      });

      if (!result.success) {
        // Rollback on error
        setItems(originalItems);
      }
    } catch (error) {
      // Rollback on error
      setItems(originalItems);
    }
  };

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      <button onClick={() => handleAddItem({ name: 'New Item' })}>
        Add Item
      </button>
    </div>
  );
}
```

## Data Fetching Utilities

### Server Data Fetcher

```typescript
import { ServerDataFetcher } from '../lib/dataFetching';

// Basic fetch with caching
const result = await ServerDataFetcher.fetch('/api/data', {
  cache: 'force-cache',
  revalidate: 3600,
  tags: ['data'],
});

// Fetch with retry
const result = await ServerDataFetcher.fetchWithRetry('/api/data', {
  retries: 3,
  delay: 1000,
});

// Fetch multiple resources
const results = await ServerDataFetcher.fetchMultiple({
  users: '/api/users',
  posts: '/api/posts',
  comments: '/api/comments',
});
```

### Client Data Fetcher

```typescript
import { ClientDataFetcher } from '../lib/dataFetching';

// Basic fetch
const result = await ClientDataFetcher.fetch('/api/data');

// Fetch with loading state
const result = await ClientDataFetcher.fetchWithLoading('/api/data', {
  onLoading: (loading) => setLoading(loading),
  onError: (error) => setError(error),
});

// Optimistic fetch
const result = await ClientDataFetcher.fetchOptimistic('/api/data', {
  optimisticData: newData,
  onOptimisticUpdate: (data) => setData(data),
  onRollback: (data) => setData(data),
});
```

### Query Client

```typescript
import { QueryClient } from '../lib/dataFetching';

const queryClient = new QueryClient();

// Get data with caching
const data = await queryClient.get('key', () => fetch('/api/data'), {
  ttl: 5 * 60 * 1000, // 5 minutes
});

// Invalidate cache
queryClient.invalidate('key');

// Clear all cache
queryClient.clear();
```

## Best Practices

### Server Components

1. **Use for static content**: Server components are perfect for content that doesn't change frequently
2. **Leverage caching**: Use Next.js caching strategies for better performance
3. **Fetch in parallel**: Use `Promise.all()` for multiple data sources
4. **Handle errors gracefully**: Implement proper error boundaries and fallbacks
5. **Use appropriate cache strategies**:
   - `force-cache`: For static data
   - `no-store`: For real-time data
   - `revalidate`: For time-based updates

### Client Components

1. **Use for interactive content**: Client components are best for user interactions
2. **Implement loading states**: Show skeleton loaders or spinners
3. **Handle errors properly**: Provide retry mechanisms and fallback UI
4. **Use optimistic updates**: Update UI immediately for better UX
5. **Cache appropriately**: Use client-side caching for frequently accessed data

### General Guidelines

1. **Choose the right strategy**: Server components for SEO and performance, client components for interactivity
2. **Implement proper loading states**: Always show loading indicators
3. **Handle errors gracefully**: Provide meaningful error messages and retry options
4. **Use TypeScript**: Type your data structures for better development experience
5. **Test your implementations**: Ensure error handling and edge cases work correctly

## Performance Considerations

### Caching Strategies

```typescript
// Server-side caching
const data = await fetch('/api/data', {
  cache: 'force-cache', // Cache indefinitely
  revalidate: 3600, // Revalidate every hour
  tags: ['data'], // Tag for invalidation
});

// Client-side caching
const { data } = useQuery('data', fetcher, {
  ttl: 5 * 60 * 1000, // 5 minutes
});
```

### Loading States

```typescript
// Skeleton loader
function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
    </div>
  );
}

// Progressive loading
function ProgressiveLoader() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2">Loading...</span>
    </div>
  );
}
```

### Error Boundaries

```typescript
// Error boundary for server components
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold text-red-600 mb-4">
        Something went wrong!
      </h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
```

## Error Handling

### Server Component Errors

```typescript
// Safe data fetching with fallback
export default async function SafeComponent() {
  const data = await getServerDataSafe('/api/data', {
    fallback: [], // Return empty array if fetch fails
  });

  if (data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Client Component Errors

```typescript
// Error handling with retry
export function ClientComponentWithRetry() {
  const [retryCount, setRetryCount] = useState(0);
  const { data, loading, error, refetch } = useQuery(
    'data',
    () => fetch('/api/data').then(res => res.json()),
    { enabled: retryCount < 3 }
  );

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    refetch();
  };

  if (error && retryCount >= 3) {
    return (
      <div>
        <p>Failed to load data after 3 attempts</p>
        <button onClick={() => setRetryCount(0)}>Reset</button>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;
  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={handleRetry}>Retry ({retryCount}/3)</button>
      </div>
    );
  }

  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## Summary

Choose the right data fetching strategy based on your requirements:

- **Server Components**: For static content, SEO, and performance
- **Client Components**: For interactivity and real-time updates
- **Hybrid Approach**: Combine both for optimal user experience

Always implement proper loading states, error handling, and caching strategies for the best user experience.
