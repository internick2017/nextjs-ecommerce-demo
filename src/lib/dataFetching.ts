// Data fetching utilities for both client and server components

// Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  cache?: RequestCache;
  revalidate?: number;
  tags?: string[];
}

// Server-side data fetching utilities
export class ServerDataFetcher {
  // Fetch data on the server with caching
  static async fetch<T>(
    url: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      cache = 'default',
      revalidate,
      tags = []
    } = options;

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        cache,
        next: {
          revalidate,
          tags,
        },
      };

      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Fetch data with automatic retry
  static async fetchWithRetry<T>(
    url: string,
    options: FetchOptions & { retries?: number; delay?: number } = {}
  ): Promise<ApiResponse<T>> {
    const { retries = 3, delay = 1000, ...fetchOptions } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const result = await this.fetch<T>(url, fetchOptions);

      if (result.success) {
        return result;
      }

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    return {
      data: null as T,
      success: false,
      error: `Failed after ${retries} attempts`,
    };
  }

  // Fetch multiple resources in parallel
  static async fetchMultiple<T extends Record<string, string>>(
    urls: T,
    options: FetchOptions = {}
  ): Promise<Record<keyof T, ApiResponse<any>>> {
    const promises = Object.entries(urls).map(async ([key, url]) => {
      const result = await this.fetch(url, options);
      return [key, result] as const;
    });

    const results = await Promise.all(promises);
    return Object.fromEntries(results) as Record<keyof T, ApiResponse<any>>;
  }

  // Fetch data with streaming (for large datasets)
  static async fetchStream<T>(
    url: string,
    options: FetchOptions = {}
  ): Promise<ReadableStream<T>> {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers,
      cache: options.cache,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body as ReadableStream<T>;
  }
}

// Client-side data fetching utilities
export class ClientDataFetcher {
  // Fetch data on the client with error handling
  static async fetch<T>(
    url: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
    } = options;

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      return {
        data: null as T,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Fetch data with loading state management
  static async fetchWithLoading<T>(
    url: string,
    options: FetchOptions & {
      onLoading?: (loading: boolean) => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { onLoading, onError, ...fetchOptions } = options;

    try {
      onLoading?.(true);
      const result = await this.fetch<T>(url, fetchOptions);

      if (!result.success) {
        onError?.(result.error || 'Unknown error');
      }

      return result;
    } finally {
      onLoading?.(false);
    }
  }

  // Fetch data with optimistic updates
  static async fetchOptimistic<T>(
    url: string,
    options: FetchOptions & {
      optimisticData: T;
      onOptimisticUpdate?: (data: T) => void;
      onRollback?: (data: T) => void;
    }
  ): Promise<ApiResponse<T>> {
    const { optimisticData, onOptimisticUpdate, onRollback, ...fetchOptions } = options;

    // Apply optimistic update
    onOptimisticUpdate?.(optimisticData);

    try {
      const result = await this.fetch<T>(url, fetchOptions);

      if (!result.success) {
        // Rollback on error
        onRollback?.(optimisticData);
      }

      return result;
    } catch (error) {
      // Rollback on error
      onRollback?.(optimisticData);
      throw error;
    }
  }
}

// React Query-like utilities for client components
export class QueryClient {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // Get data from cache or fetch if expired
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { ttl?: number } = {}
  ): Promise<T> {
    const { ttl = 5 * 60 * 1000 } = options; // 5 minutes default
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    return data;
  }

  // Invalidate cache
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }
}

// Hooks for client components
export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; enabled?: boolean } = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const queryClient = React.useMemo(() => new QueryClient(), []);

  React.useEffect(() => {
    if (!options.enabled) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await queryClient.get(key, fetcher, options);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, options.enabled, options.ttl]);

  return { data, loading, error, refetch: () => queryClient.invalidate(key) };
}

export function useMutation<T, V>(
  mutator: (variables: V) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  } = {}
) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const mutate = React.useCallback(async (variables: V) => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutator(variables);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutator, options]);

  return { mutate, loading, error };
}

// Server-side data fetching with Next.js cache
export async function getServerData<T>(
  url: string,
  options: {
    cache?: RequestCache;
    revalidate?: number;
    tags?: string[];
  } = {}
): Promise<T> {
  const response = await fetch(url, {
    cache: options.cache || 'default',
    next: {
      revalidate: options.revalidate,
      tags: options.tags,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  return response.json();
}

// Server-side data fetching with error boundaries
export async function getServerDataSafe<T>(
  url: string,
  options: {
    cache?: RequestCache;
    revalidate?: number;
    tags?: string[];
    fallback?: T;
  } = {}
): Promise<T> {
  try {
    return await getServerData<T>(url, options);
  } catch (error) {
    console.error('Failed to fetch server data:', error);
    return options.fallback as T;
  }
}

// Client-side data fetching with SWR-like functionality
export function useSWR<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: {
    refreshInterval?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  } = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!key) return;

    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [key, fetcher]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  React.useEffect(() => {
    if (!options.refreshInterval) return;

    const interval = setInterval(fetchData, options.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, options.refreshInterval]);

  // Revalidate on focus
  React.useEffect(() => {
    if (!options.revalidateOnFocus) return;

    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, options.revalidateOnFocus]);

  // Revalidate on reconnect
  React.useEffect(() => {
    if (!options.revalidateOnReconnect) return;

    const handleOnline = () => fetchData();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchData, options.revalidateOnReconnect]);

  return {
    data,
    loading,
    error,
    mutate: fetchData,
  };
}

// Export utilities
export {
  ServerDataFetcher,
  ClientDataFetcher,
  QueryClient,
  useQuery,
  useMutation,
  getServerData,
  getServerDataSafe,
  useSWR,
};
