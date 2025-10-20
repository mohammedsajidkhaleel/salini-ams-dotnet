/**
 * Retry mechanism for API calls
 */

import React from 'react';
import { ErrorHandler } from './errorHandler';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
}

export class RetryManager {
  private static defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    retryCondition: (error: Error) => ErrorHandler.shouldRetry(error),
  };

  /**
   * Execute a function with retry logic
   */
  static async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error;

    for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if it's the last attempt or retry condition is false
        if (attempt === opts.maxAttempts - 1 || !opts.retryCondition(lastError)) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          opts.baseDelay * Math.pow(opts.backoffFactor, attempt),
          opts.maxDelay
        );

        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        
        // Wait before retrying
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Execute a function with retry logic and return both result and error
   */
  static async executeSafe<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<{ result?: T; error?: Error }> {
    try {
      const result = await this.execute(fn, options);
      return { result };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Delay execution for specified milliseconds
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a retry wrapper for a function
   */
  static wrap<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions = {}
  ): T {
    return (async (...args: Parameters<T>) => {
      return this.execute(() => fn(...args), options);
    }) as T;
  }
}

/**
 * Hook for retry functionality in React components
 */
export function useRetry() {
  const execute = React.useCallback(
    <T>(fn: () => Promise<T>, options?: RetryOptions) => {
      return RetryManager.execute(fn, options);
    },
    []
  );

  const executeSafe = React.useCallback(
    <T>(fn: () => Promise<T>, options?: RetryOptions) => {
      return RetryManager.executeSafe(fn, options);
    },
    []
  );

  return {
    execute,
    executeSafe,
  };
}

/**
 * Retry decorator for class methods
 */
export function retry(options: RetryOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return RetryManager.execute(() => method.apply(this, args), options);
    };

    return descriptor;
  };
}

export default RetryManager;
