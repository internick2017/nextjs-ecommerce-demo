# Redirects & Cache System Guide

This document provides a comprehensive guide to the redirects and cache handling system implemented in the Next.js e-commerce application.

## Overview

The redirects and cache system provides robust URL redirection management and advanced caching strategies for optimal performance and user experience.

## Redirect System

### Architecture

#### Core Components

1. **RedirectHandler** (`src/lib/redirectHandler.ts`)
   - Rule-based redirect management
   - Pattern matching with conditions
   - Redirect tracking and statistics
   - URL validation and security

2. **RedirectRule** Interface
   - Pattern matching (string or RegExp)
   - Destination configuration
   - Conditional redirects
   - Priority-based execution

3. **RedirectType** Enum
   - 301: Permanent Redirect
   - 302: Temporary Redirect
   - 303: See Other
   - 304: Not Modified
   - 307: Temporary (Preserve Method)
   - 308: Permanent (Preserve Method)

### Redirect Configuration

#### Basic Redirect Rule
```typescript
const redirectRule: RedirectRule = {
  pattern: '/old-page',
  destination: '/new-page',
  config: {
    type: RedirectType.PERMANENT,
    preserveQuery: true,
    addTracking: true
  },
  priority: 100
};
```

#### Pattern Matching
```typescript
// String pattern (exact match)
pattern: '/exact-path'

// String pattern (starts with)
pattern: '/api/'

// Regular expression
pattern: /^\/products\/(\d+)$/

// Dynamic destination
destination: (request: NextRequest) => {
  const url = new URL(request.url);
  const id = url.pathname.match(/\/products\/(\d+)/)?.[1];
  return `/new-products/${id}`;
}
```

#### Conditional Redirects
```typescript
const conditionalRule: RedirectRule = {
  pattern: '/mobile-page',
  destination: '/mobile-optimized',
  conditions: {
    userAgent: /mobile|android|iphone/i,
    referer: /google\.com/,
    queryParams: { source: 'mobile' },
    headers: { 'x-device': 'mobile' }
  }
};
```

### Redirect Types

#### 301 - Permanent Redirect
```typescript
redirectUtils.permanent('/new-location');
// Sets Cache-Control: public, max-age=31536000 (1 year)
```

#### 302 - Temporary Redirect
```typescript
redirectUtils.temporary('/temporary-location');
// Sets Cache-Control: public, max-age=3600 (1 hour)
```

#### 303 - See Other (for POST redirects)
```typescript
redirectUtils.seeOther('/success-page');
// Changes method to GET
```

#### 307/308 - Method Preserving
```typescript
redirectUtils.temporaryPreserveMethod('/api/new-endpoint');
redirectUtils.permanentPreserveMethod('/api/new-endpoint');
// Preserves HTTP method
```

### Common Redirect Rules

#### Remove Trailing Slashes
```typescript
{
  pattern: /^(.+)\/$/,
  destination: (request: NextRequest) => {
    const url = new URL(request.url);
    return url.pathname.slice(0, -1) + url.search;
  },
  config: { type: RedirectType.PERMANENT },
  priority: 100
}
```

#### Force HTTPS
```typescript
{
  pattern: /^http:/,
  destination: (request: NextRequest) => {
    const url = new URL(request.url);
    return url.href.replace('http:', 'https:');
  },
  config: { type: RedirectType.PERMANENT },
  priority: 90,
  conditions: {
    userAgent: /^(?!.*bot|spider|crawl)/i
  }
}
```

#### WWW to Non-WWW
```typescript
{
  pattern: /^https:\/\/www\./,
  destination: (request: NextRequest) => {
    const url = new URL(request.url);
    return url.href.replace('www.', '');
  },
  config: { type: RedirectType.PERMANENT },
  priority: 80
}
```

### Redirect Tracking

#### Tracking Data
```typescript
interface RedirectTracking {
  originalUrl: string;
  destinationUrl: string;
  redirectType: RedirectType;
  timestamp: string;
  userAgent?: string;
  referer?: string;
  ip?: string;
  queryParams?: Record<string, string>;
}
```

#### Statistics
```typescript
const stats = redirectHandler.getRedirectStats();
// Returns:
// - totalRedirects: number
// - redirectsByType: Record<RedirectType, number>
// - redirectsByPath: Record<string, number>
// - recentRedirects: RedirectTracking[]
```

### Middleware Integration

#### With Redirects Middleware
```typescript
const handler = withRedirects([
  {
    pattern: '/old-api',
    destination: '/api/v2',
    config: { type: RedirectType.PERMANENT }
  }
])(yourHandler);
```

## Cache System

### Architecture

#### Core Components

1. **CacheHandler** (`src/lib/cacheHandler.ts`)
   - Multi-strategy caching
   - Cache invalidation
   - Statistics and monitoring
   - ETag support

2. **Cache Types**
   - Memory Cache (default)
   - HTTP Cache
   - Redis Cache (planned)
   - File Cache (planned)

3. **Cache Configuration**
   - TTL (Time To Live)
   - Size limits
   - Entry limits
   - Compression
   - Namespacing

### Cache Configuration

#### Basic Configuration
```typescript
const cacheConfig: CacheConfig = {
  type: CacheType.MEMORY,
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100 * 1024 * 1024, // 100MB
  maxEntries: 1000,
  compression: false,
  namespace: 'api'
};
```

#### Cache Presets
```typescript
// Short-term cache (1 minute)
cachePresets.short

// Medium-term cache (5 minutes)
cachePresets.medium

// Long-term cache (1 hour)
cachePresets.long

// Static content cache (1 day)
cachePresets.static

// API response cache (30 seconds)
cachePresets.api
```

### Cache Operations

#### Basic Operations
```typescript
const cacheHandler = new CacheHandler(config);

// Set value
await cacheHandler.set('key', value, ttl, ['tag1', 'tag2']);

// Get value
const value = await cacheHandler.get('key');

// Delete value
await cacheHandler.delete('key');

// Clear all
await cacheHandler.clear();
```

#### Cache-Aside Pattern
```typescript
const data = await cacheHandler.getOrSet(
  'user:123',
  async () => await fetchUserFromDatabase(123),
  300000, // 5 minutes
  ['users', 'profile']
);
```

#### Cache with ETags
```typescript
const { data, etag } = await cacheUtils.cacheWithETag(
  cacheHandler,
  'products:list',
  productsData,
  300000
);

// Check if content changed
if (cacheUtils.checkETag(request, etag)) {
  return new NextResponse(null, { status: 304 });
}
```

### Cache Invalidation

#### Invalidation Options
```typescript
interface InvalidationOptions {
  tags?: string[];
  pattern?: string | RegExp;
  before?: Date;
  after?: Date;
}
```

#### Invalidation Examples
```typescript
// Invalidate by tags
await cacheHandler.invalidate({ tags: ['products', 'api'] });

// Invalidate by pattern
await cacheHandler.invalidate({ pattern: /^products:/ });

// Invalidate by date
await cacheHandler.invalidate({ before: new Date('2024-01-01') });

// Invalidate all
await cacheHandler.invalidate();
```

#### Utility Functions
```typescript
// Invalidate by tags
await cacheUtils.invalidateByTags(cacheHandler, ['products']);

// Invalidate by pattern
await cacheUtils.invalidateByPattern(cacheHandler, /^api:/);

// Invalidate by date
await cacheUtils.invalidateByDate(cacheHandler, new Date('2024-01-01'));
```

### Cache Statistics

#### Statistics Interface
```typescript
interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  oldestEntry: number;
  newestEntry: number;
  tags: Record<string, number>;
}
```

#### Get Statistics
```typescript
const stats = await cacheHandler.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Total size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
```

### Middleware Integration

#### With Cache Middleware
```typescript
const handler = withCache(cachePresets.api)(yourHandler);
```

#### Custom Cache Key Generation
```typescript
const handler = withCustomCache(
  (request: NextRequest) => {
    const url = new URL(request.url);
    return `api:${url.pathname}:${url.search}`;
  },
  cachePresets.medium
)(yourHandler);
```

## Integration with CRUD Routes

### Enhanced Configuration
```typescript
export const { GET, POST, PUT, PATCH, DELETE } = createCrudRoutes<User>(
  userOperations,
  'User',
  ['email', 'name', 'role'],
  {
    enableAuth: true,
    enableCors: true,
    enableRequestValidation: true,
    enableCache: true,
    headers: {
      security: { enableHSTS: true, enableCSP: true },
      cache: { maxAge: 300 }
    },
    cookies: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    },
    redirects: [
      {
        pattern: '/users/old',
        destination: '/users',
        config: { type: RedirectType.PERMANENT }
      }
    ],
    cache: cachePresets.medium
  }
);
```

## API Routes

### Cache Management Routes

#### Get Cache Statistics
```bash
GET /api/cache/stats
```

#### Clear Cache
```bash
POST /api/cache/clear
```

#### Invalidate Cache
```bash
POST /api/cache/invalidate
Content-Type: application/json

{
  "tags": ["products", "api"],
  "pattern": "/^products:/",
  "before": "2024-01-01T00:00:00.000Z"
}
```

#### Test Cache
```bash
GET /api/cache/test
```

## Best Practices

### Redirects

1. **Use appropriate redirect types**
   - 301 for permanent moves
   - 302 for temporary redirects
   - 303 for POST redirects
   - 307/308 for method preservation

2. **Implement proper tracking**
   - Track redirect performance
   - Monitor redirect chains
   - Analyze user behavior

3. **Security considerations**
   - Validate redirect URLs
   - Prevent open redirects
   - Limit redirect chains

4. **SEO optimization**
   - Use 301 for permanent moves
   - Preserve query parameters
   - Update sitemaps

### Caching

1. **Choose appropriate TTL**
   - Short TTL for dynamic data
   - Long TTL for static content
   - Consider data freshness requirements

2. **Use cache tags**
   - Tag related data
   - Enable selective invalidation
   - Group cache entries logically

3. **Monitor cache performance**
   - Track hit rates
   - Monitor memory usage
   - Analyze cache patterns

4. **Implement cache warming**
   - Pre-populate cache
   - Warm frequently accessed data
   - Use background jobs

## Testing

### Using the Demo Page
1. Navigate to `/redirects-cache-demo`
2. Test redirect rules
3. Test cache functionality
4. Monitor performance
5. Analyze statistics

### Manual Testing
```bash
# Test redirects
curl -I http://localhost:3000/old-page

# Test cache
curl -H "Cache-Control: max-age=60" http://localhost:3000/api/products

# Test cache invalidation
curl -X POST http://localhost:3000/api/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"tags": ["products"]}'
```

## Performance Considerations

### Redirects
- Minimize redirect chains
- Use appropriate status codes
- Implement redirect caching
- Monitor redirect performance

### Caching
- Choose optimal cache size
- Implement LRU eviction
- Use compression when beneficial
- Monitor memory usage

## Conclusion

The redirects and cache system provides a comprehensive solution for URL management and performance optimization. It includes advanced features like conditional redirects, cache invalidation, and performance monitoring.

For more information, refer to the demo page at `/redirects-cache-demo` and the individual component documentation.
