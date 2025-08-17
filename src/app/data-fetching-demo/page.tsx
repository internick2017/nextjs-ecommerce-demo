import React from 'react';
import ServerProductList, {
  ServerProductListSafe,
  ServerProductListWithCategories,
  ServerProductListStreaming
} from '../../components/server/ServerProductList';
import {
  ClientProductListWithQuery,
  ClientProductListWithSWR,
  ClientProductListManual,
  ClientProductListOptimistic
} from '../../components/client/ClientProductList';

export default function DataFetchingDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Data Fetching Strategies Demo
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive demonstration of different data fetching approaches in Next.js App Router
          </p>
        </div>

        {/* Server Components Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Server Components</h2>

          <div className="space-y-8">
            {/* Basic Server Component */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Basic Server Component with Caching
              </h3>
              <p className="text-gray-600 mb-4">
                Data is fetched on the server with Next.js caching. This component is rendered on the server
                and the HTML is sent to the client.
              </p>
              <ServerProductList />
            </div>

            {/* Safe Server Component */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Server Component with Error Handling
              </h3>
              <p className="text-gray-600 mb-4">
                Safe data fetching with fallback values if the API fails. The component gracefully handles errors.
              </p>
              <ServerProductListSafe />
            </div>

            {/* Parallel Data Fetching */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Server Component with Parallel Data Fetching
              </h3>
              <p className="text-gray-600 mb-4">
                Fetches products and categories in parallel for better performance. Both requests start simultaneously.
              </p>
              <ServerProductListWithCategories />
            </div>

            {/* Streaming Server Component */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Server Component with Real-time Data
              </h3>
              <p className="text-gray-600 mb-4">
                Uses no-store caching for real-time data. Suitable for frequently changing data.
              </p>
              <ServerProductListStreaming />
            </div>
          </div>
        </section>

        {/* Client Components Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Client Components</h2>

          <div className="space-y-8">
            {/* useQuery Hook */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Client Component with useQuery Hook
              </h3>
              <p className="text-gray-600 mb-4">
                Uses a custom useQuery hook with caching and automatic refetching. Similar to React Query.
              </p>
              <ClientProductListWithQuery />
            </div>

            {/* useSWR Hook */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Client Component with useSWR Hook
              </h3>
              <p className="text-gray-600 mb-4">
                Uses a SWR-like hook with auto-refresh, focus revalidation, and reconnection handling.
              </p>
              <ClientProductListWithSWR />
            </div>

            {/* Manual Fetch */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Client Component with Manual Fetch
              </h3>
              <p className="text-gray-600 mb-4">
                Traditional approach using useState, useEffect, and manual fetch calls.
              </p>
              <ClientProductListManual />
            </div>

            {/* Optimistic Updates */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Client Component with Optimistic Updates
              </h3>
              <p className="text-gray-600 mb-4">
                Updates the UI immediately and syncs with the server in the background. Provides better UX.
              </p>
              <ClientProductListOptimistic />
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Strategy Comparison</h2>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Strategy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Use Case
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SEO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interactivity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Server Component
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Static content, SEO-critical pages
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐⭐⭐⭐
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐⭐⭐⭐
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    useQuery Hook
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Interactive components, cached data
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐⭐⭐
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐⭐⭐⭐
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    useSWR Hook
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Real-time data, auto-refresh
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐⭐
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐⭐⭐⭐
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Manual Fetch
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Simple cases, custom logic
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐⭐
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐⭐⭐
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Optimistic Updates
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Forms, user actions, better UX
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐⭐
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐⭐⭐⭐⭐
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Practices</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Components</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Use for static content and SEO-critical pages</li>
                <li>• Leverage Next.js caching for performance</li>
                <li>• Fetch data in parallel when possible</li>
                <li>• Use error boundaries for graceful failures</li>
                <li>• Implement proper loading states</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Components</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Use for interactive components</li>
                <li>• Implement proper loading and error states</li>
                <li>• Use optimistic updates for better UX</li>
                <li>• Cache data appropriately</li>
                <li>• Handle network errors gracefully</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Code Examples</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Component</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`// Server Component
export default async function ServerComponent() {
  const data = await getServerData('/api/data', {
    cache: 'force-cache',
    revalidate: 3600,
    tags: ['data']
  });

  return <div>{/* Render data */}</div>;
}`}
              </pre>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Component</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`// Client Component
'use client';

export function ClientComponent() {
  const { data, loading, error } = useQuery(
    'data',
    () => fetch('/api/data').then(res => res.json())
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render data */}</div>;
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Performance Tips */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Tips</h2>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Caching</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use appropriate cache strategies</li>
                  <li>• Implement cache invalidation</li>
                  <li>• Consider stale-while-revalidate</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Loading States</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Show skeleton loaders</li>
                  <li>• Implement progressive loading</li>
                  <li>• Use Suspense boundaries</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Error Handling</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Graceful error boundaries</li>
                  <li>• Retry mechanisms</li>
                  <li>• Fallback content</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
