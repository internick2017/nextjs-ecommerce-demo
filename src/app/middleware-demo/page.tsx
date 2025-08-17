'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  headers?: Record<string, string>;
}

const MiddlewareDemo: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ApiResponse | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});

  // Check authentication status on load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth?action=verify', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.user) {
          setUser(data.data.user);
        }
      }
    } catch (err) {
      console.log('User not authenticated');
    }
  };

  const testApiEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true);
    setError(null);
    setResponseHeaders({});

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Test-Header': 'middleware-test',
        },
        credentials: 'include',
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(endpoint, options);
      const data: ApiResponse = await response.json();

      // Extract response headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      setResponseHeaders(headers);

      setLastResponse(data);

      if (!response.ok) {
        setError(data.message || `HTTP ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (type: 'user' | 'admin') => {
    const credentials = {
      user: { email: 'user@example.com', password: 'user123' },
      admin: { email: 'admin@example.com', password: 'admin123' }
    };

    await testApiEndpoint('/api/auth?action=login', 'POST', credentials[type]);

    if (!error) {
      await checkAuthStatus();
    }
  };

  const handleLogout = async () => {
    await testApiEndpoint('/api/auth?action=logout', 'POST');
    setUser(null);
  };

  const testProtectedRoute = async (action: string) => {
    await testApiEndpoint(`/api/protected?action=${action}`, 'GET');
  };

  const testProtectedRouteWithBody = async (action: string, body: any) => {
    await testApiEndpoint(`/api/protected?action=${action}`, 'POST', body);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Middleware Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test and explore middleware functionality for route protection and validation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Authentication Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Status</h2>

            {user ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800">Authenticated</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-800">Not Authenticated</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please login to access protected routes
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleLogin('user')}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Login as User
                  </button>
                  <button
                    onClick={() => handleLogin('admin')}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    Login as Admin
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Middleware Testing */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Middleware Testing</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Authentication Middleware</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => testProtectedRoute('info')}
                    disabled={loading || !user}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Test Auth Required
                  </button>
                  <button
                    onClick={() => testProtectedRoute('admin')}
                    disabled={loading || !user}
                    className="px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    Test Admin Role
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Validation Middleware</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => testProtectedRouteWithBody('update', { permissions: ['read', 'write', 'admin'] })}
                    disabled={loading || !user}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Test Valid Body
                  </button>
                  <button
                    onClick={() => testProtectedRouteWithBody('update', { invalid: 'data' })}
                    disabled={loading || !user}
                    className="px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Test Invalid Body
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Rate Limiting</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      // Make multiple requests to test rate limiting
                      for (let i = 0; i < 5; i++) {
                        setTimeout(() => testProtectedRoute('info'), i * 100);
                      }
                    }}
                    disabled={loading || !user}
                    className="px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    Test Rate Limit
                  </button>
                  <button
                    onClick={() => testApiEndpoint('/api/auth?action=verify', 'POST')}
                    disabled={loading}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Test Invalid Method
                  </button>
                </div>
              </div>
            </div>
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

        {/* Middleware Features */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Middleware Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Authentication Middleware</h4>
              <ul className="space-y-1">
                <li>• Session-based authentication</li>
                <li>• Role-based access control</li>
                <li>• Permission-based authorization</li>
                <li>• Automatic redirects</li>
                <li>• Session management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Validation Middleware</h4>
              <ul className="space-y-1">
                <li>• Required headers validation</li>
                <li>• Query parameters validation</li>
                <li>• Body size limits</li>
                <li>• Content type validation</li>
                <li>• Custom validation rules</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Rate Limiting</h4>
              <ul className="space-y-1">
                <li>• IP-based rate limiting</li>
                <li>• Configurable limits</li>
                <li>• Rate limit headers</li>
                <li>• Automatic reset</li>
                <li>• Custom time windows</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Guest Middleware</h4>
              <ul className="space-y-1">
                <li>• Login page protection</li>
                <li>• Redirect if authenticated</li>
                <li>• Guest-only routes</li>
                <li>• Partial auth support</li>
                <li>• Session validation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiddlewareDemo;
