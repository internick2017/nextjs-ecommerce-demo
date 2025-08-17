'use client';

import { useState, useEffect } from 'react';

interface HeaderInfo {
  name: string;
  value: string;
}

interface CookieInfo {
  name: string;
  value: string;
  options?: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  metadata?: any;
}

const HeadersCookiesDemo: React.FC = () => {
  const [requestHeaders, setRequestHeaders] = useState<HeaderInfo[]>([]);
  const [responseHeaders, setResponseHeaders] = useState<HeaderInfo[]>([]);
  const [cookies, setCookies] = useState<CookieInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ApiResponse | null>(null);
  const [clientInfo, setClientInfo] = useState<any>(null);

  // Get client information
  useEffect(() => {
    const info = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
    setClientInfo(info);
  }, []);

  // Get current cookies
  const getCurrentCookies = (): CookieInfo[] => {
    return document.cookie.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return { name, value: decodeURIComponent(value) };
    }).filter(cookie => cookie.name);
  };

  // Update cookies display
  useEffect(() => {
    setCookies(getCurrentCookies());
  }, []);

  // Test API endpoint
  const testApiEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true);
    setError(null);
    setResponseHeaders([]);

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Test-Header': 'test-value',
          'X-Client-Timestamp': new Date().toISOString(),
        },
        credentials: 'include', // Include cookies
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, options);
      const data: ApiResponse = await response.json();

      // Extract response headers
      const headers: HeaderInfo[] = [];
      response.headers.forEach((value, name) => {
        headers.push({ name, value });
      });
      setResponseHeaders(headers);

      // Update cookies
      setCookies(getCurrentCookies());

      setLastResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Test authentication
  const testAuth = async (action: 'login' | 'logout' | 'verify') => {
    const body = action === 'login' ? {
      email: 'admin@example.com',
      password: 'admin123'
    } : undefined;

    await testApiEndpoint(`/api/auth?action=${action}`, 'POST', body);
  };

  // Test CRUD endpoint
  const testCrudEndpoint = async (entity: string, action: string, data?: any) => {
    let endpoint = `/api/${entity}`;
    let method = 'GET';

    switch (action) {
      case 'get':
        method = 'GET';
        break;
      case 'create':
        method = 'POST';
        break;
      case 'update':
        method = 'PUT';
        endpoint += '?id=id_1';
        break;
      case 'delete':
        method = 'DELETE';
        endpoint += '?id=id_1';
        break;
    }

    await testApiEndpoint(endpoint, method, data);
  };

  // Set a test cookie
  const setTestCookie = (name: string, value: string, options?: string) => {
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    if (options) {
      cookieString += `; ${options}`;
    }
    document.cookie = cookieString;
    setCookies(getCurrentCookies());
  };

  // Delete a cookie
  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    setCookies(getCurrentCookies());
  };

  // Clear all cookies
  const clearAllCookies = () => {
    cookies.forEach(cookie => {
      deleteCookie(cookie.name);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Headers & Cookies Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test and explore header and cookie handling in API routes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Client Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
            {clientInfo && (
              <div className="space-y-2 text-sm">
                {Object.entries(clientInfo).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-600 font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Cookies */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Current Cookies</h2>
              <button
                onClick={clearAllCookies}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2">
              {cookies.length === 0 ? (
                <p className="text-gray-500 text-sm">No cookies found</p>
              ) : (
                cookies.map((cookie, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{cookie.name}</p>
                      <p className="text-xs text-gray-600 truncate">{cookie.value}</p>
                    </div>
                    <button
                      onClick={() => deleteCookie(cookie.name)}
                      className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Testing</h2>

          {/* Authentication Tests */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Authentication</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => testAuth('login')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Login
              </button>
              <button
                onClick={() => testAuth('verify')}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Verify Token
              </button>
              <button
                onClick={() => testAuth('logout')}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Logout
              </button>
            </div>
          </div>

          {/* CRUD Tests */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">CRUD Operations</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['users', 'products', 'categories', 'reviews'].map(entity => (
                <div key={entity} className="space-y-2">
                  <h4 className="font-medium text-gray-700 capitalize">{entity}</h4>
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => testCrudEndpoint(entity, 'get')}
                      disabled={loading}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      GET
                    </button>
                    <button
                      onClick={() => testCrudEndpoint(entity, 'create', { name: 'Test Item', description: 'Test description' })}
                      disabled={loading}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      POST
                    </button>
                    <button
                      onClick={() => testCrudEndpoint(entity, 'update', { name: 'Updated Item' })}
                      disabled={loading}
                      className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      PUT
                    </button>
                    <button
                      onClick={() => testCrudEndpoint(entity, 'delete')}
                      disabled={loading}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cookie Management */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Cookie Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cookie Name</label>
                <input
                  type="text"
                  id="cookieName"
                  placeholder="cookie-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cookie Value</label>
                <input
                  type="text"
                  id="cookieValue"
                  placeholder="cookie-value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                <input
                  type="text"
                  id="cookieOptions"
                  placeholder="path=/; max-age=3600"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={() => {
                  const name = (document.getElementById('cookieName') as HTMLInputElement).value;
                  const value = (document.getElementById('cookieValue') as HTMLInputElement).value;
                  const options = (document.getElementById('cookieOptions') as HTMLInputElement).value;
                  if (name && value) {
                    setTestCookie(name, value, options);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Set Cookie
              </button>
            </div>
          </div>
        </div>

        {/* Response Information */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Response Headers */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Response Headers</h2>
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}
            {responseHeaders.length === 0 && !loading ? (
              <p className="text-gray-500 text-sm">No response headers yet</p>
            ) : (
              <div className="space-y-2">
                {responseHeaders.map((header, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <p className="font-medium text-sm text-gray-900">{header.name}</p>
                    <p className="text-xs text-gray-600 break-all">{header.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API Response */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">API Response</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            {lastResponse && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Response Data</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(lastResponse, null, 2)}
                  </pre>
                </div>
                {lastResponse.metadata && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Metadata</h3>
                    <div className="space-y-1 text-sm">
                      {Object.entries(lastResponse.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium text-gray-700">{key}:</span>
                          <span className="text-gray-600">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Header & Cookie Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Security Headers</h4>
              <ul className="space-y-1">
                <li>• HSTS (HTTP Strict Transport Security)</li>
                <li>• CSP (Content Security Policy)</li>
                <li>• X-Frame-Options</li>
                <li>• X-Content-Type-Options</li>
                <li>• Referrer Policy</li>
                <li>• Permissions Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cookie Features</h4>
              <ul className="space-y-1">
                <li>• HttpOnly cookies for security</li>
                <li>• Secure flag for HTTPS</li>
                <li>• SameSite attribute</li>
                <li>• Configurable expiration</li>
                <li>• Domain and path restrictions</li>
                <li>• Automatic validation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadersCookiesDemo;
