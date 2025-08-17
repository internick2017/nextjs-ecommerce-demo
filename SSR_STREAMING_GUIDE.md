# SSR & Streaming Guide

This document provides a comprehensive guide to Server-Side Rendering (SSR), streaming, and React Server Components implemented in the Next.js e-commerce application using the App Router.

## Overview

The SSR and streaming system provides advanced server-side rendering capabilities with streaming support, React Server Components, and comprehensive performance optimizations for the Next.js App Router.

## Architecture

### Core Components

1. **ServerComponents** (`src/lib/serverComponents.ts`)
   - Server-side data fetching utilities
   - Streaming components
   - SSR wrappers
   - Performance monitoring
   - Cache management

2. **Server Products** (`src/app/(shop)/products/ServerProducts.tsx`)
   - Server-side rendered product pages
   - Streaming product grids
   - Server-side search and filtering
   - Pagination with SSR

3. **SSR Demo** (`src/app/ssr-streaming-demo/page.tsx`)
   - Comprehensive demo of SSR features
   - Streaming examples
   - Server metrics
   - Performance monitoring

## Server-Side Rendering (SSR)

### Basic SSR Usage
```typescript
import { withSSR } from '../../../lib/serverComponents';

const MyComponent = ({ data }: { data: any }) => {
  return <div>{data.title}</div>;
};

const SSRComponent = withSSR(MyComponent, {
  enableSSR: true,
  enableHydration: true,
  cacheStrategy: 'force-cache'
});
```

### SSR Configuration
```typescript
interface SSRConfig {
  enableSSR?: boolean;           // Enable server-side rendering
  enableHydration?: boolean;     // Enable client-side hydration
  enablePrefetch?: boolean;      // Enable prefetching
  cacheStrategy?: 'force-cache' | 'no-store' | 'revalidate';
  revalidateTime?: number;       // Revalidation time in seconds
}
```

### Server-Side Data Fetching
```typescript
import { ServerDataFetcher } from '../../../lib/serverComponents';

const MyPage = () => {
  return (
    <ServerDataFetcher
      url="/api/data"
      cacheStrategy="revalidate"
      revalidateTime={300}
      fallback={<div>Loading...</div>}
    >
      {(data) => (
        <div>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
        </div>
      )}
    </ServerDataFetcher>
  );
};
```

### Cached Server Components
```typescript
import { CachedComponent } from '../../../lib/serverComponents';

const ExpensiveComponent = ({ data }: { data: any }) => {
  return <div>{/* Expensive rendering logic */}</div>;
};

const CachedExpensiveComponent = CachedComponent(ExpensiveComponent, 3600); // Cache for 1 hour
```

## Streaming SSR

### Streaming Component
```typescript
import { StreamingComponent } from '../../../lib/serverComponents';

const MyPage = () => {
  return (
    <StreamingComponent
      config={{
        enableStreaming: true,
        chunkSize: 10,
        delay: 100,
        fallback: <div>Streaming...</div>
      }}
    >
      <ExpensiveContent />
    </StreamingComponent>
  );
};
```

### Streaming Configuration
```typescript
interface StreamingConfig {
  enableStreaming?: boolean;     // Enable streaming
  chunkSize?: number;            // Items per chunk
  delay?: number;                // Delay between chunks (ms)
  fallback?: ReactNode;          // Fallback component
  errorBoundary?: boolean;       // Enable error boundary
}
```

### Server-Rendered Lists with Streaming
```typescript
import { ServerRenderedList } from '../../../lib/serverComponents';

const MyList = ({ items }: { items: any[] }) => {
  return (
    <ServerRenderedList
      items={items}
      renderItem={(item, index) => (
        <div key={item.id} className="p-4 border">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      )}
      fallback={<div>Loading items...</div>}
      chunkSize={5}
      delay={200}
    />
  );
};
```

## React Server Components

### Server Component Basics
```typescript
// This is a server component (no 'use client' directive)
async function ServerComponent({ id }: { id: string }) {
  // This runs on the server
  const data = await fetchData(id);

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
    </div>
  );
}
```

### Server-Side Search
```typescript
import { ServerSearch } from '../../../lib/serverComponents';

const SearchPage = ({ query }: { query: string }) => {
  return (
    <ServerSearch
      query={query}
      fallback={<div>Searching...</div>}
    >
      {(results) => (
        <div>
          {results.map(result => (
            <div key={result.id}>{result.title}</div>
          ))}
        </div>
      )}
    </ServerSearch>
  );
};
```

### Server-Side Pagination
```typescript
import { ServerPagination } from '../../../lib/serverComponents';

const PaginatedPage = ({ page, pageSize }: { page: number; pageSize: number }) => {
  return (
    <ServerPagination
      page={page}
      pageSize={pageSize}
      totalItems={1000}
      fallback={<div>Loading page...</div>}
    >
      {(data) => (
        <div>
          <div className="grid">
            {data.items.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
          <PaginationControls pagination={data.pagination} />
        </div>
      )}
    </ServerPagination>
  );
};
```

## Server Utilities

### Data Fetching Utilities
```typescript
import { serverUtils } from '../../../lib/serverComponents';

// Cached fetching
const data = await serverUtils.fetchCached('/api/data');

// Fetch with custom cache strategy
const data = await serverUtils.fetchWithCache('/api/data', 'revalidate', 300);

// Get request information
const userAgent = await serverUtils.getUserAgent();
const clientIP = await serverUtils.getClientIP();
const isBot = await serverUtils.isBot();
const locale = await serverUtils.getLocale();
```

### Server Cache Management
```typescript
import { serverCache } from '../../../lib/serverComponents';

// Set cache with tags
await serverCache.set('key', value, ['tag1', 'tag2']);

// Get cache value
const value = await serverCache.get('key');

// Invalidate cache by tags
await serverCache.invalidate(['tag1', 'tag2']);

// Clear all cache
await serverCache.clear();
```

## Performance Monitoring

### Server Performance Monitor
```typescript
import { ServerPerformanceMonitor } from '../../../lib/serverComponents';

const MyPage = () => {
  return (
    <ServerPerformanceMonitor componentName="MyPage">
      <ExpensiveComponent />
    </ServerPerformanceMonitor>
  );
};
```

### Server Analytics
```typescript
import { ServerAnalytics } from '../../../lib/serverComponents';

const MyPage = () => {
  return (
    <ServerAnalytics
      event="page_view"
      data={{
        page: 'home',
        userAgent: await serverUtils.getUserAgent(),
        clientIP: await serverUtils.getClientIP(),
        isBot: await serverUtils.isBot()
      }}
    >
      <PageContent />
    </ServerAnalytics>
  );
};
```

## Metadata and SEO

### Server-Side Metadata
```typescript
import { ServerMetadata } from '../../../lib/serverComponents';

const MyPage = () => {
  return (
    <>
      <ServerMetadata
        title="My Page Title"
        description="Page description for SEO"
        keywords="keyword1, keyword2"
        image="/og-image.jpg"
        type="website"
      />
      <PageContent />
    </>
  );
};
```

### Server-Side Redirects
```typescript
import { ServerRedirect } from '../../../lib/serverComponents';

const RedirectPage = () => {
  // This will redirect on the server
  return <ServerRedirect to="/new-page" permanent={false} />;
};
```

## Error Handling

### Server Error Boundary
```typescript
import { ServerErrorBoundary } from '../../../lib/serverComponents';

const MyPage = () => {
  return (
    <ServerErrorBoundary fallback={<div>Server error occurred</div>}>
      <RiskyComponent />
    </ServerErrorBoundary>
  );
};
```

## Advanced Features

### Progressive Hydration
```typescript
'use client';

import { Suspense } from 'react';

const ClientComponent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InteractiveComponent />
    </Suspense>
  );
};

// Server component
async function ServerPage() {
  return (
    <div>
      <ServerContent />
      <ClientComponent />
    </div>
  );
}
```

### Selective Hydration
```typescript
'use client';

import { useState } from 'react';

const HydratedComponent = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div>
      {isHydrated ? <InteractiveContent /> : <StaticContent />}
    </div>
  );
};
```

### Streaming with Suspense
```typescript
import { Suspense } from 'react';

const StreamingPage = () => {
  return (
    <div>
      <Header />
      <Suspense fallback={<div>Loading main content...</div>}>
        <MainContent />
      </Suspense>
      <Suspense fallback={<div>Loading sidebar...</div>}>
        <Sidebar />
      </Suspense>
      <Footer />
    </div>
  );
};
```

## Configuration

### Next.js Configuration
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['example.com'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Environment Variables
```env
# SSR Configuration
NEXT_PUBLIC_ENABLE_SSR=true
NEXT_PUBLIC_ENABLE_STREAMING=true
NEXT_PUBLIC_STREAMING_CHUNK_SIZE=10
NEXT_PUBLIC_STREAMING_DELAY=100

# Cache Configuration
NEXT_PUBLIC_CACHE_STRATEGY=revalidate
NEXT_PUBLIC_REVALIDATE_TIME=300

# Performance Monitoring
NEXT_PUBLIC_ENABLE_SERVER_MONITORING=true
NEXT_PUBLIC_ENABLE_SERVER_ANALYTICS=true
```

## Best Practices

### SSR Best Practices
1. **Use server components by default** - Only add 'use client' when necessary
2. **Implement proper caching** - Use appropriate cache strategies
3. **Handle errors gracefully** - Use error boundaries
4. **Optimize data fetching** - Use parallel requests when possible
5. **Monitor performance** - Track server-side metrics

### Streaming Best Practices
1. **Stream critical content first** - Prioritize above-the-fold content
2. **Use appropriate chunk sizes** - Balance performance and UX
3. **Provide meaningful fallbacks** - Show loading states
4. **Handle errors in chunks** - Don't let one chunk break the stream
5. **Monitor streaming performance** - Track chunk delivery times

### Performance Best Practices
1. **Minimize server-side JavaScript** - Keep server components lightweight
2. **Use edge caching** - Leverage CDN caching
3. **Implement proper revalidation** - Balance freshness and performance
4. **Monitor bundle sizes** - Keep client-side code minimal
5. **Use progressive enhancement** - Ensure basic functionality without JS

## Testing

### Using the Demo Page
1. Navigate to `/ssr-streaming-demo`
2. Test different streaming configurations
3. Monitor server-side metrics
4. Test search and pagination
5. Observe performance differences

### Manual Testing
```typescript
// Test server component
const TestServerComponent = async () => {
  const data = await serverUtils.fetchCached('/api/test');
  return <div>{data.title}</div>;
};

// Test streaming
const TestStreaming = () => {
  return (
    <StreamingComponent config={{ enableStreaming: true, chunkSize: 5 }}>
      <TestServerComponent />
    </StreamingComponent>
  );
};

// Test performance monitoring
const TestPerformance = () => {
  return (
    <ServerPerformanceMonitor componentName="TestComponent">
      <TestServerComponent />
    </ServerPerformanceMonitor>
  );
};
```

## Production Considerations

### Performance Optimization
1. **Enable compression** - Use gzip/brotli compression
2. **Implement caching headers** - Set appropriate cache-control headers
3. **Use edge functions** - Deploy to edge locations
4. **Monitor Core Web Vitals** - Track LCP, FID, CLS
5. **Optimize images** - Use next/image with proper formats

### SEO Optimization
1. **Implement proper metadata** - Use ServerMetadata component
2. **Generate sitemaps** - Create dynamic sitemaps
3. **Handle robots.txt** - Configure search engine crawling
4. **Implement structured data** - Add JSON-LD markup
5. **Optimize for Core Web Vitals** - Ensure good performance scores

### Security Considerations
1. **Validate server-side data** - Sanitize all inputs
2. **Implement rate limiting** - Protect against abuse
3. **Use secure headers** - Set security headers
4. **Handle sensitive data** - Don't expose sensitive information
5. **Implement proper authentication** - Secure server-side routes

## Conclusion

The SSR and streaming system provides comprehensive server-side rendering capabilities with streaming support, React Server Components, and advanced performance optimizations. It enables fast, SEO-friendly applications with excellent user experience.

For more information, refer to the demo page at `/ssr-streaming-demo` and the individual component documentation.
