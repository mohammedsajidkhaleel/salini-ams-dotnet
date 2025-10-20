/**
 * Error Handler for Salini AMS
 * Centralized error handling and user-friendly error messages
 */

import { type ApiError } from './apiClient';

export interface ErrorInfo {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
  userMessage: string;
  shouldRetry: boolean;
  shouldLogout: boolean;
}

export class ErrorHandler {
  /**
   * Handle API errors and convert them to user-friendly messages
   */
  static handleApiError(error: ApiError | Error): ErrorInfo {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: error.message,
        userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
        shouldRetry: true,
        shouldLogout: false,
      };
    }

    // Handle API errors
    if ('statusCode' in error) {
      const apiError = error as ApiError;
      
      switch (apiError.statusCode) {
        case 400:
          return {
            message: apiError.message,
            statusCode: apiError.statusCode,
            details: apiError.details,
            userMessage: this.getBadRequestMessage(apiError),
            shouldRetry: false,
            shouldLogout: false,
          };

        case 401:
          return {
            message: apiError.message,
            statusCode: apiError.statusCode,
            userMessage: 'Your session has expired. Please log in again.',
            shouldRetry: false,
            shouldLogout: true,
          };

        case 403:
          return {
            message: apiError.message,
            statusCode: apiError.statusCode,
            userMessage: 'You do not have permission to perform this action.',
            shouldRetry: false,
            shouldLogout: false,
          };

        case 404:
          return {
            message: apiError.message,
            statusCode: apiError.statusCode,
            userMessage: 'The requested resource was not found.',
            shouldRetry: false,
            shouldLogout: false,
          };

        case 409:
          return {
            message: apiError.message,
            statusCode: apiError.statusCode,
            userMessage: 'This resource already exists or conflicts with existing data.',
            shouldRetry: false,
            shouldLogout: false,
          };

        case 422:
          return {
            message: apiError.message,
            statusCode: apiError.statusCode,
            details: apiError.details,
            userMessage: this.getValidationErrorMessage(apiError),
            shouldRetry: false,
            shouldLogout: false,
          };

        case 429:
          return {
            message: apiError.message,
            statusCode: apiError.statusCode,
            userMessage: 'Too many requests. Please wait a moment and try again.',
            shouldRetry: true,
            shouldLogout: false,
          };

        case 500:
          return {
            message: apiError.message,
            statusCode: apiError.statusCode,
            userMessage: 'An internal server error occurred. Please try again later.',
            shouldRetry: true,
            shouldLogout: false,
          };

        case 503:
          return {
            message: apiError.message,
            statusCode: apiError.statusCode,
            userMessage: 'The service is temporarily unavailable. Please try again later.',
            shouldRetry: true,
            shouldLogout: false,
          };

        default:
          return {
            message: apiError.message,
            statusCode: apiError.statusCode,
            userMessage: 'An unexpected error occurred. Please try again.',
            shouldRetry: true,
            shouldLogout: false,
          };
      }
    }

    // Handle generic errors
    return {
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      shouldRetry: true,
      shouldLogout: false,
    };
  }

  /**
   * Get user-friendly message for bad request errors
   */
  private static getBadRequestMessage(error: ApiError): string {
    if (error.details && typeof error.details === 'object') {
      // Handle validation errors
      if ('errors' in error.details) {
        const errors = (error.details as any).errors;
        if (typeof errors === 'object') {
          const firstError = Object.values(errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            return firstError[0] as string;
          }
        }
      }

      // Handle specific error messages
      if ('message' in error.details) {
        return (error.details as any).message;
      }
    }

    return 'Invalid request. Please check your input and try again.';
  }

  /**
   * Get user-friendly message for validation errors
   */
  private static getValidationErrorMessage(error: ApiError): string {
    if (error.details && typeof error.details === 'object') {
      // Handle FluentValidation errors
      if ('errors' in error.details) {
        const errors = (error.details as any).errors;
        if (typeof errors === 'object') {
          const errorMessages = Object.values(errors).flat();
          if (errorMessages.length > 0) {
            return errorMessages.join(', ');
          }
        }
      }

      // Handle specific validation messages
      if ('message' in error.details) {
        return (error.details as any).message;
      }
    }

    return 'Please check your input and try again.';
  }

  /**
   * Log error for debugging
   */
  static logError(error: Error | ApiError, context?: string): void {
    const errorInfo = this.handleApiError(error);
    
    console.error(`[${context || 'ErrorHandler'}]`, {
      message: errorInfo.message,
      statusCode: errorInfo.statusCode,
      details: errorInfo.details,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  /**
   * Show error to user (can be extended to use toast notifications)
   */
  static showError(error: Error | ApiError, context?: string): string {
    const errorInfo = this.handleApiError(error);
    this.logError(error, context);
    return errorInfo.userMessage;
  }

  /**
   * Check if error should trigger logout
   */
  static shouldLogout(error: Error | ApiError): boolean {
    const errorInfo = this.handleApiError(error);
    return errorInfo.shouldLogout;
  }

  /**
   * Check if error should trigger retry
   */
  static shouldRetry(error: Error | ApiError): boolean {
    const errorInfo = this.handleApiError(error);
    return errorInfo.shouldRetry;
  }

  /**
   * Get retry delay in milliseconds
   */
  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }
}

/**
 * Hook for handling errors in React components
 */
export function useErrorHandler() {
  const handleError = (error: Error | ApiError, context?: string) => {
    return ErrorHandler.showError(error, context);
  };

  const shouldLogout = (error: Error | ApiError) => {
    return ErrorHandler.shouldLogout(error);
  };

  const shouldRetry = (error: Error | ApiError) => {
    return ErrorHandler.shouldRetry(error);
  };

  return {
    handleError,
    shouldLogout,
    shouldRetry,
  };
}

export default ErrorHandler;
