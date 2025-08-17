import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Rendering optimization configuration
export interface RenderingConfig {
  enableMemoization?: boolean;
  enableVirtualization?: boolean;
  enableLazyLoading?: boolean;
  enableIntersectionObserver?: boolean;
  enablePerformanceMonitoring?: boolean;
  memoizationThreshold?: number;
  virtualizationThreshold?: number;
  lazyLoadingThreshold?: number;
}

// Performance metrics interface
export interface PerformanceMetrics {
  renderTime: number;
  mountTime: number;
  updateTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
}

// Virtualization configuration
export interface VirtualizationConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
  enableDynamicHeight?: boolean;
}

// Default configuration
export const defaultRenderingConfig: RenderingConfig = {
  enableMemoization: true,
  enableVirtualization: true,
  enableLazyLoading: true,
  enableIntersectionObserver: true,
  enablePerformanceMonitoring: true,
  memoizationThreshold: 100,
  virtualizationThreshold: 50,
  lazyLoadingThreshold: 10
};

// Performance monitoring hook
export function usePerformanceMonitoring(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    mountTime: 0,
    updateTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    reRenderCount: 0
  });

  const renderStartTime = useRef<number>(0);
  const mountStartTime = useRef<number>(0);
  const updateStartTime = useRef<number>(0);
  const reRenderCount = useRef<number>(0);

  useEffect(() => {
    mountStartTime.current = performance.now();

    return () => {
      const mountTime = performance.now() - mountStartTime.current;
      setMetrics(prev => ({ ...prev, mountTime }));
    };
  }, []);

  useEffect(() => {
    renderStartTime.current = performance.now();
    reRenderCount.current++;

    const updateMetrics = () => {
      const renderTime = performance.now() - renderStartTime.current;
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

      setMetrics(prev => ({
        ...prev,
        renderTime,
        updateTime: renderTime,
        memoryUsage,
        reRenderCount: reRenderCount.current
      }));
    };

    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(updateMetrics);
  });

  return metrics;
}

// Memoization hook with custom comparison
export function useMemoizedValue<T>(
  value: T,
  dependencies: any[],
  comparisonFn?: (prev: T, next: T) => boolean
): T {
  const prevValue = useRef<T>(value);
  const prevDeps = useRef<any[]>(dependencies);

  return useMemo(() => {
    const depsChanged = dependencies.some((dep, index) => dep !== prevDeps.current[index]);

    if (!depsChanged) {
      return prevValue.current;
    }

    if (comparisonFn && comparisonFn(prevValue.current, value)) {
      return prevValue.current;
    }

    prevValue.current = value;
    prevDeps.current = dependencies;
    return value;
  }, dependencies);
}

// Optimized component wrapper
export function withOptimization<T extends React.ComponentType<any>>(
  Component: T,
  config: RenderingConfig = defaultRenderingConfig
): React.ComponentType<React.ComponentProps<T>> {
  const OptimizedComponent = React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison logic
    if (config.enableMemoization) {
      return JSON.stringify(prevProps) === JSON.stringify(nextProps);
    }
    return false;
  });

  return OptimizedComponent;
}

// Virtualized list component
export function VirtualizedList<T>({
  items,
  renderItem,
  config,
  className
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  config: VirtualizationConfig;
  className?: string;
}) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: config.overscan });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTop = useRef(0);

  const totalHeight = items.length * config.itemHeight;
  const visibleItems = items.slice(visibleRange.start, visibleRange.end + 1);
  const offsetY = visibleRange.start * config.itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    scrollTop.current = target.scrollTop;

    const start = Math.floor(scrollTop.current / config.itemHeight);
    const end = Math.min(
      start + Math.ceil(config.containerHeight / config.itemHeight) + config.overscan,
      items.length - 1
    );

    setVisibleRange({ start: Math.max(0, start - config.overscan), end });
  }, [config, items.length]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: config.containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleRange.start + index} style={{ height: config.itemHeight }}>
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Lazy loading hook with intersection observer
export function useLazyLoading<T>(
  items: T[],
  config: { threshold: number; rootMargin?: string } = { threshold: 10 }
) {
  const [visibleItems, setVisibleItems] = useState<T[]>(items.slice(0, config.threshold));
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!config.enableIntersectionObserver) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading) {
            setIsLoading(true);

            // Simulate loading delay
            setTimeout(() => {
              const currentCount = visibleItems.length;
              const newItems = items.slice(currentCount, currentCount + config.threshold);

              if (newItems.length > 0) {
                setVisibleItems(prev => [...prev, ...newItems]);
              }

              setIsLoading(false);
            }, 100);
          }
        });
      },
      { rootMargin: config.rootMargin || '100px' }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleItems.length, items, config, isLoading]);

  return { visibleItems, isLoading, loadingRef };
}

// Render cycle optimization hook
export function useRenderOptimization(
  config: RenderingConfig = defaultRenderingConfig
) {
  const [shouldOptimize, setShouldOptimize] = useState(false);
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);

  useEffect(() => {
    renderCount.current++;
    const currentTime = performance.now();

    if (currentTime - lastRenderTime.current < 16) { // Less than 60fps
      setShouldOptimize(true);
    }

    lastRenderTime.current = currentTime;
  });

  const optimizeRender = useCallback((callback: () => void) => {
    if (shouldOptimize) {
      requestAnimationFrame(callback);
    } else {
      callback();
    }
  }, [shouldOptimize]);

  return { shouldOptimize, optimizeRender, renderCount: renderCount.current };
}

// Debounced render hook
export function useDebouncedRender<T>(
  value: T,
  delay: number = 100
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled render hook
export function useThrottledRender<T>(
  value: T,
  delay: number = 100
): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdate = useRef(0);

  useEffect(() => {
    const now = Date.now();

    if (now - lastUpdate.current >= delay) {
      setThrottledValue(value);
      lastUpdate.current = now;
    }
  }, [value, delay]);

  return throttledValue;
}

// Component render profiler
export function RenderProfiler({
  children,
  id,
  onRender
}: {
  children: React.ReactNode;
  id: string;
  onRender?: (metrics: PerformanceMetrics) => void;
}) {
  const metrics = usePerformanceMonitoring(id);

  useEffect(() => {
    onRender?.(metrics);
  }, [metrics, onRender]);

  return <>{children}</>;
}

// Optimized image component
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  width: number;
  height: number;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500">
          <span>Failed to load image</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        {...props}
      />
    </div>
  );
}

// Optimized list component
export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  config = defaultRenderingConfig,
  virtualizationConfig,
  className
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  config?: RenderingConfig;
  virtualizationConfig?: VirtualizationConfig;
  className?: string;
}) {
  const { visibleItems, isLoading, loadingRef } = useLazyLoading(items, {
    threshold: config.lazyLoadingThreshold || 10
  });

  const MemoizedItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      const Component = withOptimization(() => renderItem(item, index), config);
      return <Component />;
    },
    [renderItem, config]
  );

  if (virtualizationConfig && items.length > (config.virtualizationThreshold || 50)) {
    return (
      <VirtualizedList
        items={items}
        renderItem={(item, index) => (
          <MemoizedItem key={keyExtractor(item, index)} item={item} index={index} />
        )}
        config={virtualizationConfig}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      {visibleItems.map((item, index) => (
        <MemoizedItem key={keyExtractor(item, index)} item={item} index={index} />
      ))}
      {isLoading && (
        <div ref={loadingRef} className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}
    </div>
  );
}

// Rendering optimization utilities
export const renderingUtils = {
  // Check if component should be optimized
  shouldOptimize: (componentName: string, renderCount: number): boolean => {
    return renderCount > 10 || componentName.includes('List') || componentName.includes('Grid');
  },

  // Get performance metrics
  getPerformanceMetrics: (): PerformanceMetrics => {
    const memory = (performance as any).memory;
    return {
      renderTime: 0,
      mountTime: 0,
      updateTime: 0,
      memoryUsage: memory?.usedJSHeapSize || 0,
      componentCount: 0,
      reRenderCount: 0
    };
  },

  // Optimize component tree
  optimizeComponentTree: (components: React.ReactNode[]): React.ReactNode[] => {
    return components.map((component, index) => {
      if (React.isValidElement(component)) {
        return React.cloneElement(component, {
          key: component.key || index,
          ...component.props
        });
      }
      return component;
    });
  },

  // Batch updates
  batchUpdates: (updates: (() => void)[]): void => {
    React.startTransition(() => {
      updates.forEach(update => update());
    });
  },

  // Preload components
  preloadComponents: (components: (() => Promise<any>)[]): void => {
    components.forEach(component => {
      component();
    });
  }
};

// Export optimization hooks
export {
  usePerformanceMonitoring,
  useMemoizedValue,
  useRenderOptimization,
  useDebouncedRender,
  useThrottledRender,
  useLazyLoading
};
