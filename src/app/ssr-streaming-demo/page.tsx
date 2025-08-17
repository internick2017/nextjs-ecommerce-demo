import React from 'react';
import {
  ServerDataFetcher,
  ServerRenderedList,
  ServerSearch,
  ServerPagination,
  ServerMetadata,
  ServerPerformanceMonitor,
  StreamingComponent,
  serverUtils,
  serverCache,
  ServerAnalytics
} from '../../lib/serverComponents';

// Mock data generator
const generateMockData = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `Server Item ${index + 1}`,
    description: `This is server-side rendered item ${index + 1} with streaming capabilities`,
    category: ['Technology', 'Science', 'Arts', 'Sports'][Math.floor(Math.random() * 4)],
    rating: (Math.random() * 2 + 3).toFixed(1),
    views: Math.floor(Math.random() * 10000),
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => `tag-${i + 1}`)
  }));
};

// Server-side item card component
async function ServerItemCard({ item }: { item: any }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {item.category}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center">
          <span className="text-yellow-400 mr-1">★</span>
          <span>{item.rating}</span>
        </div>
        <span>{item.views.toLocaleString()} views</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag: string) => (
            <span
              key={tag}
              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

// Server-side streaming list component
async function StreamingList({ items }: { items: any[] }) {
  return (
    <ServerRenderedList
      items={items}
      renderItem={(item, index) => <ServerItemCard key={item.id} item={item} />}
      fallback={<div className="text-center py-8">Loading items...</div>}
      chunkSize={5}
      delay={200}
    />
  );
}

// Server-side search results component
async function SearchResults({ query }: { query: string }) {
  return (
    <ServerSearch
      query={query}
      fallback={<div className="text-center py-8">Searching...</div>}
    >
      {(results) => (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results for "{query}"</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result: any) => (
              <ServerItemCard key={result.id} item={result} />
            ))}
          </div>
        </div>
      )}
    </ServerSearch>
  );
}

// Server-side pagination component
async function PaginatedContent({ page, pageSize }: { page: number; pageSize: number }) {
  const totalItems = 100;

  return (
    <ServerPagination
      page={page}
      pageSize={pageSize}
      totalItems={totalItems}
      fallback={<div className="text-center py-8">Loading page {page}...</div>}
    >
      {(data) => (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Page {data.pagination.page}</h3>
            <span className="text-sm text-gray-500">
              Showing {data.items.length} of {data.pagination.totalItems} items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((item: any) => (
              <ServerItemCard key={item.id} item={item} />
            ))}
          </div>

          <div className="flex justify-center space-x-2">
            <button
              disabled={!data.pagination.hasPrev}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <button
              disabled={!data.pagination.hasNext}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </ServerPagination>
  );
}

// Server-side performance metrics component
async function ServerMetrics() {
  const userAgent = await serverUtils.getUserAgent();
  const clientIP = await serverUtils.getClientIP();
  const isBot = await serverUtils.isBot();
  const locale = await serverUtils.getLocale();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Server-Side Metrics</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="font-medium">Client IP:</span>
          <span className="font-mono">{clientIP}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">User Agent:</span>
          <span className="font-mono text-xs truncate max-w-xs">{userAgent}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Is Bot:</span>
          <span className={isBot ? 'text-red-600' : 'text-green-600'}>
            {isBot ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Locale:</span>
          <span className="font-mono">{locale}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Render Time:</span>
          <span className="font-mono">{Date.now()}</span>
        </div>
      </div>
    </div>
  );
}

// Main SSR and Streaming demo page
export default async function SSRStreamingDemoPage({
  searchParams
}: {
  searchParams: {
    page?: string;
    search?: string;
    tab?: string;
    streaming?: string;
  };
}) {
  const page = parseInt(searchParams.page || '1');
  const searchQuery = searchParams.search || '';
  const activeTab = searchParams.tab || 'streaming';
  const enableStreaming = searchParams.streaming === 'true';

  const mockData = generateMockData(50);

  return (
    <ServerPerformanceMonitor componentName="SSRStreamingDemo">
      <ServerMetadata
        title="SSR & Streaming Demo - Next.js App Router"
        description="Demonstrate Server-Side Rendering, streaming, and React Server Components"
        keywords="SSR, streaming, server components, Next.js, React"
        type="website"
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              SSR & Streaming Demo
            </h1>
            <p className="text-lg text-gray-600">
              Server-Side Rendering, Streaming, and React Server Components with Next.js App Router
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                {[
                  { id: 'streaming', label: 'Streaming' },
                  { id: 'search', label: 'Server Search' },
                  { id: 'pagination', label: 'Pagination' },
                  { id: 'metrics', label: 'Server Metrics' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enableStreaming}
                    readOnly
                    className="rounded"
                  />
                  <span className="text-sm">Enable Streaming</span>
                </label>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Streaming Tab */}
            {activeTab === 'streaming' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">Streaming Server Components</h2>
                  <p className="text-gray-600 mb-6">
                    This content is rendered on the server and streamed to the client in chunks.
                    Each item is processed with a simulated delay to demonstrate streaming.
                  </p>

                  <StreamingComponent config={{
                    enableStreaming,
                    chunkSize: 5,
                    delay: 200,
                    fallback: <div className="text-center py-8">Streaming content...</div>
                  }}>
                    <StreamingList items={mockData} />
                  </StreamingComponent>
                </div>
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">Server-Side Search</h2>
                  <p className="text-gray-600 mb-6">
                    Search is performed on the server with streaming results.
                  </p>

                  <SearchResults query={searchQuery || 'technology'} />
                </div>
              </div>
            )}

            {/* Pagination Tab */}
            {activeTab === 'pagination' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">Server-Side Pagination</h2>
                  <p className="text-gray-600 mb-6">
                    Pagination is handled on the server with streaming page content.
                  </p>

                  <PaginatedContent page={page} pageSize={12} />
                </div>
              </div>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">Server-Side Metrics</h2>
                  <p className="text-gray-600 mb-6">
                    Real-time server-side metrics and request information.
                  </p>

                  <ServerMetrics />
                </div>
              </div>
            )}
          </div>

          {/* Server-side data fetching example */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Server-Side Data Fetching</h2>
            <p className="text-gray-600 mb-6">
              This demonstrates server-side data fetching with caching and revalidation.
            </p>

            <ServerDataFetcher
              url="/api/products"
              cacheStrategy="revalidate"
              revalidateTime={300}
              fallback={<div className="text-center py-8">Loading server data...</div>}
            >
              {(data: any) => (
                <div className="space-y-4">
                  <h3 className="font-semibold">Fetched Data:</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
            </ServerDataFetcher>
          </div>

          {/* Server-side analytics */}
          <ServerAnalytics
            event="page_view"
            data={{
              page: 'ssr-streaming-demo',
              tab: activeTab,
              streaming: enableStreaming,
              userAgent: await serverUtils.getUserAgent(),
              clientIP: await serverUtils.getClientIP(),
              isBot: await serverUtils.isBot(),
              timestamp: new Date().toISOString()
            }}
          >
            <div style={{ display: 'none' }}>
              {/* Analytics data will be logged on the server */}
            </div>
          </ServerAnalytics>

          {/* Documentation */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Features Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Server-Side Rendering</h4>
                <ul className="space-y-1">
                  <li>• Server-side data fetching</li>
                  <li>• Cached components</li>
                  <li>• SEO optimization</li>
                  <li>• Performance monitoring</li>
                  <li>• Error boundaries</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Streaming SSR</h4>
                <ul className="space-y-1">
                  <li>• Progressive loading</li>
                  <li>• Chunk-based rendering</li>
                  <li>• Suspense boundaries</li>
                  <li>• Fallback states</li>
                  <li>• Performance optimization</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">React Server Components</h4>
                <ul className="space-y-1">
                  <li>• Zero client-side JavaScript</li>
                  <li>• Automatic code splitting</li>
                  <li>• Server-side caching</li>
                  <li>• Database queries</li>
                  <li>• File system access</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Performance Features</h4>
                <ul className="space-y-1">
                  <li>• Request caching</li>
                  <li>• Response streaming</li>
                  <li>• Memory optimization</li>
                  <li>• Bundle size reduction</li>
                  <li>• Time to interactive</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ServerPerformanceMonitor>
  );
}
