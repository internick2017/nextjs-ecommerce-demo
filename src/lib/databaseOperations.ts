import React from 'react';

// Types for database operations
export interface DatabaseConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  cacheTime?: number;
  staleTime?: number;
}

export interface QueryConfig {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchInterval?: number;
  retry?: boolean;
  retryDelay?: number;
  staleTime?: number;
  cacheTime?: number;
}

export interface MutationConfig {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onSettled?: (data: any, error: Error | null) => void;
  retry?: boolean;
  retryDelay?: number;
  optimisticUpdate?: boolean;
}

export interface DatabaseQuery<T = any> {
  key: string;
  query: string;
  params?: any[];
  config?: QueryConfig;
}

export interface DatabaseMutation<T = any> {
  key: string;
  query: string;
  params?: any[];
  config?: MutationConfig;
}

// Database client for handling connections and operations
export class DatabaseClient {
  private config: DatabaseConfig;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private subscribers = new Map<string, Set<(data: any) => void>>();

  constructor(config: DatabaseConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      cacheTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 1 * 60 * 1000, // 1 minute
      ...config
    };
  }

  // Execute a query
  async query<T>(query: string, params: any[] = []): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, params }),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      throw new Error(`Database query failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Execute a mutation
  async mutate<T>(query: string, params: any[] = []): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, params }),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      throw new Error(`Database mutation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Cache management
  getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }

  setCachedData<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTime!
    });
  }

  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Real-time subscriptions
  subscribe(key: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  notifySubscribers(key: string, data: any): void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

// Query manager for handling complex queries
export class QueryManager {
  private client: DatabaseClient;
  private queries = new Map<string, DatabaseQuery>();
  private results = new Map<string, any>();
  private loadingStates = new Map<string, boolean>();
  private errorStates = new Map<string, Error | null>();

  constructor(client: DatabaseClient) {
    this.client = client;
  }

  // Register a query
  registerQuery<T>(query: DatabaseQuery<T>): void {
    this.queries.set(query.key, query);
  }

  // Execute a query
  async executeQuery<T>(key: string, forceRefresh = false): Promise<T> {
    const query = this.queries.get(key);
    if (!query) {
      throw new Error(`Query not found: ${key}`);
    }

    // Check cache first
    if (!forceRefresh) {
      const cached = this.client.getCachedData<T>(key);
      if (cached) {
        return cached;
      }
    }

    // Set loading state
    this.loadingStates.set(key, true);
    this.errorStates.set(key, null);

    try {
      const data = await this.client.query<T>(query.query, query.params);

      // Cache the result
      this.client.setCachedData(key, data, query.config?.cacheTime);

      // Store result
      this.results.set(key, data);

      // Notify subscribers
      this.client.notifySubscribers(key, data);

      return data;
    } catch (error) {
      const dbError = error instanceof Error ? error : new Error('Unknown error');
      this.errorStates.set(key, dbError);
      throw dbError;
    } finally {
      this.loadingStates.set(key, false);
    }
  }

  // Get query state
  getQueryState(key: string) {
    return {
      data: this.results.get(key),
      loading: this.loadingStates.get(key) || false,
      error: this.errorStates.get(key),
      isStale: this.isStale(key)
    };
  }

  // Check if data is stale
  private isStale(key: string): boolean {
    const query = this.queries.get(key);
    if (!query) return true;

    const cached = this.client.getCachedData(key);
    if (!cached) return true;

    const staleTime = query.config?.staleTime || 60000; // 1 minute default
    return Date.now() - (cached as any).timestamp > staleTime;
  }

  // Invalidate query
  invalidateQuery(key: string): void {
    this.client.invalidateCache(key);
    this.results.delete(key);
    this.errorStates.delete(key);
  }
}

// Mutation manager for handling data mutations
export class MutationManager {
  private client: DatabaseClient;
  private mutations = new Map<string, DatabaseMutation>();
  private loadingStates = new Map<string, boolean>();
  private errorStates = new Map<string, Error | null>();

  constructor(client: DatabaseClient) {
    this.client = client;
  }

  // Register a mutation
  registerMutation<T>(mutation: DatabaseMutation<T>): void {
    this.mutations.set(mutation.key, mutation);
  }

  // Execute a mutation
  async executeMutation<T>(key: string, params?: any[]): Promise<T> {
    const mutation = this.mutations.get(key);
    if (!mutation) {
      throw new Error(`Mutation not found: ${key}`);
    }

    // Set loading state
    this.loadingStates.set(key, true);
    this.errorStates.set(key, null);

    try {
      const data = await this.client.mutate<T>(
        mutation.query,
        params || mutation.params || []
      );

      // Call success callback
      mutation.config?.onSuccess?.(data);

      // Invalidate related queries
      this.invalidateRelatedQueries(key);

      return data;
    } catch (error) {
      const dbError = error instanceof Error ? error : new Error('Unknown error');
      this.errorStates.set(key, dbError);

      // Call error callback
      mutation.config?.onError?.(dbError);

      throw dbError;
    } finally {
      this.loadingStates.set(key, false);

      // Call settled callback
      const error = this.errorStates.get(key);
      mutation.config?.onSettled?.(this.results.get(key), error);
    }
  }

  // Get mutation state
  getMutationState(key: string) {
    return {
      loading: this.loadingStates.get(key) || false,
      error: this.errorStates.get(key)
    };
  }

  // Invalidate related queries after mutation
  private invalidateRelatedQueries(mutationKey: string): void {
    // This is a simple implementation - you might want to implement
    // a more sophisticated invalidation strategy based on your needs
    const relatedQueries = this.getRelatedQueries(mutationKey);
    relatedQueries.forEach(queryKey => {
      this.client.invalidateCache(queryKey);
    });
  }

  private getRelatedQueries(mutationKey: string): string[] {
    // Simple mapping - you can implement more sophisticated logic
    const mappings: Record<string, string[]> = {
      'createUser': ['users', 'userCount'],
      'updateUser': ['users', 'user'],
      'deleteUser': ['users', 'userCount'],
      'createProduct': ['products', 'productCount'],
      'updateProduct': ['products', 'product'],
      'deleteProduct': ['products', 'productCount'],
      'createOrder': ['orders', 'orderCount', 'userOrders'],
      'updateOrder': ['orders', 'order'],
      'deleteOrder': ['orders', 'orderCount', 'userOrders'],
    };

    return mappings[mutationKey] || [];
  }
}

// React hooks for database operations
export function useDatabaseQuery<T>(
  query: DatabaseQuery<T>,
  config?: QueryConfig
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [stale, setStale] = React.useState(false);

  const queryManager = React.useMemo(() => {
    const client = new DatabaseClient({ baseUrl: '/api/database' });
    return new QueryManager(client);
  }, []);

  const executeQuery = React.useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      queryManager.registerQuery(query);
      const result = await queryManager.executeQuery<T>(query.key, forceRefresh);

      setData(result);
      setStale(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [query, queryManager]);

  // Initial fetch
  React.useEffect(() => {
    if (config?.enabled !== false) {
      executeQuery();
    }
  }, [executeQuery, config?.enabled]);

  // Refetch on window focus
  React.useEffect(() => {
    if (config?.refetchOnWindowFocus) {
      const handleFocus = () => {
        if (stale) {
          executeQuery(true);
        }
      };
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [executeQuery, stale, config?.refetchOnWindowFocus]);

  // Refetch on reconnect
  React.useEffect(() => {
    if (config?.refetchOnReconnect) {
      const handleOnline = () => {
        executeQuery(true);
      };
      window.addEventListener('online', handleOnline);
      return () => window.removeEventListener('online', handleOnline);
    }
  }, [executeQuery, config?.refetchOnReconnect]);

  // Refetch interval
  React.useEffect(() => {
    if (config?.refetchInterval) {
      const interval = setInterval(() => {
        executeQuery(true);
      }, config.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [executeQuery, config?.refetchInterval]);

  // Mark as stale after staleTime
  React.useEffect(() => {
    if (config?.staleTime && data) {
      const timer = setTimeout(() => {
        setStale(true);
      }, config.staleTime);
      return () => clearTimeout(timer);
    }
  }, [data, config?.staleTime]);

  return {
    data,
    loading,
    error,
    stale,
    refetch: () => executeQuery(true),
    invalidate: () => queryManager.invalidateQuery(query.key)
  };
}

export function useDatabaseMutation<T>(
  mutation: DatabaseMutation<T>,
  config?: MutationConfig
) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const mutationManager = React.useMemo(() => {
    const client = new DatabaseClient({ baseUrl: '/api/database' });
    return new MutationManager(client);
  }, []);

  const executeMutation = React.useCallback(async (params?: any[]) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      mutationManager.registerMutation(mutation);
      const result = await mutationManager.executeMutation<T>(mutation.key, params);

      setData(result);
      config?.onSuccess?.(result);

      return result;
    } catch (err) {
      const dbError = err instanceof Error ? err : new Error('Unknown error');
      setError(dbError);
      config?.onError?.(dbError);
      throw dbError;
    } finally {
      setLoading(false);
      config?.onSettled?.(data, error);
    }
  }, [mutation, mutationManager, config, data, error]);

  return {
    mutate: executeMutation,
    loading,
    error,
    data,
    reset: () => {
      setError(null);
      setData(null);
    }
  };
}

// Optimistic updates hook
export function useOptimisticMutation<T>(
  mutation: DatabaseMutation<T>,
  config?: MutationConfig & {
    optimisticData?: (params: any[]) => T;
    rollbackOnError?: boolean;
  }
) {
  const [optimisticData, setOptimisticData] = React.useState<T | null>(null);
  const [originalData, setOriginalData] = React.useState<T | null>(null);

  const { mutate, loading, error, data, reset } = useDatabaseMutation(mutation, {
    ...config,
    onSuccess: (result) => {
      setOptimisticData(null);
      setOriginalData(null);
      config?.onSuccess?.(result);
    },
    onError: (err) => {
      if (config?.rollbackOnError && originalData) {
        setOptimisticData(originalData);
      }
      config?.onError?.(err);
    }
  });

  const optimisticMutate = React.useCallback(async (params?: any[]) => {
    if (config?.optimisticData && params) {
      const optimistic = config.optimisticData(params);
      setOptimisticData(optimistic);
      setOriginalData(data);
    }

    return mutate(params);
  }, [mutate, config, data]);

  return {
    mutate: optimisticMutate,
    loading,
    error,
    data: optimisticData || data,
    reset,
    isOptimistic: optimisticData !== null
  };
}

// Real-time subscription hook
export function useDatabaseSubscription<T>(
  key: string,
  initialData?: T
) {
  const [data, setData] = React.useState<T | null>(initialData || null);
  const [connected, setConnected] = React.useState(false);

  React.useEffect(() => {
    const client = new DatabaseClient({ baseUrl: '/api/database' });

    const unsubscribe = client.subscribe(key, (newData) => {
      setData(newData);
      setConnected(true);
    });

    return unsubscribe;
  }, [key]);

  return {
    data,
    connected,
    subscribe: (callback: (data: T) => void) => {
      const client = new DatabaseClient({ baseUrl: '/api/database' });
      return client.subscribe(key, callback);
    }
  };
}

// Utility functions for common database operations
export const databaseUtils = {
  // Create query builders
  createSelectQuery: (table: string, columns: string[] = ['*'], where?: Record<string, any>) => {
    let query = `SELECT ${columns.join(', ')} FROM ${table}`;
    const params: any[] = [];

    if (where) {
      const conditions = Object.entries(where).map(([key, value], index) => {
        params.push(value);
        return `${key} = $${index + 1}`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    return { query, params };
  },

  createInsertQuery: (table: string, data: Record<string, any>) => {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    return { query, params: values };
  },

  createUpdateQuery: (table: string, data: Record<string, any>, where: Record<string, any>) => {
    const setColumns = Object.keys(data);
    const setValues = Object.values(data);
    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);

    const setClause = setColumns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    const whereClause = whereColumns.map((col, index) => `${col} = $${setValues.length + index + 1}`).join(' AND ');

    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
    const params = [...setValues, ...whereValues];

    return { query, params };
  },

  createDeleteQuery: (table: string, where: Record<string, any>) => {
    const columns = Object.keys(where);
    const values = Object.values(where);

    const whereClause = columns.map((col, index) => `${col} = $${index + 1}`).join(' AND ');
    const query = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;

    return { query, params: values };
  },

  // Pagination helpers
  createPaginationQuery: (table: string, page: number, limit: number, where?: Record<string, any>) => {
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM ${table}`;
    const params: any[] = [];

    if (where) {
      const conditions = Object.entries(where).map(([key, value], index) => {
        params.push(value);
        return `${key} = $${index + 1}`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    return { query, params };
  },

  // Search helpers
  createSearchQuery: (table: string, searchTerm: string, columns: string[]) => {
    const searchConditions = columns.map((col, index) => `${col} ILIKE $${index + 1}`).join(' OR ');
    const query = `SELECT * FROM ${table} WHERE ${searchConditions}`;
    const params = columns.map(() => `%${searchTerm}%`);

    return { query, params };
  }
};

// Export all utilities
export {
  DatabaseClient,
  QueryManager,
  MutationManager,
  databaseUtils
};
