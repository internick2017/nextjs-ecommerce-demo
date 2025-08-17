import React from 'react';

// Types for advanced data fetching
export interface LoadingState {
  isLoading: boolean;
  progress?: number; // 0-100
  message?: string;
  stage?: string;
}

export interface ErrorState {
  hasError: boolean;
  error: string | null;
  retryCount: number;
  maxRetries: number;
  lastError?: Error;
}

export interface FetchConfig {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  onProgress?: (progress: number) => void;
  onStageChange?: (stage: string) => void;
}

export interface SequentialFetchConfig extends FetchConfig {
  dependencies?: string[]; // Keys that this fetch depends on
  condition?: (dependencies: any[]) => boolean; // Whether to execute this fetch
}

export interface ParallelFetchConfig extends FetchConfig {
  concurrency?: number; // Max concurrent requests
  abortOnError?: boolean; // Stop all requests if one fails
}

// Advanced loading states
export class LoadingStateManager {
  private states = new Map<string, LoadingState>();

  setLoading(key: string, loading: boolean, message?: string, progress?: number) {
    this.states.set(key, {
      isLoading: loading,
      message,
      progress,
      stage: loading ? 'loading' : 'complete'
    });
  }

  setProgress(key: string, progress: number, message?: string) {
    const current = this.states.get(key);
    if (current) {
      this.states.set(key, {
        ...current,
        progress,
        message
      });
    }
  }

  setStage(key: string, stage: string, message?: string) {
    const current = this.states.get(key);
    if (current) {
      this.states.set(key, {
        ...current,
        stage,
        message
      });
    }
  }

  getLoadingState(key: string): LoadingState {
    return this.states.get(key) || { isLoading: false };
  }

  getAllLoadingStates(): Record<string, LoadingState> {
    return Object.fromEntries(this.states);
  }

  isAnyLoading(): boolean {
    return Array.from(this.states.values()).some(state => state.isLoading);
  }

  getOverallProgress(): number {
    const states = Array.from(this.states.values());
    if (states.length === 0) return 100;

    const totalProgress = states.reduce((sum, state) => sum + (state.progress || 0), 0);
    return Math.round(totalProgress / states.length);
  }
}

// Advanced error management
export class ErrorStateManager {
  private errors = new Map<string, ErrorState>();

  setError(key: string, error: string, maxRetries: number = 3) {
    const current = this.errors.get(key) || { retryCount: 0, maxRetries };
    this.errors.set(key, {
      hasError: true,
      error,
      retryCount: current.retryCount,
      maxRetries,
      lastError: new Error(error)
    });
  }

  clearError(key: string) {
    this.errors.delete(key);
  }

  incrementRetry(key: string) {
    const current = this.errors.get(key);
    if (current) {
      this.errors.set(key, {
        ...current,
        retryCount: current.retryCount + 1
      });
    }
  }

  canRetry(key: string): boolean {
    const current = this.errors.get(key);
    return current ? current.retryCount < current.maxRetries : true;
  }

  getErrorState(key: string): ErrorState {
    return this.errors.get(key) || { hasError: false, error: null, retryCount: 0, maxRetries: 3 };
  }

  getAllErrors(): Record<string, ErrorState> {
    return Object.fromEntries(this.errors);
  }

  hasAnyErrors(): boolean {
    return Array.from(this.errors.values()).some(error => error.hasError);
  }
}

// Sequential data fetching
export class SequentialDataFetcher {
  private loadingManager = new LoadingStateManager();
  private errorManager = new ErrorStateManager();

  async fetchSequential<T>(
    fetches: Array<{
      key: string;
      fetcher: () => Promise<T>;
      config?: SequentialFetchConfig;
    }>,
    dependencies: Record<string, any> = {}
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {};
    const totalFetches = fetches.length;

    for (let i = 0; i < fetches.length; i++) {
      const { key, fetcher, config } = fetches[i];

      // Check dependencies
      if (config?.dependencies) {
        const deps = config.dependencies.map(dep => dependencies[dep]);
        if (config.condition && !config.condition(deps)) {
          continue;
        }
      }

      // Set loading state
      this.loadingManager.setLoading(key, true, `Loading ${key}...`, 0);
      config?.onStageChange?.(`Starting ${key}`);

      try {
        // Execute fetch with retry logic
        const result = await this.executeWithRetry(key, fetcher, config);
        results[key] = result;

        // Update progress
        const progress = ((i + 1) / totalFetches) * 100;
        this.loadingManager.setProgress(key, progress, `${key} completed`);
        config?.onProgress?.(progress);

        // Clear any previous errors
        this.errorManager.clearError(key);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.errorManager.setError(key, errorMessage, config?.retries || 3);

        // If abortOnError is true, stop the sequence
        if (config?.abortOnError) {
          break;
        }
      } finally {
        this.loadingManager.setLoading(key, false);
      }
    }

    return results;
  }

  private async executeWithRetry<T>(
    key: string,
    fetcher: () => Promise<T>,
    config?: FetchConfig
  ): Promise<T> {
    const maxRetries = config?.retries || 3;
    const retryDelay = config?.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetcher();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        this.errorManager.incrementRetry(key);
        this.loadingManager.setStage(key, `Retrying ${key} (${attempt}/${maxRetries})`);

        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw new Error(`Failed after ${maxRetries} attempts`);
  }

  getLoadingManager() {
    return this.loadingManager;
  }

  getErrorManager() {
    return this.errorManager;
  }
}

// Parallel data fetching with concurrency control
export class ParallelDataFetcher {
  private loadingManager = new LoadingStateManager();
  private errorManager = new ErrorStateManager();

  async fetchParallel<T>(
    fetches: Array<{
      key: string;
      fetcher: () => Promise<T>;
      config?: ParallelFetchConfig;
    }>,
    concurrency: number = 5
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {};
    const queue = [...fetches];
    const active = new Set<Promise<void>>();
    const totalFetches = fetches.length;
    let completed = 0;

    const processQueue = async () => {
      while (queue.length > 0) {
        const { key, fetcher, config } = queue.shift()!;

        // Set loading state
        this.loadingManager.setLoading(key, true, `Loading ${key}...`, 0);
        config?.onStageChange?.(`Starting ${key}`);

        const promise = this.executeWithRetry(key, fetcher, config)
          .then(result => {
            results[key] = result;
            this.errorManager.clearError(key);
          })
          .catch(error => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.errorManager.setError(key, errorMessage, config?.retries || 3);

            // If abortOnError is true, clear queue
            if (config?.abortOnError) {
              queue.length = 0;
            }
          })
          .finally(() => {
            completed++;
            const progress = (completed / totalFetches) * 100;
            this.loadingManager.setProgress(key, progress, `${key} completed`);
            config?.onProgress?.(progress);
            this.loadingManager.setLoading(key, false);
            active.delete(promise);
          });

        active.add(promise);

        // Wait if we've reached concurrency limit
        if (active.size >= concurrency) {
          await Promise.race(active);
        }
      }

      // Wait for all active promises to complete
      await Promise.all(active);
    };

    await processQueue();
    return results;
  }

  private async executeWithRetry<T>(
    key: string,
    fetcher: () => Promise<T>,
    config?: FetchConfig
  ): Promise<T> {
    const maxRetries = config?.retries || 3;
    const retryDelay = config?.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetcher();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        this.errorManager.incrementRetry(key);
        this.loadingManager.setStage(key, `Retrying ${key} (${attempt}/${maxRetries})`);

        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw new Error(`Failed after ${maxRetries} attempts`);
  }

  getLoadingManager() {
    return this.loadingManager;
  }

  getErrorManager() {
    return this.errorManager;
  }
}

// React hooks for advanced data fetching
export function useSequentialFetch<T>() {
  const [results, setResults] = React.useState<Record<string, T>>({});
  const [loadingManager] = React.useState(() => new LoadingStateManager());
  const [errorManager] = React.useState(() => new ErrorStateManager());
  const [sequentialFetcher] = React.useState(() => new SequentialDataFetcher());

  const fetchSequential = React.useCallback(async (
    fetches: Array<{
      key: string;
      fetcher: () => Promise<T>;
      config?: SequentialFetchConfig;
    }>,
    dependencies: Record<string, any> = {}
  ) => {
    const results = await sequentialFetcher.fetchSequential(fetches, dependencies);
    setResults(results);
    return results;
  }, [sequentialFetcher]);

  return {
    results,
    fetchSequential,
    loadingManager,
    errorManager,
    isLoading: loadingManager.isAnyLoading(),
    hasErrors: errorManager.hasAnyErrors(),
    overallProgress: loadingManager.getOverallProgress()
  };
}

export function useParallelFetch<T>() {
  const [results, setResults] = React.useState<Record<string, T>>({});
  const [loadingManager] = React.useState(() => new LoadingStateManager());
  const [errorManager] = React.useState(() => new ErrorStateManager());
  const [parallelFetcher] = React.useState(() => new ParallelDataFetcher());

  const fetchParallel = React.useCallback(async (
    fetches: Array<{
      key: string;
      fetcher: () => Promise<T>;
      config?: ParallelFetchConfig;
    }>,
    concurrency: number = 5
  ) => {
    const results = await parallelFetcher.fetchParallel(fetches, concurrency);
    setResults(results);
    return results;
  }, [parallelFetcher]);

  return {
    results,
    fetchParallel,
    loadingManager,
    errorManager,
    isLoading: loadingManager.isAnyLoading(),
    hasErrors: errorManager.hasAnyErrors(),
    overallProgress: loadingManager.getOverallProgress()
  };
}

// Advanced loading components
export function AdvancedLoadingIndicator({
  loadingManager,
  errorManager,
  onRetry
}: {
  loadingManager: LoadingStateManager;
  errorManager: ErrorStateManager;
  onRetry?: () => void;
}) {
  const loadingStates = loadingManager.getAllLoadingStates();
  const errorStates = errorManager.getAllErrors();
  const overallProgress = loadingManager.getOverallProgress();

  if (Object.keys(loadingStates).length === 0 && Object.keys(errorStates).length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      {/* Overall Progress */}
      {loadingManager.isAnyLoading() && (
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

      {/* Individual Loading States */}
      {Object.entries(loadingStates).map(([key, state]) => (
        <div key={key} className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{key}</span>
            {state.progress !== undefined && (
              <span className="text-xs text-gray-500">{state.progress}%</span>
            )}
          </div>
          {state.progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-green-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              ></div>
            </div>
          )}
          {state.message && (
            <p className="text-xs text-gray-500 mt-1">{state.message}</p>
          )}
        </div>
      ))}

      {/* Error States */}
      {Object.entries(errorStates).map(([key, error]) => (
        <div key={key} className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-700">{key}</span>
            <span className="text-xs text-red-500">
              {error.retryCount}/{error.maxRetries}
            </span>
          </div>
          <p className="text-xs text-red-600 mt-1">{error.error}</p>
          {errorManager.canRetry(key) && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// Utility functions
export function createSequentialFetches<T>(
  fetches: Array<{
    key: string;
    url: string;
    config?: SequentialFetchConfig;
  }>
) {
  return fetches.map(({ key, url, config }) => ({
    key,
    fetcher: () => fetch(url).then(res => res.json()),
    config
  }));
}

export function createParallelFetches<T>(
  fetches: Array<{
    key: string;
    url: string;
    config?: ParallelFetchConfig;
  }>
) {
  return fetches.map(({ key, url, config }) => ({
    key,
    fetcher: () => fetch(url).then(res => res.json()),
    config
  }));
}

// Export all utilities
export {
  LoadingStateManager,
  ErrorStateManager,
  SequentialDataFetcher,
  ParallelDataFetcher,
  AdvancedLoadingIndicator,
  createSequentialFetches,
  createParallelFetches,
};
