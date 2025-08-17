'use client';

import React, { useState, useEffect } from 'react';
import {
  useSequentialFetch,
  useParallelFetch,
  AdvancedLoadingIndicator,
  createSequentialFetches,
  createParallelFetches,
  SequentialDataFetcher,
  ParallelDataFetcher
} from '../../lib/advancedDataFetching';
import { useCart } from '../../contexts/AppContext';

// Component for sequential data fetching demo
export function SequentialFetchingDemo() {
  const { addToCart } = useCart();
  const {
    results,
    fetchSequential,
    loadingManager,
    errorManager,
    isLoading,
    hasErrors,
    overallProgress
  } = useSequentialFetch();

  const [activeTab, setActiveTab] = useState<'basic' | 'dependent' | 'conditional'>('basic');

  // Basic sequential fetch
  const handleBasicSequential = async () => {
    const fetches = [
      {
        key: 'users',
        fetcher: () => fetch('/api/users').then(res => res.json()),
        config: { retries: 2, retryDelay: 1000 }
      },
      {
        key: 'products',
        fetcher: () => fetch('/api/products').then(res => res.json()),
        config: { retries: 3, retryDelay: 1500 }
      },
      {
        key: 'categories',
        fetcher: () => fetch('/api/categories').then(res => res.json()),
        config: { retries: 2, retryDelay: 1000 }
      }
    ];

    await fetchSequential(fetches);
  };

  // Dependent sequential fetch
  const handleDependentSequential = async () => {
    const fetches = [
      {
        key: 'user',
        fetcher: () => fetch('/api/users/1').then(res => res.json()),
        config: { retries: 2 }
      },
      {
        key: 'userOrders',
        fetcher: () => fetch('/api/users/1/orders').then(res => res.json()),
        config: {
          retries: 2,
          dependencies: ['user'],
          condition: (deps) => deps[0]?.id === 1 // Only fetch if user exists
        }
      },
      {
        key: 'orderDetails',
        fetcher: () => fetch('/api/orders/1/details').then(res => res.json()),
        config: {
          retries: 2,
          dependencies: ['userOrders'],
          condition: (deps) => deps[0]?.length > 0 // Only fetch if user has orders
        }
      }
    ];

    await fetchSequential(fetches, { user: results.user });
  };

  // Conditional sequential fetch
  const handleConditionalSequential = async () => {
    const fetches = [
      {
        key: 'config',
        fetcher: () => fetch('/api/config').then(res => res.json()),
        config: { retries: 2 }
      },
      {
        key: 'featuredProducts',
        fetcher: () => fetch('/api/products?featured=true').then(res => res.json()),
        config: {
          retries: 2,
          dependencies: ['config'],
          condition: (deps) => deps[0]?.showFeatured === true
        }
      },
      {
        key: 'recommendations',
        fetcher: () => fetch('/api/recommendations').then(res => res.json()),
        config: {
          retries: 2,
          dependencies: ['config'],
          condition: (deps) => deps[0]?.enableRecommendations === true
        }
      }
    ];

    await fetchSequential(fetches, { config: results.config });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Sequential Data Fetching
      </h3>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          {[
            { id: 'basic', label: 'Basic' },
            { id: 'dependent', label: 'Dependent' },
            { id: 'conditional', label: 'Conditional' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 space-y-2">
        {activeTab === 'basic' && (
          <button
            onClick={handleBasicSequential}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Loading...' : 'Fetch Users → Products → Categories'}
          </button>
        )}

        {activeTab === 'dependent' && (
          <button
            onClick={handleDependentSequential}
            disabled={isLoading}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Loading...' : 'Fetch User → Orders → Details'}
          </button>
        )}

        {activeTab === 'conditional' && (
          <button
            onClick={handleConditionalSequential}
            disabled={isLoading}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Loading...' : 'Fetch Config → Conditional Data'}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isLoading && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-500">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Results Display */}
      <div className="space-y-4">
        {Object.entries(results).map(([key, data]) => (
          <div key={key} className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">{key}</h4>
            <pre className="text-sm text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      <AdvancedLoadingIndicator
        loadingManager={loadingManager}
        errorManager={errorManager}
        onRetry={() => {
          if (activeTab === 'basic') handleBasicSequential();
          if (activeTab === 'dependent') handleDependentSequential();
          if (activeTab === 'conditional') handleConditionalSequential();
        }}
      />
    </div>
  );
}

// Component for parallel data fetching demo
export function ParallelFetchingDemo() {
  const { addToCart } = useCart();
  const {
    results,
    fetchParallel,
    loadingManager,
    errorManager,
    isLoading,
    hasErrors,
    overallProgress
  } = useParallelFetch();

  const [concurrency, setConcurrency] = useState(3);

  // Basic parallel fetch
  const handleBasicParallel = async () => {
    const fetches = [
      {
        key: 'products',
        fetcher: () => fetch('/api/products').then(res => res.json()),
        config: { retries: 2, retryDelay: 1000 }
      },
      {
        key: 'categories',
        fetcher: () => fetch('/api/categories').then(res => res.json()),
        config: { retries: 2, retryDelay: 1000 }
      },
      {
        key: 'users',
        fetcher: () => fetch('/api/users').then(res => res.json()),
        config: { retries: 2, retryDelay: 1000 }
      },
      {
        key: 'orders',
        fetcher: () => fetch('/api/orders').then(res => res.json()),
        config: { retries: 2, retryDelay: 1000 }
      },
      {
        key: 'reviews',
        fetcher: () => fetch('/api/reviews').then(res => res.json()),
        config: { retries: 2, retryDelay: 1000 }
      }
    ];

    await fetchParallel(fetches, concurrency);
  };

  // Parallel fetch with error handling
  const handleParallelWithErrors = async () => {
    const fetches = [
      {
        key: 'products',
        fetcher: () => fetch('/api/products').then(res => res.json()),
        config: { retries: 2, abortOnError: false }
      },
      {
        key: 'invalidEndpoint',
        fetcher: () => fetch('/api/invalid').then(res => res.json()),
        config: { retries: 1, abortOnError: false }
      },
      {
        key: 'categories',
        fetcher: () => fetch('/api/categories').then(res => res.json()),
        config: { retries: 2, abortOnError: false }
      }
    ];

    await fetchParallel(fetches, concurrency);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Parallel Data Fetching
      </h3>

      {/* Concurrency Control */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Concurrency Limit: {concurrency}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={concurrency}
          onChange={(e) => setConcurrency(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 space-y-2">
        <button
          onClick={handleBasicParallel}
          disabled={isLoading}
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Loading...' : `Fetch All Data (${concurrency} concurrent)`}
        </button>

        <button
          onClick={handleParallelWithErrors}
          disabled={isLoading}
          className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Loading...' : 'Test Error Handling'}
        </button>
      </div>

      {/* Progress Bar */}
      {isLoading && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-500">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Results Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(results).map(([key, data]) => (
          <div key={key} className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">{key}</h4>
            <pre className="text-sm text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      <AdvancedLoadingIndicator
        loadingManager={loadingManager}
        errorManager={errorManager}
        onRetry={() => handleBasicParallel()}
      />
    </div>
  );
}

// Component for mixed sequential and parallel fetching
export function MixedFetchingDemo() {
  const { addToCart } = useCart();
  const [results, setResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<string>('');

  const handleMixedFetch = async () => {
    setIsLoading(true);
    setResults({});
    setStage('Initializing...');

    try {
      // Stage 1: Sequential - Get user and authentication
      setStage('Stage 1: Getting user data...');
      const sequentialFetcher = new SequentialDataFetcher();

      const userData = await sequentialFetcher.fetchSequential([
        {
          key: 'user',
          fetcher: () => fetch('/api/users/1').then(res => res.json()),
          config: { retries: 2 }
        },
        {
          key: 'userPreferences',
          fetcher: () => fetch('/api/users/1/preferences').then(res => res.json()),
          config: { retries: 2 }
        }
      ]);

      setResults(prev => ({ ...prev, ...userData }));

      // Stage 2: Parallel - Get all product data
      setStage('Stage 2: Loading products in parallel...');
      const parallelFetcher = new ParallelDataFetcher();

      const productData = await parallelFetcher.fetchParallel([
        {
          key: 'products',
          fetcher: () => fetch('/api/products').then(res => res.json()),
          config: { retries: 2 }
        },
        {
          key: 'categories',
          fetcher: () => fetch('/api/categories').then(res => res.json()),
          config: { retries: 2 }
        },
        {
          key: 'reviews',
          fetcher: () => fetch('/api/reviews').then(res => res.json()),
          config: { retries: 2 }
        }
      ], 3);

      setResults(prev => ({ ...prev, ...productData }));

      // Stage 3: Sequential - Process recommendations
      setStage('Stage 3: Generating recommendations...');
      const recommendationData = await sequentialFetcher.fetchSequential([
        {
          key: 'recommendations',
          fetcher: () => fetch('/api/recommendations').then(res => res.json()),
          config: { retries: 2 }
        },
        {
          key: 'personalizedOffers',
          fetcher: () => fetch('/api/offers/personalized').then(res => res.json()),
          config: { retries: 2 }
        }
      ]);

      setResults(prev => ({ ...prev, ...recommendationData }));
      setStage('Complete!');

    } catch (error) {
      console.error('Mixed fetch error:', error);
      setStage('Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Mixed Sequential & Parallel Fetching
      </h3>

      <p className="text-gray-600 mb-4">
        This demo shows how to combine sequential and parallel fetching for complex data loading scenarios.
      </p>

      {/* Action Button */}
      <div className="mb-6">
        <button
          onClick={handleMixedFetch}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Loading...' : 'Start Mixed Fetch Process'}
        </button>
      </div>

      {/* Stage Indicator */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">{stage}</p>
        </div>
      )}

      {/* Results Display */}
      <div className="space-y-4">
        {Object.entries(results).map(([key, data]) => (
          <div key={key} className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">{key}</h4>
            <pre className="text-sm text-gray-600 bg-gray-50 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main demo component
export default function AdvancedDataFetchingDemo() {
  const [activeTab, setActiveTab] = useState<'sequential' | 'parallel' | 'mixed'>('sequential');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advanced Data Fetching Demo
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive demonstration of sequential and parallel data fetching with advanced loading states and error handling
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'sequential', label: 'Sequential Fetching' },
              { id: 'parallel', label: 'Parallel Fetching' },
              { id: 'mixed', label: 'Mixed Approach' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'sequential' && <SequentialFetchingDemo />}
          {activeTab === 'parallel' && <ParallelFetchingDemo />}
          {activeTab === 'mixed' && <MixedFetchingDemo />}
        </div>

        {/* Documentation */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sequential Fetching</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fetches data one after another</li>
                <li>• Supports dependencies between requests</li>
                <li>• Conditional execution based on previous results</li>
                <li>• Perfect for dependent data flows</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Parallel Fetching</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Fetches multiple requests simultaneously</li>
                <li>• Configurable concurrency limits</li>
                <li>• Error isolation and retry logic</li>
                <li>• Ideal for independent data sources</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
