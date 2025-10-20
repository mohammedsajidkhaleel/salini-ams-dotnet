/**
 * Optimized data fetching hook with caching and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiCache, cacheKeys, cacheInvalidation } from '@/lib/cache';
import { toast } from '@/lib/toast';

interface UseApiDataOptions<T> {
  cacheKey: string;
  ttl?: number; // Time to live in milliseconds
  enabled?: boolean; // Whether to fetch data
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  refetchOnMount?: boolean; // Whether to refetch when component mounts
  invalidateOnUnmount?: boolean; // Whether to invalidate cache on unmount
}

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

export function useApiData<T>(
  fetchFn: () => Promise<T>,
  options: UseApiDataOptions<T>
): UseApiDataResult<T> {
  const {
    cacheKey,
    ttl = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
    onSuccess,
    onError,
    refetchOnMount = true,
    invalidateOnUnmount = false
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null && refetchOnMount) {
      setData(cached);
      onSuccess?.(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      
      if (!mountedRef.current) return;

      // Cache the result
      apiCache.set(cacheKey, result, ttl);
      
      setData(result);
      onSuccess?.(result);
    } catch (err: any) {
      if (!mountedRef.current) return;

      const errorMessage = err?.message || 'An error occurred while fetching data';
      setError(errorMessage);
      onError?.(err);
      
      // Show toast for non-401 errors (401 is handled globally)
      if (err?.response?.status !== 401) {
        toast.error(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, cacheKey, ttl, enabled, onSuccess, onError, refetchOnMount]);

  const refetch = useCallback(async () => {
    // Invalidate cache and refetch
    apiCache.delete(cacheKey);
    await fetchData();
  }, [fetchData, cacheKey]);

  const invalidate = useCallback(() => {
    apiCache.delete(cacheKey);
    setData(null);
  }, [cacheKey]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (invalidateOnUnmount) {
        apiCache.delete(cacheKey);
      }
    };
  }, [cacheKey, invalidateOnUnmount]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  };
}

/**
 * Hook for paginated data with caching
 */
interface UsePaginatedApiDataOptions<T> {
  cacheKey: string;
  ttl?: number;
  enabled?: boolean;
  onSuccess?: (data: T[]) => void;
  onError?: (error: any) => void;
  refetchOnMount?: boolean;
}

interface UsePaginatedApiDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function usePaginatedApiData<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; totalCount: number; hasMore: boolean }>,
  options: UsePaginatedApiDataOptions<T>
): UsePaginatedApiDataResult<T> {
  const {
    cacheKey,
    ttl = 5 * 60 * 1000,
    enabled = true,
    onSuccess,
    onError,
    refetchOnMount = true
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!enabled) return;

    const pageCacheKey = `${cacheKey}_page_${page}`;
    
    // Check cache first
    const cached = apiCache.get<{ items: T[]; totalCount: number; hasMore: boolean }>(pageCacheKey);
    if (cached !== null && refetchOnMount && !append) {
      setData(cached.items);
      setHasMore(cached.hasMore);
      setCurrentPage(page);
      onSuccess?.(cached.items);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, 20); // Default page size of 20
      
      if (!mountedRef.current) return;

      // Cache the result
      apiCache.set(pageCacheKey, result, ttl);
      
      if (append) {
        setData(prev => [...prev, ...result.items]);
      } else {
        setData(result.items);
      }
      
      setHasMore(result.hasMore);
      setCurrentPage(page);
      onSuccess?.(result.items);
    } catch (err: any) {
      if (!mountedRef.current) return;

      const errorMessage = err?.message || 'An error occurred while fetching data';
      setError(errorMessage);
      onError?.(err);
      
      if (err?.response?.status !== 401) {
        toast.error(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, cacheKey, ttl, enabled, onSuccess, onError, refetchOnMount]);

  const refetch = useCallback(async () => {
    // Invalidate all pages and refetch from page 1
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith(cacheKey)) {
        apiCache.delete(key);
      }
    });
    setData([]);
    setCurrentPage(1);
    await fetchData(1, false);
  }, [fetchData, cacheKey]);

  const invalidate = useCallback(() => {
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith(cacheKey)) {
        apiCache.delete(key);
      }
    });
    setData([]);
    setCurrentPage(1);
    setHasMore(true);
  }, [cacheKey]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await fetchData(currentPage + 1, true);
    }
  }, [fetchData, currentPage, hasMore, loading]);

  useEffect(() => {
    if (enabled) {
      fetchData(1, false);
    }
  }, [fetchData, enabled]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    hasMore,
    loadMore
  };
}

/**
 * Hook for real-time data with periodic refresh
 */
interface UseRealtimeApiDataOptions<T> {
  cacheKey: string;
  ttl?: number;
  refreshInterval?: number; // Refresh interval in milliseconds
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

export function useRealtimeApiData<T>(
  fetchFn: () => Promise<T>,
  options: UseRealtimeApiDataOptions<T>
): UseApiDataResult<T> {
  const {
    cacheKey,
    ttl = 1 * 60 * 1000, // 1 minute default for real-time data
    refreshInterval = 30 * 1000, // 30 seconds default refresh
    enabled = true,
    onSuccess,
    onError
  } = options;

  const result = useApiData(fetchFn, {
    cacheKey,
    ttl,
    enabled,
    onSuccess,
    onError,
    refetchOnMount: true
  });

  useEffect(() => {
    if (!enabled || !refreshInterval) return;

    const interval = setInterval(() => {
      result.refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, refreshInterval, result.refetch]);

  return result;
}