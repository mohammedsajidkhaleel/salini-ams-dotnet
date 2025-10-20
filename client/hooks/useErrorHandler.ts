/**
 * Enhanced error handling hook for React components
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorHandler, type ErrorInfo } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface UseErrorHandlerResult {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
  handleError: (error: Error | any, context?: string) => void;
  clearError: () => void;
  retry: () => void;
  shouldRetry: boolean;
  shouldLogout: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerResult {
  const {
    showToast = true,
    logError = true,
    context = 'useErrorHandler',
    onError,
    onRetry
  } = options;

  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const handleError = useCallback((error: Error | any, errorContext?: string) => {
    const actualError = error instanceof Error ? error : new Error(String(error));
    const actualContext = errorContext || context;
    
    const processedErrorInfo = ErrorHandler.handleApiError(actualError);
    
    setError(actualError);
    setErrorInfo(processedErrorInfo);

    // Log error if enabled
    if (logError) {
      logger.error(actualError.message, actualContext, {
        error: actualError,
        errorInfo: processedErrorInfo,
        retryCount: retryCountRef.current
      });
    }

    // Show toast if enabled and not a logout error
    if (showToast && !processedErrorInfo.shouldLogout) {
      toast.error(processedErrorInfo.userMessage);
    }

    // Call custom error handler
    if (onError) {
      onError(actualError, processedErrorInfo);
    }

    // Reset retry count on new error
    retryCountRef.current = 0;
  }, [showToast, logError, context, onError]);

  const clearError = useCallback(() => {
    setError(null);
    setErrorInfo(null);
    setIsRetrying(false);
    retryCountRef.current = 0;
  }, []);

  const retry = useCallback(async () => {
    if (isRetrying || retryCountRef.current >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    retryCountRef.current += 1;

    try {
      // Call custom retry handler
      if (onRetry) {
        await onRetry();
      }
      
      // Clear error on successful retry
      clearError();
      
      logger.info(`Retry successful (attempt ${retryCountRef.current})`, context);
    } catch (retryError) {
      logger.warn(`Retry failed (attempt ${retryCountRef.current})`, context, { retryError });
      
      if (retryCountRef.current >= maxRetries) {
        handleError(retryError, `${context}_retry_exhausted`);
      } else {
        // Wait before next retry (exponential backoff)
        const delay = ErrorHandler.getRetryDelay(retryCountRef.current);
        setTimeout(() => {
          setIsRetrying(false);
        }, delay);
      }
    }
  }, [isRetrying, onRetry, clearError, handleError, context]);

  // Auto-retry for retryable errors
  useEffect(() => {
    if (errorInfo?.shouldRetry && !isRetrying && retryCountRef.current < maxRetries) {
      const delay = ErrorHandler.getRetryDelay(retryCountRef.current);
      const timeoutId = setTimeout(() => {
        retry();
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [errorInfo?.shouldRetry, isRetrying, retry]);

  return {
    error,
    errorInfo,
    isRetrying,
    handleError,
    clearError,
    retry,
    shouldRetry: errorInfo?.shouldRetry || false,
    shouldLogout: errorInfo?.shouldLogout || false
  };
}

/**
 * Hook for handling async operations with error handling
 */
interface UseAsyncOperationOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  logError?: boolean;
  context?: string;
}

interface UseAsyncOperationResult<T> {
  execute: (...args: any[]) => Promise<T | null>;
  loading: boolean;
  error: Error | null;
  result: T | null;
  clearError: () => void;
}

export function useAsyncOperation<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncOperationResult<T> {
  const {
    onSuccess,
    onError,
    showToast = true,
    logError = true,
    context = 'useAsyncOperation'
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<T | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const operationResult = await asyncFn(...args);
      setResult(operationResult);
      onSuccess?.(operationResult);
      return operationResult;
    } catch (err) {
      const actualError = err instanceof Error ? err : new Error(String(err));
      setError(actualError);

      if (logError) {
        logger.error(actualError.message, context, { error: actualError, args });
      }

      if (showToast) {
        const errorInfo = ErrorHandler.handleApiError(actualError);
        toast.error(errorInfo.userMessage);
      }

      onError?.(actualError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [asyncFn, onSuccess, onError, showToast, logError, context]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    execute,
    loading,
    error,
    result,
    clearError
  };
}

/**
 * Hook for handling form submission with error handling
 */
interface UseFormSubmissionOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  logError?: boolean;
  context?: string;
}

interface UseFormSubmissionResult<T> {
  submit: (data: any) => Promise<T | null>;
  loading: boolean;
  error: Error | null;
  result: T | null;
  clearError: () => void;
}

export function useFormSubmission<T>(
  submitFn: (data: any) => Promise<T>,
  options: UseFormSubmissionOptions<T> = {}
): UseFormSubmissionResult<T> {
  const {
    onSuccess,
    onError,
    showToast = true,
    logError = true,
    context = 'useFormSubmission'
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<T | null>(null);

  const submit = useCallback(async (data: any): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const submitResult = await submitFn(data);
      setResult(submitResult);
      onSuccess?.(submitResult);
      return submitResult;
    } catch (err) {
      const actualError = err instanceof Error ? err : new Error(String(err));
      setError(actualError);

      if (logError) {
        logger.error(actualError.message, context, { error: actualError, formData: data });
      }

      if (showToast) {
        const errorInfo = ErrorHandler.handleApiError(actualError);
        toast.error(errorInfo.userMessage);
      }

      onError?.(actualError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [submitFn, onSuccess, onError, showToast, logError, context]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    submit,
    loading,
    error,
    result,
    clearError
  };
}

export default useErrorHandler;
