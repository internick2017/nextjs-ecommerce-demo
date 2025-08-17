import { Suspense, ReactNode } from 'react';
import { AppError } from './errorHandler';

// Suspense configuration interface
export interface SuspenseConfig {
  fallback?: ReactNode;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  errorBoundary?: boolean;
  loadingStrategy?: 'skeleton' | 'spinner' | 'custom';
  cacheStrategy?: 'memory' | 'session' | 'persistent';
}

// Loading state interface
export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
  lastAttempt: number;
  data: any;
}

// Suspense wrapper interface
export interface SuspenseWrapper {
  key: string;
  component: ReactNode;
  config: SuspenseConfig;
  state: LoadingState;
}

// Default suspense configuration
export const defaultSuspenseConfig: SuspenseConfig = {
  fallback: <div>Loading...</div>,
  timeout: 5000,
  retryCount: 3,
  retryDelay: 1000,
  errorBoundary: true,
  loadingStrategy: 'skeleton',
  cacheStrategy: 'memory'
};

// Loading components
export const LoadingComponents = {
  // Skeleton loader
  skeleton: (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  ),

  // Spinner loader
  spinner: (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),

  // Custom loader with progress
  progress: (progress: number = 0) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  ),

  // Content skeleton
  contentSkeleton: (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),

  // Card skeleton
  cardSkeleton: (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-t"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  ),

  // Table skeleton
  tableSkeleton: (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
};

// Suspense cache manager
class SuspenseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const suspenseCache = new SuspenseCache();

// Suspense wrapper component
export function SuspenseWrapper({
  children,
  config = defaultSuspenseConfig,
  cacheKey,
  onError,
  onLoad
}: {
  children: ReactNode;
  config?: SuspenseConfig;
  cacheKey?: string;
  onError?: (error: Error) => void;
  onLoad?: (data: any) => void;
}) {
  const fallback = config.fallback || LoadingComponents[config.loadingStrategy || 'skeleton'];

  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// Async component wrapper
export function withSuspense<T extends any[]>(
  asyncComponent: (...args: T) => Promise<ReactNode>,
  config: SuspenseConfig = defaultSuspenseConfig
) {
  return function SuspenseComponent(...args: T) {
    return (
      <SuspenseWrapper config={config}>
        <AsyncComponent asyncComponent={asyncComponent} args={args} config={config} />
      </SuspenseWrapper>
    );
  };
}

// Async component implementation
function AsyncComponent<T extends any[]>({
  asyncComponent,
  args,
  config
}: {
  asyncComponent: (...args: T) => Promise<ReactNode>;
  args: T;
  config: SuspenseConfig;
}) {
  const [component, setComponent] = React.useState<ReactNode>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    let retryCount = 0;

    const loadComponent = async () => {
      try {
        const result = await asyncComponent(...args);
        if (isMounted) {
          setComponent(result);
        }
      } catch (err) {
        if (isMounted) {
          if (retryCount < (config.retryCount || 3)) {
            retryCount++;
            setTimeout(loadComponent, config.retryDelay || 1000);
          } else {
            setError(err as Error);
          }
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [asyncComponent, args, config]);

  if (error) {
    throw error;
  }

  return component;
}

// Data fetching with suspense
export function useSuspenseQuery<T>(
  queryFn: () => Promise<T>,
  config: SuspenseConfig = defaultSuspenseConfig,
  cacheKey?: string
): T {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Check cache first
        if (cacheKey) {
          const cached = suspenseCache.get(cacheKey);
          if (cached) {
            setData(cached);
            return;
          }
        }

        const result = await queryFn();

        if (isMounted) {
          setData(result);

          // Cache the result
          if (cacheKey) {
            suspenseCache.set(cacheKey, result, config.timeout || 5000);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [queryFn, cacheKey, config.timeout]);

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Promise((resolve) => {
      // This will be caught by Suspense
      setTimeout(resolve, 0);
    });
  }

  return data;
}

// Lazy loading component
export function LazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: SuspenseConfig = defaultSuspenseConfig
) {
  const LazyComponent = React.lazy(importFn);

  return function SuspenseLazyComponent(props: React.ComponentProps<T>) {
    return (
      <SuspenseWrapper config={config}>
        <LazyComponent {...props} />
      </SuspenseWrapper>
    );
  };
}

// Suspense boundary with error handling
export function SuspenseBoundary({
  children,
  fallback,
  onError,
  onRetry
}: {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  onRetry?: () => void;
}) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  if (hasError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Something went wrong</h3>
        <p className="text-red-600 text-sm mt-1">
          {error?.message || 'An unexpected error occurred'}
        </p>
        {onRetry && (
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
              onRetry();
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        setHasError(true);
        setError(error);
        onError?.(error, errorInfo);
      }}
    >
      <Suspense fallback={fallback || LoadingComponents.spinner}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: ReactNode; onError: (error: Error, errorInfo: any) => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: (error: Error, errorInfo: any) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.props.onError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Let parent handle the error UI
    }

    return this.props.children;
  }
}

// Suspense utilities
export const suspenseUtils = {
  // Create cache key
  createCacheKey: (prefix: string, params: Record<string, any> = {}): string => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');

    return sortedParams ? `${prefix}:${sortedParams}` : prefix;
  },

  // Preload component
  preload: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ): void => {
    importFn();
  },

  // Prefetch data
  prefetch: async <T>(
    queryFn: () => Promise<T>,
    cacheKey: string,
    ttl: number = 5 * 60 * 1000
  ): Promise<void> => {
    try {
      const data = await queryFn();
      suspenseCache.set(cacheKey, data, ttl);
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  },

  // Clear cache
  clearCache: (pattern?: string): void => {
    if (pattern) {
      for (const key of suspenseCache.cache.keys()) {
        if (key.includes(pattern)) {
          suspenseCache.delete(key);
        }
      }
    } else {
      suspenseCache.clear();
    }
  },

  // Get cache stats
  getCacheStats: () => ({
    size: suspenseCache.size(),
    keys: Array.from(suspenseCache.cache.keys())
  })
};

// Export cache for direct access
export { suspenseCache };
