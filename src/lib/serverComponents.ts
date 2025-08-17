import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

// Server Component types
export interface ServerComponentProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  cache?: boolean;
  revalidate?: number;
  tags?: string[];
}

// Streaming configuration
export interface StreamingConfig {
  enableStreaming?: boolean;
  chunkSize?: number;
  delay?: number;
  fallback?: React.ReactNode;
  errorBoundary?: boolean;
}

// SSR configuration
export interface SSRConfig {
  enableSSR?: boolean;
  enableHydration?: boolean;
  enablePrefetch?: boolean;
  cacheStrategy?: 'force-cache' | 'no-store' | 'revalidate';
  revalidateTime?: number;
}

// Server-side data fetching utilities
export const serverUtils = {
  // Cached data fetching
  fetchCached: cache(async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
      ...options,
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    return response.json();
  }),

  // Fetch with custom cache strategy
  fetchWithCache: cache(async (
    url: string,
    strategy: 'force-cache' | 'no-store' | 'revalidate' = 'force-cache',
    revalidateTime?: number
  ) => {
    const response = await fetch(url, {
      next: {
        revalidate: strategy === 'revalidate' ? revalidateTime : undefined,
        tags: ['api-data']
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    return response.json();
  }),

  // Get request headers
  getHeaders: cache(() => {
    return headers();
  }),

  // Get user agent
  getUserAgent: cache(() => {
    const headersList = headers();
    return headersList.get('user-agent') || '';
  }),

  // Get client IP
  getClientIP: cache(() => {
    const headersList = headers();
    return headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           headersList.get('x-real-ip') ||
           'unknown';
  }),

  // Check if request is from bot
  isBot: cache(() => {
    const userAgent = serverUtils.getUserAgent();
    return /bot|crawler|spider|crawling/i.test(userAgent);
  }),

  // Get request locale
  getLocale: cache(() => {
    const headersList = headers();
    return headersList.get('accept-language')?.split(',')[0] || 'en';
  })
};

// Server Component wrapper with SSR
export function withSSR<T extends React.ComponentType<any>>(
  Component: T,
  config: SSRConfig = {}
): React.ComponentType<React.ComponentProps<T>> {
  const SSRComponent = async (props: React.ComponentProps<T>) => {
    if (config.enableSSR === false) {
      return <Component {...props} />;
    }

    return (
      <Suspense fallback={config.fallback || <div>Loading...</div>}>
        <Component {...props} />
      </Suspense>
    );
  };

  return SSRComponent as any;
}

// Streaming Server Component
export function StreamingComponent({
  children,
  config = {},
  onChunk,
  onComplete
}: {
  children: React.ReactNode;
  config?: StreamingConfig;
  onChunk?: (chunk: any) => void;
  onComplete?: () => void;
}) {
  if (!config.enableStreaming) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={config.fallback || <div>Streaming...</div>}>
      {children}
    </Suspense>
  );
}

// Server-side data fetching component
export async function ServerDataFetcher<T>({
  url,
  fallback,
  cacheStrategy = 'force-cache',
  revalidateTime,
  children
}: {
  url: string;
  fallback?: React.ReactNode;
  cacheStrategy?: 'force-cache' | 'no-store' | 'revalidate';
  revalidateTime?: number;
  children: (data: T) => React.ReactNode;
}) {
  try {
    const data = await serverUtils.fetchWithCache(url, cacheStrategy, revalidateTime);

    return (
      <Suspense fallback={fallback || <div>Loading data...</div>}>
        {children(data)}
      </Suspense>
    );
  } catch (error) {
    console.error('Server data fetching error:', error);
    return fallback || <div>Error loading data</div>;
  }
}

// Cached server component
export function CachedComponent<T extends React.ComponentType<any>>(
  Component: T,
  revalidateTime: number = 3600
): React.ComponentType<React.ComponentProps<T>> {
  const CachedComponentWrapper = async (props: React.ComponentProps<T>) => {
    return (
      <Suspense fallback={<div>Caching...</div>}>
        <Component {...props} />
      </Suspense>
    );
  };

  return CachedComponentWrapper as any;
}

// Server-side rendered list component
export async function ServerRenderedList<T>({
  items,
  renderItem,
  fallback,
  chunkSize = 10,
  delay = 100
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  fallback?: React.ReactNode;
  chunkSize?: number;
  delay?: number;
}) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  return (
    <div>
      {chunks.map((chunk, chunkIndex) => (
        <Suspense
          key={chunkIndex}
          fallback={fallback || <div>Loading chunk {chunkIndex + 1}...</div>}
        >
          <ChunkRenderer
            items={chunk}
            renderItem={renderItem}
            startIndex={chunkIndex * chunkSize}
            delay={delay}
          />
        </Suspense>
      ))}
    </div>
  );
}

// Chunk renderer component
async function ChunkRenderer<T>({
  items,
  renderItem,
  startIndex,
  delay
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  startIndex: number;
  delay: number;
}) {
  // Simulate processing delay for streaming
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  return (
    <>
      {items.map((item, index) => (
        <div key={startIndex + index}>
          {renderItem(item, startIndex + index)}
        </div>
      ))}
    </>
  );
}

// Server-side search component
export async function ServerSearch({
  query,
  fallback,
  children
}: {
  query: string;
  fallback?: React.ReactNode;
  children: (results: any[]) => React.ReactNode;
}) {
  if (!query) {
    return fallback || <div>Enter a search query</div>;
  }

  try {
    // Simulate server-side search
    const results = await performServerSearch(query);

    return (
      <Suspense fallback={fallback || <div>Searching...</div>}>
        {children(results)}
      </Suspense>
    );
  } catch (error) {
    console.error('Search error:', error);
    return <div>Search failed</div>;
  }
}

// Mock server search function
async function performServerSearch(query: string): Promise<any[]> {
  // Simulate search delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock search results
  return [
    { id: 1, title: `Result 1 for "${query}"`, description: 'Description 1' },
    { id: 2, title: `Result 2 for "${query}"`, description: 'Description 2' },
    { id: 3, title: `Result 3 for "${query}"`, description: 'Description 3' }
  ];
}

// Server-side pagination component
export async function ServerPagination({
  page,
  pageSize,
  totalItems,
  fallback,
  children
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  fallback?: React.ReactNode;
  children: (data: { items: any[]; pagination: any }) => React.ReactNode;
}) {
  try {
    const data = await fetchPaginatedData(page, pageSize, totalItems);

    return (
      <Suspense fallback={fallback || <div>Loading page {page}...</div>}>
        {children(data)}
      </Suspense>
    );
  } catch (error) {
    console.error('Pagination error:', error);
    return <div>Failed to load page</div>;
  }
}

// Mock pagination data fetching
async function fetchPaginatedData(page: number, pageSize: number, totalItems: number) {
  await new Promise(resolve => setTimeout(resolve, 300));

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = Array.from({ length: Math.min(pageSize, totalItems - startIndex) }, (_, i) => ({
    id: startIndex + i + 1,
    title: `Item ${startIndex + i + 1}`,
    description: `Description for item ${startIndex + i + 1}`
  }));

  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      hasNext: page < Math.ceil(totalItems / pageSize),
      hasPrev: page > 1
    }
  };
}

// Server-side metadata component
export function ServerMetadata({
  title,
  description,
  keywords,
  image,
  type = 'website'
}: {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  type?: string;
}) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </>
  );
}

// Server-side redirect component
export function ServerRedirect({
  to,
  permanent = false
}: {
  to: string;
  permanent?: boolean;
}) {
  redirect(to);
}

// Server-side error boundary
export function ServerErrorBoundary({
  children,
  fallback
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Server error:', error);
    return fallback || <div>Something went wrong on the server</div>;
  }
}

// Server-side performance monitoring
export function ServerPerformanceMonitor({
  componentName,
  children
}: {
  componentName: string;
  children: React.ReactNode;
}) {
  const startTime = Date.now();

  // Log server-side render time
  console.log(`[Server] ${componentName} render started at ${startTime}`);

  return (
    <>
      {children}
      {/* This will be executed on the server */}
      {(() => {
        const endTime = Date.now();
        console.log(`[Server] ${componentName} render completed in ${endTime - startTime}ms`);
        return null;
      })()}
    </>
  );
}

// Server-side cache utilities
export const serverCache = {
  // Set cache with tags
  set: async (key: string, value: any, tags: string[] = []) => {
    // In a real implementation, this would use Redis or similar
    console.log(`[Server Cache] Setting ${key} with tags: ${tags.join(', ')}`);
  },

  // Get cache value
  get: async (key: string) => {
    // In a real implementation, this would use Redis or similar
    console.log(`[Server Cache] Getting ${key}`);
    return null;
  },

  // Invalidate cache by tags
  invalidate: async (tags: string[]) => {
    console.log(`[Server Cache] Invalidating tags: ${tags.join(', ')}`);
  },

  // Clear all cache
  clear: async () => {
    console.log('[Server Cache] Clearing all cache');
  }
};

// Server-side analytics
export function ServerAnalytics({
  event,
  data,
  children
}: {
  event: string;
  data?: Record<string, any>;
  children: React.ReactNode;
}) {
  // Log server-side analytics
  console.log(`[Server Analytics] Event: ${event}`, data);

  return <>{children}</>;
}

// Export utilities
export {
  serverUtils,
  withSSR,
  StreamingComponent,
  ServerDataFetcher,
  CachedComponent,
  ServerRenderedList,
  ServerSearch,
  ServerPagination,
  ServerMetadata,
  ServerRedirect,
  ServerErrorBoundary,
  ServerPerformanceMonitor,
  serverCache,
  ServerAnalytics
};
