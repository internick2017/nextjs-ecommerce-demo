'use client';

import { useState } from 'react';
import { useGlobalErrorHandler } from '../../components/GlobalErrorBoundary';
import { globalErrorHandler, globalErrorUtils } from '../../lib/globalErrorHandler';
import {
  ValidationError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  DatabaseError,
  AppError
} from '../../lib/errorHandler';

interface ErrorTest {
  id: string;
  name: string;
  description: string;
  category: 'global' | 'api' | 'validation' | 'network' | 'performance' | 'custom';
  execute: () => void;
}

const GlobalErrorDemo: React.FC = () => {
  const [activeTests, setActiveTests] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; timestamp: string }>>({});
  const { reportError, getStats } = useGlobalErrorHandler();

  const executeTest = async (test: ErrorTest) => {
    setActiveTests(prev => [...prev, test.id]);

    try {
      test.execute();
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          success: true,
          message: 'Test executed successfully',
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setActiveTests(prev => prev.filter(id => id !== test.id));
    }
  };

  const errorTests: ErrorTest[] = [
    // Global Error Tests
    {
      id: 'global-js-error',
      name: 'JavaScript Error',
      description: 'Throw a standard JavaScript error',
      category: 'global',
      execute: () => {
        throw new Error('This is a test JavaScript error');
      }
    },
    {
      id: 'global-type-error',
      name: 'Type Error',
      description: 'Throw a TypeError',
      category: 'global',
      execute: () => {
        const obj = null;
        obj.nonExistentMethod();
      }
    },
    {
      id: 'global-reference-error',
      name: 'Reference Error',
      description: 'Throw a ReferenceError',
      category: 'global',
      execute: () => {
        // @ts-ignore
        nonExistentVariable.someMethod();
      }
    },
    {
      id: 'global-syntax-error',
      name: 'Syntax Error',
      description: 'Throw a SyntaxError',
      category: 'global',
      execute: () => {
        // @ts-ignore
        eval('const invalid syntax = ;');
      }
    },

    // Unhandled Promise Rejection Tests
    {
      id: 'unhandled-promise',
      name: 'Unhandled Promise Rejection',
      description: 'Create an unhandled promise rejection',
      category: 'global',
      execute: () => {
        Promise.reject(new Error('Unhandled promise rejection test'));
      }
    },
    {
      id: 'async-error',
      name: 'Async Function Error',
      description: 'Throw error in async function',
      category: 'global',
      execute: async () => {
        await new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Async error test')), 100);
        });
      }
    },

    // Network Error Tests
    {
      id: 'fetch-error',
      name: 'Fetch Error',
      description: 'Make a failed fetch request',
      category: 'network',
      execute: async () => {
        await fetch('/api/non-existent-endpoint');
      }
    },
    {
      id: 'network-timeout',
      name: 'Network Timeout',
      description: 'Simulate network timeout',
      category: 'network',
      execute: async () => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 100);
        await fetch('/api/slow-endpoint', { signal: controller.signal });
      }
    },

    // API Error Tests
    {
      id: 'api-validation-error',
      name: 'API Validation Error',
      description: 'Trigger validation error from API',
      category: 'api',
      execute: async () => {
        const response = await fetch('/api/error-demo?type=validation');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }
      }
    },
    {
      id: 'api-not-found',
      name: 'API Not Found',
      description: 'Trigger 404 error from API',
      category: 'api',
      execute: async () => {
        const response = await fetch('/api/error-demo?type=not-found');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }
      }
    },
    {
      id: 'api-rate-limit',
      name: 'API Rate Limit',
      description: 'Trigger rate limit error from API',
      category: 'api',
      execute: async () => {
        const response = await fetch('/api/error-demo?type=rate-limit');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }
      }
    },

    // Validation Error Tests
    {
      id: 'validation-error',
      name: 'Validation Error',
      description: 'Report validation error',
      category: 'validation',
      execute: () => {
        globalErrorUtils.reportValidationError('email', 'invalid-email', 'email_format');
      }
    },
    {
      id: 'app-error',
      name: 'App Error',
      description: 'Throw custom AppError',
      category: 'validation',
      execute: () => {
        throw new ValidationError('Test validation error', {
          field: 'test',
          value: 'invalid',
          rule: 'required'
        });
      }
    },

    // Performance Error Tests
    {
      id: 'performance-error',
      name: 'Performance Error',
      description: 'Report performance issue',
      category: 'performance',
      execute: () => {
        globalErrorUtils.reportPerformanceIssue('loadTime', 5000, 3000);
      }
    },
    {
      id: 'long-task',
      name: 'Long Task',
      description: 'Simulate long-running task',
      category: 'performance',
      execute: () => {
        const start = Date.now();
        while (Date.now() - start < 100) {
          // Block for 100ms
        }
        globalErrorUtils.reportPerformanceIssue('taskDuration', 100, 50);
      }
    },

    // Custom Error Tests
    {
      id: 'manual-error-report',
      name: 'Manual Error Report',
      description: 'Manually report an error',
      category: 'custom',
      execute: () => {
        reportError(new Error('Manually reported error'), {
          source: 'demo',
          action: 'test'
        });
      }
    },
    {
      id: 'console-error',
      name: 'Console Error',
      description: 'Trigger console.error',
      category: 'custom',
      execute: () => {
        console.error('Test console error message');
      }
    },
    {
      id: 'memory-leak-sim',
      name: 'Memory Leak Simulation',
      description: 'Simulate memory usage warning',
      category: 'performance',
      execute: () => {
        // Create a large array to simulate memory usage
        const largeArray = new Array(1000000).fill('test');
        globalErrorUtils.reportPerformanceIssue('memoryUsage', 90, 80);
      }
    }
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      global: 'bg-red-100 text-red-800',
      api: 'bg-blue-100 text-blue-800',
      validation: 'bg-yellow-100 text-yellow-800',
      network: 'bg-purple-100 text-purple-800',
      performance: 'bg-green-100 text-green-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Global Error Handling Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Test and explore the comprehensive global error handling system
          </p>

          {/* Stats Overview */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.errorCount}</p>
                <p className="text-sm text-gray-600">Total Errors</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.isInitialized ? 'Active' : 'Inactive'}</p>
                <p className="text-sm text-gray-600">Monitor Status</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{errorTests.length}</p>
                <p className="text-sm text-gray-600">Available Tests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{Object.keys(testResults).length}</p>
                <p className="text-sm text-gray-600">Tests Run</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">Session ID: {stats.sessionId}</p>
            </div>
          </div>
        </div>

        {/* Error Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Categories */}
          <div className="space-y-6">
            {['global', 'api', 'validation', 'network', 'performance', 'custom'].map(category => (
              <div key={category} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {category} Error Tests
                </h3>
                <div className="space-y-3">
                  {errorTests
                    .filter(test => test.category === category)
                    .map(test => (
                      <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{test.name}</h4>
                            <p className="text-sm text-gray-600 mb-3">{test.description}</p>

                            {/* Test Result */}
                            {testResults[test.id] && (
                              <div className={`text-sm p-2 rounded ${
                                testResults[test.id].success
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}>
                                {testResults[test.id].message}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => executeTest(test)}
                            disabled={activeTests.includes(test.id)}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {activeTests.includes(test.id) ? 'Running...' : 'Test'}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Features and Information */}
          <div className="space-y-6">
            {/* Global Error Handler Features */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Global Error Handler Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Automatic Error Capture</p>
                    <p className="text-sm text-gray-600">Catches JavaScript errors, unhandled rejections, and network failures</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Performance Monitoring</p>
                    <p className="text-sm text-gray-600">Tracks long tasks, memory usage, and performance issues</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Rate Limiting</p>
                    <p className="text-sm text-gray-600">Prevents error spam with configurable limits</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Error Sampling</p>
                    <p className="text-sm text-gray-600">Configurable sampling rate for production environments</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Context Collection</p>
                    <p className="text-sm text-gray-600">Gathers browser info, session data, and performance metrics</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Error Categories
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Global', desc: 'JavaScript errors, unhandled rejections' },
                  { name: 'API', desc: 'HTTP errors, validation failures' },
                  { name: 'Validation', desc: 'Form validation, data validation' },
                  { name: 'Network', desc: 'Fetch failures, timeouts' },
                  { name: 'Performance', desc: 'Long tasks, memory issues' },
                  { name: 'Custom', desc: 'Manual error reporting' }
                ].map(cat => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{cat.name}</p>
                      <p className="text-sm text-gray-600">{cat.desc}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(cat.name.toLowerCase())}`}>
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Examples */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Usage Examples
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900 mb-2">Manual Error Reporting</p>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`globalErrorHandler.reportError(
  new Error('Custom error'),
  { source: 'component', action: 'user-click' }
);`}
                  </pre>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">API Error Reporting</p>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`globalErrorUtils.reportApiError(
  '/api/users',
  500,
  'Internal server error'
);`}
                  </pre>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Performance Monitoring</p>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`globalErrorUtils.reportPerformanceIssue(
  'loadTime',
  5000,
  3000
);`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            How to Use
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">1. Test Error Scenarios</h4>
              <ul className="space-y-1">
                <li>• Click "Test" buttons to trigger different error types</li>
                <li>• Watch the Error Monitor (bottom-right corner)</li>
                <li>• Check browser console for detailed logs</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Monitor in Real-time</h4>
              <ul className="space-y-1">
                <li>• Error Monitor shows live statistics</li>
                <li>• Expand to see recent error history</li>
                <li>• Use "Test Error" to manually trigger errors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalErrorDemo;
