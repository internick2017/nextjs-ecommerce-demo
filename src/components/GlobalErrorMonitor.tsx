'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalErrorHandler } from './GlobalErrorBoundary';
import { globalErrorHandler } from '../lib/globalErrorHandler';

interface ErrorStats {
  errorCount: number;
  sessionId: string;
  isInitialized: boolean;
}

interface ErrorEvent {
  type: string;
  message: string;
  timestamp: string;
  url: string;
}

const GlobalErrorMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<ErrorStats>({
    errorCount: 0,
    sessionId: '',
    isInitialized: false
  });
  const [recentErrors, setRecentErrors] = useState<ErrorEvent[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { getStats } = useGlobalErrorHandler();

  useEffect(() => {
    // Update stats every 5 seconds
    const interval = setInterval(() => {
      const currentStats = getStats();
      setStats(currentStats);
    }, 5000);

    // Listen for global error events
    const handleGlobalError = (event: CustomEvent) => {
      const errorEvent = event.detail;
      const newError: ErrorEvent = {
        type: errorEvent.type,
        message: errorEvent.message || (errorEvent.error instanceof Error ? errorEvent.error.message : String(errorEvent.error)),
        timestamp: new Date().toISOString(),
        url: window.location.href
      };

      setRecentErrors(prev => [newError, ...prev.slice(0, 9)]); // Keep last 10 errors
    };

    window.addEventListener('globalError', handleGlobalError as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('globalError', handleGlobalError as EventListener);
    };
  }, [getStats]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleExpanded = () => setIsExpanded(!isExpanded);

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors z-50"
        title="Show Error Monitor"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl z-50 max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-gray-900">Error Monitor</h3>
          {stats.errorCount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {stats.errorCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleExpanded}
            className="text-gray-500 hover:text-gray-700"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>
          <button
            onClick={toggleVisibility}
            className="text-gray-500 hover:text-gray-700"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Errors</p>
            <p className="font-semibold text-gray-900">{stats.errorCount}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
            <p className={`font-semibold ${stats.isInitialized ? 'text-green-600' : 'text-red-600'}`}>
              {stats.isInitialized ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-gray-500 text-xs">Session ID</p>
          <p className="font-mono text-xs text-gray-700 truncate">{stats.sessionId}</p>
        </div>
      </div>

      {/* Recent Errors (Expanded) */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 max-h-64 overflow-y-auto">
          <h4 className="font-medium text-gray-900 mb-3">Recent Errors</h4>
          {recentErrors.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent errors</p>
          ) : (
            <div className="space-y-3">
              {recentErrors.map((error, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">{error.type}</p>
                      <p className="text-xs text-red-600 mt-1">{error.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              globalErrorHandler.reportError(new Error('Test error from monitor'));
            }}
            className="flex-1 bg-blue-600 text-white text-xs px-3 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Test Error
          </button>
          <button
            onClick={() => {
              setRecentErrors([]);
            }}
            className="flex-1 bg-gray-600 text-white text-xs px-3 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalErrorMonitor;
