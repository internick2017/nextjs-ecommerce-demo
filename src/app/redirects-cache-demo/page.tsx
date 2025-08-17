'use client';

import { useState, useEffect } from 'react';

interface RedirectRule {
  pattern: string;
  destination: string;
  type: '301' | '302' | '303' | '307' | '308';
  conditions?: string;
}

interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  expiresAt: number;
  hits: number;
  size: number;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  headers?: Record<string, string>;
}

const RedirectsCacheDemo: React.FC = () => {
  const [redirectRules, setRedirectRules] = useState<RedirectRule[]>([]);
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ApiResponse | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [cacheStats, setCacheStats] = useState<any>(null);

  // Sample redirect rules
  const sampleRedirectRules: RedirectRule[] = [
    {
      pattern: '/old-page',
      destination: '/new-page',
      type: '301',
      conditions: 'Permanent redirect'
    },
    {
      pattern: '/temp-page',
      destination: '/final-page',
      type: '302',
      conditions: 'Temporary redirect'
    },
    {
      pattern: '/api/redirect-test',
      destination: '/api/products',
      type: '302',
      conditions: 'API redirect'
    }
  ];

  // Test redirect
  const testRedirect = async (url: string) => {
    setLoading(true);
    setError(null);
    setResponseHeaders({});

    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'manual', // Don't follow redirects automatically
        headers: {
          'Accept': 'application/json',
          'X-Test-Header': 'redirect-test'
        }
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      setResponseHeaders(headers);

      // Check if it's a redirect
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        setLastResponse({
          success: true,
          message: `Redirect ${response.status} to ${location}`,
          headers
        });
      } else {
        const data = await response.json();
        setLastResponse({
          success: true,
          data,
          message: 'No redirect occurred',
          headers
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Test cache
  const testCache = async (endpoint: string, useCache: boolean = true) => {
    setLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': useCache ? 'max-age=60' : 'no-cache',
          'X-Test-Header': 'cache-test'
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const data = await response.json();
      setLastResponse({
        success: true,
        data,
        message: `Response time: ${responseTime}ms`,
        headers
      });

      // Check cache headers
      const cacheStatus = headers['x-cache'] || 'UNKNOWN';
      const cacheKey = headers['x-cache-key'] || 'N/A';

      setResponseHeaders({
        ...headers,
        'X-Response-Time': `${responseTime}ms`,
        'X-Cache-Status': cacheStatus,
        'X-Cache-Key': cacheKey
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get cache statistics
  const getCacheStats = async () => {
    try {
      const response = await fetch('/api/cache/stats');
      const stats = await response.json();
      setCacheStats(stats);
    } catch (err) {
      console.error('Failed to get cache stats:', err);
    }
  };

  // Clear cache
  const clearCache = async () => {
    try {
      await fetch('/api/cache/clear', { method: 'POST' });
      setCacheEntries([]);
      setCacheStats(null);
    } catch (err) {
      setError('Failed to clear cache');
    }
  };

  // Invalidate cache by tags
  const invalidateCacheByTags = async (tags: string[]) => {
    try {
      const response = await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tags })
      });
      const result = await response.json();
      setLastResponse({
        success: true,
        message: `Invalidated ${result.count} cache entries`,
        data: result
      });
    } catch (err) {
      setError('Failed to invalidate cache');
    }
  };

  // Add redirect rule
  const addRedirectRule = (rule: RedirectRule) => {
    setRedirectRules(prev => [...prev, rule]);
  };

  // Remove redirect rule
  const removeRedirectRule = (index: number) => {
    setRedirectRules(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    setRedirectRules(sampleRedirectRules);
    getCacheStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Redirects & Cache Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test redirect rules and caching functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Redirect Testing */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Redirect Testing</h2>

            {/* Sample Redirects */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Sample Redirects</h3>
              <div className="space-y-2">
                {sampleRedirectRules.map((rule, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{rule.pattern} → {rule.destination}</p>
                        <p className="text-xs text-gray-600">Type: {rule.type} • {rule.conditions}</p>
                      </div>
                      <button
                        onClick={() => testRedirect(rule.pattern)}
                        disabled={loading}
                        className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Redirect Test */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Custom Redirect Test</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  id="customUrl"
                  placeholder="Enter URL to test (e.g., /old-page)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    const url = (document.getElementById('customUrl') as HTMLInputElement).value;
                    if (url) testRedirect(url);
                  }}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Test Custom Redirect
                </button>
              </div>
            </div>

            {/* Redirect Rules Management */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Redirect Rules</h3>
              <div className="space-y-2">
                {redirectRules.map((rule, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{rule.pattern} → {rule.destination}</span>
                    <button
                      onClick={() => removeRedirectRule(index)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cache Testing */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cache Testing</h2>

            {/* Cache Endpoints */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Cache Endpoints</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => testCache('/api/products', true)}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Test Products Cache
                </button>
                <button
                  onClick={() => testCache('/api/categories', true)}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Test Categories Cache
                </button>
                <button
                  onClick={() => testCache('/api/products', false)}
                  disabled={loading}
                  className="px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  Test No Cache
                </button>
                <button
                  onClick={() => testCache('/api/cache/test', true)}
                  disabled={loading}
                  className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Test Cache API
                </button>
              </div>
            </div>

            {/* Cache Management */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Cache Management</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={getCacheStats}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Get Stats
                </button>
                <button
                  onClick={clearCache}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Clear Cache
                </button>
                <button
                  onClick={() => invalidateCacheByTags(['products'])}
                  className="px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                >
                  Invalidate Products
                </button>
                <button
                  onClick={() => invalidateCacheByTags(['api'])}
                  className="px-3 py-2 bg-orange-600 text-white text-white text-sm rounded hover:bg-orange-700"
                >
                  Invalidate API
                </button>
              </div>
            </div>

            {/* Cache Statistics */}
            {cacheStats && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Cache Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Entries:</span>
                    <span className="font-medium">{cacheStats.totalEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Size:</span>
                    <span className="font-medium">{(cacheStats.totalSize / 1024).toFixed(2)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hit Rate:</span>
                    <span className="font-medium">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hits:</span>
                    <span className="font-medium">{cacheStats.hits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Misses:</span>
                    <span className="font-medium">{cacheStats.misses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evictions:</span>
                    <span className="font-medium">{cacheStats.evictions}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Response Information */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Response Information</h2>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {lastResponse && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Response Data */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Response Data</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
              </div>

              {/* Response Headers */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Response Headers</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(responseHeaders).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium text-gray-700">{key}:</span>
                      <span className="text-gray-600 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Redirect & Cache Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Redirect Types</h4>
              <ul className="space-y-1">
                <li>• 301 - Permanent Redirect</li>
                <li>• 302 - Temporary Redirect</li>
                <li>• 303 - See Other</li>
                <li>• 307 - Temporary (Preserve Method)</li>
                <li>• 308 - Permanent (Preserve Method)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cache Features</h4>
              <ul className="space-y-1">
                <li>• In-memory caching</li>
                <li>• ETag support</li>
                <li>• Cache invalidation by tags</li>
                <li>• LRU eviction</li>
                <li>• Cache statistics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedirectsCacheDemo;
