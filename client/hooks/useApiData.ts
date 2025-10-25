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
  const [loading, setLoading] = useState(true); // Start with true for initial load
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const hasFetchedRef = useRef(false);
  
  // Use refs for callbacks and fetchFn to prevent unnecessary re-renders
  const fetchFnRef = useRef(fetchFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [fetchFn, onSuccess, onError]);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null) {
      setData(cached);
      setLoading(false);
      onSuccessRef.current?.(cached);
      hasFetchedRef.current = true;
      return;
    }

    // If already fetched and don't want to refetch, skip
    if (hasFetchedRef.current && !refetchOnMount) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFnRef.current();
      
      if (!mountedRef.current) return;

      // Cache the result
      apiCache.set(cacheKey, result, ttl);
      
      setData(result);
      setLoading(false);
      onSuccessRef.current?.(result);
      hasFetchedRef.current = true;
    } catch (err: any) {
      if (!mountedRef.current) return;

      const errorMessage = err?.message || 'An error occurred while fetching data';
      setError(errorMessage);
      setLoading(false);
      onErrorRef.current?.(err);
      
      // Show toast for non-401 errors (401 is handled globally)
      if (err?.response?.status !== 401) {
        toast.error(errorMessage);
      }
    }
  }, [cacheKey, ttl, enabled, refetchOnMount]);

  const refetch = useCallback(async () => {
    // Invalidate cache and refetch
    apiCache.delete(cacheKey);
    hasFetchedRef.current = false;
    await fetchData();
  }, [fetchData, cacheKey]);

  const invalidate = useCallback(() => {
    apiCache.delete(cacheKey);
    setData(null);
    hasFetchedRef.current = false;
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
  const [loading, setLoading] = useState(true); // Start with true for initial load
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const mountedRef = useRef(true);
  const hasFetchedRef = useRef(false);
  
  // Use refs for callbacks and fetchFn to prevent unnecessary re-renders
  const fetchFnRef = useRef(fetchFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [fetchFn, onSuccess, onError]);

  const fetchData = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const pageCacheKey = `${cacheKey}_page_${page}`;
    
    // Check cache first
    const cached = apiCache.get<{ items: T[]; totalCount: number; hasMore: boolean }>(pageCacheKey);
    if (cached !== null) {
      setData(cached.items);
      setHasMore(cached.hasMore);
      setCurrentPage(page);
      setLoading(false);
      onSuccessRef.current?.(cached.items);
      hasFetchedRef.current = true;
      return;
    }

    // If already fetched and don't want to refetch, skip
    if (hasFetchedRef.current && !refetchOnMount && !append) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFnRef.current(page, 20); // Default page size of 20
      
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
      setLoading(false);
      onSuccessRef.current?.(result.items);
      hasFetchedRef.current = true;
    } catch (err: any) {
      if (!mountedRef.current) return;

      const errorMessage = err?.message || 'An error occurred while fetching data';
      setError(errorMessage);
      setLoading(false);
      onErrorRef.current?.(err);
      
      if (err?.response?.status !== 401) {
        toast.error(errorMessage);
      }
    }
  }, [cacheKey, ttl, enabled, refetchOnMount]);

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
    hasFetchedRef.current = false;
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
    hasFetchedRef.current = false;
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