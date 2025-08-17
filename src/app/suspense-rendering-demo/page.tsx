'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  SuspenseWrapper,
  SuspenseBoundary,
  LoadingComponents,
  LazyComponent,
  useSuspenseQuery,
  suspenseUtils,
  withSuspense
} from '../../lib/suspenseHandler';
import {
  OptimizedList,
  VirtualizedList,
  OptimizedImage,
  RenderProfiler,
  usePerformanceMonitoring,
  useMemoizedValue,
  useRenderOptimization,
  useLazyLoading,
  withOptimization,
  renderingUtils
} from '../../lib/renderingOptimizer';

// Mock data generator
const generateMockData = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `Item ${index + 1}`,
    description: `This is a description for item ${index + 1}`,
    image: `https://picsum.photos/300/200?random=${index + 1}`,
    price: Math.floor(Math.random() * 1000) + 100,
    category: ['Electronics', 'Clothing', 'Books', 'Home'][Math.floor(Math.random() * 4)]
  }));
};

// Async component example
const AsyncDataComponent = withSuspense(async () => {
  // Simulate async data fetching
  await new Promise(resolve => setTimeout(resolve, 2000));

  const data = generateMockData(10);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map(item => (
        <div key={item.id} className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-gray-600 text-sm">{item.description}</p>
          <p className="text-blue-600 font-medium">${item.price}</p>
        </div>
      ))}
    </div>
  );
}, {
  loadingStrategy: 'skeleton',
  timeout: 5000,
  retryCount: 2
});

// Lazy loaded component
const LazyHeavyComponent = LazyComponent(() => import('./HeavyComponent'), {
  loadingStrategy: 'spinner',
  timeout: 3000
});

// Optimized product card
const ProductCard = withOptimization(({ product }: { product: any }) => {
  const metrics = usePerformanceMonitoring('ProductCard');

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <OptimizedImage
        src={product.image}
        alt={product.title}
        width={300}
        height={200}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg">{product.title}</h3>
        <p className="text-gray-600 text-sm mt-1">{product.description}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-blue-600 font-bold">${product.price}</span>
          <span className="text-gray-500 text-xs">{product.category}</span>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 mt-2">
            Renders: {metrics.reRenderCount}
          </div>
        )}
      </div>
    </div>
  );
});

// Performance monitoring component
const PerformanceMonitor = () => {
  const metrics = usePerformanceMonitoring('PerformanceMonitor');
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">Performance Metrics</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Render Time:</span>
          <span className="font-mono">{metrics.renderTime.toFixed(2)}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Mount Time:</span>
          <span className="font-mono">{metrics.mountTime.toFixed(2)}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Memory Usage:</span>
          <span className="font-mono">{(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</span>
        </div>
        <div className="flex justify-between">
          <span>Re-render Count:</span>
          <span className="font-mono">{metrics.reRenderCount}</span>
        </div>
      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="mt-3 text-blue-600 text-sm hover:underline"
      >
        {showDetails ? 'Hide' : 'Show'} Details
      </button>

      {showDetails && (
        <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
          <pre>{JSON.stringify(metrics, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// Main demo component
const SuspenseRenderingDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('suspense');
  const [itemCount, setItemCount] = useState(50);
  const [showPerformance, setShowPerformance] = useState(false);
  const [optimizationConfig, setOptimizationConfig] = useState({
    enableMemoization: true,
    enableVirtualization: true,
    enableLazyLoading: true
  });

  const mockData = generateMockData(itemCount);
  const debouncedItemCount = useMemoizedValue(itemCount, [itemCount]);
  const { shouldOptimize, optimizeRender } = useRenderOptimization();

  // Suspense query example
  const products = useSuspenseQuery(
    async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateMockData(20);
    },
    { loadingStrategy: 'skeleton' },
    'products'
  );

  const handleOptimizeRender = useCallback(() => {
    optimizeRender(() => {
      console.log('Optimized render executed');
    });
  }, [optimizeRender]);

  const clearCache = () => {
    suspenseUtils.clearCache();
    alert('Cache cleared!');
  };

  const tabs = [
    { id: 'suspense', label: 'Suspense' },
    { id: 'optimization', label: 'Rendering Optimization' },
    { id: 'virtualization', label: 'Virtualization' },
    { id: 'performance', label: 'Performance' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Suspense & Rendering Optimization Demo
          </h1>
          <p className="text-lg text-gray-600">
            Explore React Suspense, Server-Side Rendering, and rendering cycle optimizations
          </p>
        </div>

        {/* Performance Monitor */}
        {showPerformance && (
          <div className="mb-6">
            <PerformanceMonitor />
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
                  checked={showPerformance}
                  onChange={(e) => setShowPerformance(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show Performance</span>
              </label>

              <button
                onClick={clearCache}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Clear Cache
              </button>

              <button
                onClick={handleOptimizeRender}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Optimize Render
              </button>
            </div>
          </div>

          {/* Configuration */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium mb-3">Optimization Configuration</h4>
            <div className="flex gap-4">
              {Object.entries(optimizationConfig).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setOptimizationConfig(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Suspense Tab */}
          {activeTab === 'suspense' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Suspense Examples</h2>

                <div className="space-y-6">
                  {/* Async Component */}
                  <div>
                    <h3 className="font-medium mb-3">Async Component (2s delay)</h3>
                    <SuspenseBoundary
                      fallback={LoadingComponents.contentSkeleton}
                      onError={(error) => console.error('Suspense error:', error)}
                    >
                      <AsyncDataComponent />
                    </SuspenseBoundary>
                  </div>

                  {/* Lazy Component */}
                  <div>
                    <h3 className="font-medium mb-3">Lazy Loaded Component</h3>
                    <SuspenseBoundary fallback={LoadingComponents.spinner}>
                      <LazyHeavyComponent />
                    </SuspenseBoundary>
                  </div>

                  {/* Suspense Query */}
                  <div>
                    <h3 className="font-medium mb-3">Suspense Query (1s delay)</h3>
                    <SuspenseBoundary fallback={LoadingComponents.skeleton}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map(product => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </SuspenseBoundary>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rendering Optimization Tab */}
          {activeTab === 'optimization' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Rendering Optimization</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Number of Items: {itemCount}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={itemCount}
                      onChange={(e) => setItemCount(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockData.slice(0, 12).map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Virtualization Tab */}
          {activeTab === 'virtualization' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Virtualized List</h2>

                <div className="space-y-4">
                  <p className="text-gray-600">
                    This list renders {itemCount} items but only renders the visible ones for optimal performance.
                  </p>

                  <VirtualizedList
                    items={mockData}
                    renderItem={(item) => (
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                          <OptimizedImage
                            src={item.image}
                            alt={item.title}
                            width={60}
                            height={60}
                            className="rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="text-gray-600 text-sm">{item.description}</p>
                            <p className="text-blue-600 font-medium">${item.price}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    config={{
                      itemHeight: 100,
                      containerHeight: 400,
                      overscan: 5
                    }}
                    className="border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Performance Monitoring</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PerformanceMonitor />

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Cache Statistics</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(suspenseUtils.getCacheStats()).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key}:</span>
                          <span className="font-mono">{Array.isArray(value) ? value.length : value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-2">Optimization Status</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Should Optimize:</span>
                      <span className={shouldOptimize ? 'text-red-600' : 'text-green-600'}>
                        {shouldOptimize ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Debounced Item Count:</span>
                      <span className="font-mono">{debouncedItemCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Features Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Suspense Features</h4>
              <ul className="space-y-1">
                <li>• Async component loading</li>
                <li>• Lazy component loading</li>
                <li>• Suspense queries</li>
                <li>• Error boundaries</li>
                <li>• Loading states</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Rendering Optimizations</h4>
              <ul className="space-y-1">
                <li>• Component memoization</li>
                <li>• Virtualized lists</li>
                <li>• Lazy loading</li>
                <li>• Performance monitoring</li>
                <li>• Render cycle optimization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspenseRenderingDemo;
