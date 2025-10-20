/**
 * Performance monitoring and optimization utilities
 */

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  memoryUsage?: number;
  bundleSize?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    this.observeNavigationTiming();
    
    // Monitor resource timing
    this.observeResourceTiming();
    
    // Monitor long tasks
    this.observeLongTasks();
    
    // Monitor memory usage (if available)
    this.observeMemoryUsage();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear performance metrics
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Measure API response time
   */
  measureApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return apiCall().then(result => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.metrics.push({
        loadTime: 0,
        renderTime: 0,
        apiResponseTime: responseTime
      });
      
      return result;
    });
  }

  /**
   * Measure component render time
   */
  measureRender<T>(renderFn: () => T): T {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    this.metrics.push({
      loadTime: 0,
      renderTime: endTime - startTime,
      apiResponseTime: 0
    });
    
    return result;
  }

  private observeNavigationTiming() {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.metrics.push({
            loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
            renderTime: 0,
            apiResponseTime: 0
          });
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  private observeResourceTiming() {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          // Log slow resources
          if (resourceEntry.duration > 1000) {
            console.warn(`Slow resource: ${resourceEntry.name} took ${resourceEntry.duration}ms`);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  private observeLongTasks() {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'longtask') {
          console.warn(`Long task detected: ${entry.duration}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
    this.observers.push(observer);
  }

  private observeMemoryUsage() {
    if (typeof window === 'undefined') return;

    // Check memory usage periodically
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.push({
          loadTime: 0,
          renderTime: 0,
          apiResponseTime: 0,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
        });
      }
    }, 30000); // Check every 30 seconds
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
import { useEffect, useRef } from 'react';

export function usePerformanceMonitoring(enabled: boolean = true) {
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    startTimeRef.current = performance.now();
    performanceMonitor.startMonitoring();

    return () => {
      performanceMonitor.stopMonitoring();
    };
  }, [enabled]);

  const measureRender = <T>(renderFn: () => T): T => {
    return performanceMonitor.measureRender(renderFn);
  };

  const measureApiCall = <T>(apiCall: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureApiCall(apiCall);
  };

  return {
    measureRender,
    measureApiCall,
    getMetrics: () => performanceMonitor.getMetrics(),
    clearMetrics: () => performanceMonitor.clearMetrics()
  };
}

/**
 * Bundle size analyzer
 */
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return null;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  const analysis = {
    scripts: scripts.map(script => ({
      src: script.getAttribute('src'),
      size: 'unknown' // Would need to fetch and measure
    })),
    stylesheets: stylesheets.map(link => ({
      href: link.getAttribute('href'),
      size: 'unknown' // Would need to fetch and measure
    })),
    totalScripts: scripts.length,
    totalStylesheets: stylesheets.length
  };

  return analysis;
}

/**
 * Image optimization utilities
 */
export const imageOptimization = {
  /**
   * Lazy load images
   */
  lazyLoadImages: () => {
    if (typeof window === 'undefined') return;

    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  },

  /**
   * Preload critical images
   */
  preloadImages: (urls: string[]) => {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }
};

/**
 * Code splitting utilities
 */
export const codeSplitting = {
  /**
   * Lazy load component with loading fallback
   */
  lazyLoadComponent: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) => {
    return React.lazy(importFn);
  },

  /**
   * Preload component
   */
  preloadComponent: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ) => {
    return importFn();
  }
};

/**
 * Memory management utilities
 */
export const memoryManagement = {
  /**
   * Clear unused cache entries
   */
  clearUnusedCache: () => {
    // This would integrate with the cache system
    console.log('Clearing unused cache entries...');
  },

  /**
   * Force garbage collection (if available)
   */
  forceGC: () => {
    if ('gc' in window) {
      (window as any).gc();
    }
  }
};

// Start monitoring automatically in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  performanceMonitor.startMonitoring();
}
