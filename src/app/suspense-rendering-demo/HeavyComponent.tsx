'use client';

import React, { useState, useEffect } from 'react';
import { usePerformanceMonitoring } from '../../../lib/renderingOptimizer';

const HeavyComponent: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const metrics = usePerformanceMonitoring('HeavyComponent');

  useEffect(() => {
    // Simulate heavy computation
    const generateHeavyData = () => {
      const items = Array.from({ length: 1000 }, (_, index) => ({
        id: index,
        name: `Heavy Item ${index}`,
        value: Math.random() * 1000,
        timestamp: new Date().toISOString(),
        metadata: {
          category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
          priority: Math.floor(Math.random() * 10) + 1,
          tags: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => `tag-${i}`)
        }
      }));

      // Simulate processing delay
      setTimeout(() => {
        setData(items);
        setLoading(false);
      }, 1500);
    };

    generateHeavyData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Heavy Component Loading...</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Heavy Component Loaded</h2>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Performance Metrics</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
          <div>Render Time: {metrics.renderTime.toFixed(2)}ms</div>
          <div>Mount Time: {metrics.mountTime.toFixed(2)}ms</div>
          <div>Re-renders: {metrics.reRenderCount}</div>
          <div>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600">
          This component was lazy loaded and contains {data.length} items with heavy computation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.slice(0, 6).map(item => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium">{item.name}</h4>
              <p className="text-sm text-gray-600">Value: {item.value.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Category: {item.metadata.category}</p>
              <p className="text-xs text-gray-500">Priority: {item.metadata.priority}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Showing 6 of {data.length} items
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeavyComponent;
