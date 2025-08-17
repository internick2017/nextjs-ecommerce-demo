# Database Operations Guide

This guide covers comprehensive database operations including fetching, mutations, caching, real-time updates, and optimistic updates with proper error handling and state management.

## Table of Contents

1. [Database Client](#database-client)
2. [Query Management](#query-management)
3. [Mutation Management](#mutation-management)
4. [React Hooks](#react-hooks)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Optimistic Updates](#optimistic-updates)
7. [Caching Strategies](#caching-strategies)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

## Database Client

The `DatabaseClient` provides the core functionality for database operations.

### Basic Setup

```typescript
import { DatabaseClient } from '../lib/databaseOperations';

const client = new DatabaseClient({
  baseUrl: '/api/database',
  timeout: 30000,
  retries: 3,
  cacheTime: 5 * 60 * 1000, // 5 minutes
  staleTime: 1 * 60 * 1000, // 1 minute
});
```

### Configuration Options

```typescript
interface DatabaseConfig {
  baseUrl: string;           // API base URL
  timeout?: number;          // Request timeout in ms
  retries?: number;          // Number of retry attempts
  cacheTime?: number;        // Cache TTL in ms
  staleTime?: number;        // Data stale time in ms
}
```

### Basic Operations

```typescript
// Execute a query
const users = await client.query('SELECT * FROM users WHERE active = $1', [true]);

// Execute a mutation
const newUser = await client.mutate(
  'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
  ['John Doe', 'john@example.com']
);

// Cache management
client.setCachedData('users', users, 60000); // Cache for 1 minute
const cachedUsers = client.getCachedData('users');
client.invalidateCache('users'); // Clear specific cache
client.invalidateCache(); // Clear all cache
```

## Query Management

The `QueryManager` handles complex query operations with caching and state management.

### Basic Query

```typescript
import { QueryManager } from '../lib/databaseOperations';

const queryManager = new QueryManager(client);

// Register a query
queryManager.registerQuery({
  key: 'users',
  query: 'SELECT * FROM users WHERE active = $1',
  params: [true],
  config: {
    staleTime: 30000,
    cacheTime: 60000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  }
});

// Execute query
const users = await queryManager.executeQuery('users');

// Get query state
const state = queryManager.getQueryState('users');
console.log(state.data, state.loading, state.error, state.isStale);
```

### Query Configuration

```typescript
interface QueryConfig {
  enabled?: boolean;              // Whether to execute the query
  refetchOnWindowFocus?: boolean; // Refetch when window gains focus
  refetchOnReconnect?: boolean;   // Refetch when network reconnects
  refetchInterval?: number;       // Auto-refetch interval in ms
  retry?: boolean;                // Enable retry on failure
  retryDelay?: number;            // Delay between retries
  staleTime?: number;             // Time before data is considered stale
  cacheTime?: number;             // Cache TTL
}
```

### Advanced Queries

```typescript
// Pagination query
const paginatedQuery = {
  key: 'users-page-1',
  query: 'SELECT * FROM users LIMIT $1 OFFSET $2',
  params: [10, 0],
  config: { staleTime: 60000 }
};

// Search query
const searchQuery = {
  key: 'users-search-john',
  query: 'SELECT * FROM users WHERE name ILIKE $1 OR email ILIKE $1',
  params: ['%john%'],
  config: { enabled: true }
};

// Conditional query
const conditionalQuery = {
  key: 'user-orders',
  query: 'SELECT * FROM orders WHERE user_id = $1',
  params: [userId],
  config: { enabled: !!userId }
};
```

## Mutation Management

The `MutationManager` handles data mutations with proper error handling and cache invalidation.

### Basic Mutation

```typescript
import { MutationManager } from '../lib/databaseOperations';

const mutationManager = new MutationManager(client);

// Register a mutation
mutationManager.registerMutation({
  key: 'createUser',
  query: 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
  config: {
    onSuccess: (data) => {
      console.log('User created:', data);
      // Invalidate related queries
      client.invalidateCache('users');
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
    retry: true,
    retryDelay: 1000
  }
});

// Execute mutation
const newUser = await mutationManager.executeMutation('createUser', [
  'Jane Doe',
  'jane@example.com'
]);

// Get mutation state
const state = mutationManager.getMutationState('createUser');
console.log(state.loading, state.error);
```

### Mutation Configuration

```typescript
interface MutationConfig {
  onSuccess?: (data: any) => void;     // Success callback
  onError?: (error: Error) => void;    // Error callback
  onSettled?: (data: any, error: Error | null) => void; // Always called
  retry?: boolean;                     // Enable retry on failure
  retryDelay?: number;                 // Delay between retries
  optimisticUpdate?: boolean;          // Enable optimistic updates
}
```

### CRUD Operations

```typescript
// Create
const createMutation = {
  key: 'createProduct',
  query: 'INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *',
  config: {
    onSuccess: (data) => {
      client.invalidateCache('products');
      client.invalidateCache('productCount');
    }
  }
};

// Read (using queries)
const readQuery = {
  key: 'product',
  query: 'SELECT * FROM products WHERE id = $1',
  params: [productId]
};

// Update
const updateMutation = {
  key: 'updateProduct',
  query: 'UPDATE products SET name = $1, price = $2 WHERE id = $3 RETURNING *',
  config: {
    onSuccess: (data) => {
      client.invalidateCache('products');
      client.invalidateCache(`product-${data.id}`);
    }
  }
};

// Delete
const deleteMutation = {
  key: 'deleteProduct',
  query: 'DELETE FROM products WHERE id = $1 RETURNING *',
  config: {
    onSuccess: (data) => {
      client.invalidateCache('products');
      client.invalidateCache('productCount');
    }
  }
};
```

## React Hooks

### useDatabaseQuery

```typescript
import { useDatabaseQuery } from '../lib/databaseOperations';

function UsersList() {
  const { data, loading, error, refetch, stale } = useDatabaseQuery({
    key: 'users',
    query: 'SELECT * FROM users ORDER BY name',
    config: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30000
    }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {stale && <span>Data may be stale</span>}
      <button onClick={refetch}>Refresh</button>
      {data?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### useDatabaseMutation

```typescript
import { useDatabaseMutation } from '../lib/databaseOperations';

function CreateUserForm() {
  const { mutate, loading, error, data } = useDatabaseMutation({
    key: 'createUser',
    query: 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    config: {
      onSuccess: (data) => {
        console.log('User created:', data);
      },
      onError: (error) => {
        console.error('Failed to create user:', error);
      }
    }
  });

  const handleSubmit = async (formData) => {
    try {
      await mutate([formData.name, formData.email]);
    } catch (error) {
      // Error is handled by onError callback
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {loading && <div>Creating user...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && <div>User created: {data.name}</div>}
      {/* Form fields */}
    </form>
  );
}
```

### useOptimisticMutation

```typescript
import { useOptimisticMutation } from '../lib/databaseOperations';

function ProductList() {
  const { mutate, loading, isOptimistic } = useOptimisticMutation({
    key: 'updateProductStock',
    query: 'UPDATE products SET inStock = $1 WHERE id = $2 RETURNING *'
  }, {
    optimisticData: (params) => ({
      id: params[1],
      inStock: params[0]
    }),
    rollbackOnError: true,
    onSuccess: (data) => {
      console.log('Stock updated:', data);
    }
  });

  const handleStockToggle = async (productId, inStock) => {
    await mutate([inStock, productId]);
  };

  return (
    <div>
      {isOptimistic && <div>⚡ Optimistic update in progress...</div>}
      {/* Product list with stock toggle buttons */}
    </div>
  );
}
```

## Real-time Subscriptions

### useDatabaseSubscription

```typescript
import { useDatabaseSubscription } from '../lib/databaseOperations';

function RealTimeProducts() {
  const { data, connected } = useDatabaseSubscription('products-realtime');

  return (
    <div>
      <div className={`status ${connected ? 'connected' : 'disconnected'}`}>
        {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      {data?.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Manual Subscriptions

```typescript
import { DatabaseClient } from '../lib/databaseOperations';

const client = new DatabaseClient({ baseUrl: '/api/database' });

// Subscribe to updates
const unsubscribe = client.subscribe('products', (data) => {
  console.log('Products updated:', data);
});

// Later, unsubscribe
unsubscribe();

// Notify subscribers (usually done by the server)
client.notifySubscribers('products', newProducts);
```

## Optimistic Updates

### Basic Optimistic Update

```typescript
const { mutate, isOptimistic } = useOptimisticMutation({
  key: 'updateUser',
  query: 'UPDATE users SET name = $1 WHERE id = $2 RETURNING *'
}, {
  optimisticData: (params) => ({
    id: params[1],
    name: params[0]
  }),
  rollbackOnError: true
});

// The UI updates immediately with optimistic data
// If the mutation fails, it rolls back to the original state
```

### Complex Optimistic Updates

```typescript
const { mutate, isOptimistic } = useOptimisticMutation({
  key: 'addToCart',
  query: 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *'
}, {
  optimisticData: (params) => ({
    id: Date.now(), // Temporary ID
    user_id: params[0],
    product_id: params[1],
    quantity: params[2],
    isOptimistic: true
  }),
  rollbackOnError: true,
  onSuccess: (data) => {
    // Replace optimistic data with real data
    updateCartItem(data);
  }
});
```

## Caching Strategies

### Cache Configuration

```typescript
const client = new DatabaseClient({
  baseUrl: '/api/database',
  cacheTime: 5 * 60 * 1000, // 5 minutes default
  staleTime: 1 * 60 * 1000, // 1 minute default
});

// Per-query cache configuration
const query = {
  key: 'users',
  query: 'SELECT * FROM users',
  config: {
    cacheTime: 10 * 60 * 1000, // 10 minutes for this query
    staleTime: 2 * 60 * 1000,  // 2 minutes stale time
  }
};
```

### Cache Invalidation

```typescript
// Invalidate specific cache
client.invalidateCache('users');

// Invalidate multiple caches
client.invalidateCache('users');
client.invalidateCache('userCount');
client.invalidateCache('user-1');

// Invalidate all cache
client.invalidateCache();

// Automatic invalidation after mutations
const mutation = {
  key: 'createUser',
  query: 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
  config: {
    onSuccess: (data) => {
      // Invalidate related queries
      client.invalidateCache('users');
      client.invalidateCache('userCount');
    }
  }
};
```

### Stale-While-Revalidate

```typescript
const { data, loading, stale } = useDatabaseQuery({
  key: 'users',
  query: 'SELECT * FROM users',
  config: {
    staleTime: 30000, // Data becomes stale after 30 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
  }
});

// Show stale data immediately, then update when fresh data arrives
return (
  <div>
    {stale && <span>Data may be stale</span>}
    {data?.map(user => (
      <div key={user.id}>{user.name}</div>
    ))}
  </div>
);
```

## Error Handling

### Query Error Handling

```typescript
const { data, loading, error, refetch } = useDatabaseQuery({
  key: 'users',
  query: 'SELECT * FROM users',
  config: {
    retry: true,
    retryDelay: 1000,
  }
});

if (error) {
  return (
    <div className="error">
      <p>Failed to load users: {error.message}</p>
      <button onClick={refetch}>Retry</button>
    </div>
  );
}
```

### Mutation Error Handling

```typescript
const { mutate, loading, error, reset } = useDatabaseMutation({
  key: 'createUser',
  query: 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
  config: {
    onError: (error) => {
      // Show notification
      showNotification('Failed to create user', 'error');
    },
    retry: true,
    retryDelay: 2000,
  }
});

// Handle errors in component
if (error) {
  return (
    <div className="error">
      <p>Error: {error.message}</p>
      <button onClick={reset}>Clear Error</button>
    </div>
  );
}
```

### Global Error Handling

```typescript
// In your app's error boundary
class DatabaseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Database error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with the database.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Best Practices

### 1. Query Organization

```typescript
// Organize queries by feature
const userQueries = {
  all: {
    key: 'users',
    query: 'SELECT * FROM users ORDER BY name',
    config: { staleTime: 30000 }
  },
  byId: (id: number) => ({
    key: `user-${id}`,
    query: 'SELECT * FROM users WHERE id = $1',
    params: [id],
    config: { staleTime: 60000 }
  }),
  search: (term: string) => ({
    key: `users-search-${term}`,
    query: 'SELECT * FROM users WHERE name ILIKE $1',
    params: [`%${term}%`],
    config: { enabled: term.length > 0 }
  })
};
```

### 2. Mutation Organization

```typescript
// Organize mutations by feature
const userMutations = {
  create: {
    key: 'createUser',
    query: 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    config: {
      onSuccess: (data) => {
        client.invalidateCache('users');
        client.invalidateCache('userCount');
      }
    }
  },
  update: {
    key: 'updateUser',
    query: 'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
    config: {
      onSuccess: (data) => {
        client.invalidateCache('users');
        client.invalidateCache(`user-${data.id}`);
      }
    }
  },
  delete: {
    key: 'deleteUser',
    query: 'DELETE FROM users WHERE id = $1 RETURNING *',
    config: {
      onSuccess: (data) => {
        client.invalidateCache('users');
        client.invalidateCache('userCount');
      }
    }
  }
};
```

### 3. Performance Optimization

```typescript
// Use appropriate cache times
const queries = {
  // Frequently changing data - short cache
  notifications: {
    key: 'notifications',
    query: 'SELECT * FROM notifications WHERE user_id = $1',
    config: { staleTime: 10000, cacheTime: 30000 }
  },
  // Static data - long cache
  categories: {
    key: 'categories',
    query: 'SELECT * FROM categories',
    config: { staleTime: 300000, cacheTime: 600000 }
  },
  // User-specific data - medium cache
  userProfile: {
    key: 'userProfile',
    query: 'SELECT * FROM users WHERE id = $1',
    config: { staleTime: 60000, cacheTime: 300000 }
  }
};
```

### 4. Error Recovery

```typescript
// Implement retry logic with exponential backoff
const mutation = {
  key: 'createUser',
  query: 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
  config: {
    retry: true,
    retryDelay: 1000,
    onError: (error) => {
      if (error.message.includes('network')) {
        // Network error - show retry button
        showRetryButton();
      } else if (error.message.includes('validation')) {
        // Validation error - show form errors
        showValidationErrors(error);
      } else {
        // Unknown error - show generic message
        showGenericError();
      }
    }
  }
};
```

### 5. Real-time Updates

```typescript
// Subscribe to relevant data changes
function Dashboard() {
  const { data: users } = useDatabaseSubscription('users');
  const { data: orders } = useDatabaseSubscription('orders');
  const { data: notifications } = useDatabaseSubscription('notifications');

  return (
    <div>
      <UserList users={users} />
      <OrderList orders={orders} />
      <NotificationPanel notifications={notifications} />
    </div>
  );
}
```

## Summary

The database operations system provides:

- **Comprehensive query management** with caching and state management
- **Robust mutation handling** with error recovery and cache invalidation
- **Real-time subscriptions** for live data updates
- **Optimistic updates** for better user experience
- **Flexible caching strategies** with stale-while-revalidate
- **React hooks** for easy integration
- **Error handling** with retry logic and recovery
- **Performance optimization** with appropriate cache times

Choose the right strategy based on your data requirements and user experience needs.
