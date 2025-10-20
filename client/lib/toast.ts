/**
 * Toast Notification System
 * Centralized toast notifications for user feedback
 */

import { toast as sonnerToast } from 'sonner';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class ToastService {
  /**
   * Show success toast
   */
  success(message: string, options?: ToastOptions) {
    sonnerToast.success(options?.title || 'Success', {
      description: message,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }

  /**
   * Show error toast
   */
  error(message: string, options?: ToastOptions) {
    sonnerToast.error(options?.title || 'Error', {
      description: message,
      duration: options?.duration || 6000,
      action: options?.action,
    });
  }

  /**
   * Show warning toast
   */
  warning(message: string, options?: ToastOptions) {
    sonnerToast.warning(options?.title || 'Warning', {
      description: message,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  }

  /**
   * Show info toast
   */
  info(message: string, options?: ToastOptions) {
    sonnerToast.info(options?.title || 'Info', {
      description: message,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }

  /**
   * Show loading toast
   */
  loading(message: string, options?: { title?: string }) {
    return sonnerToast.loading(options?.title || 'Loading', {
      description: message,
    });
  }

  /**
   * Show promise toast
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      ...options,
    });
  }

  /**
   * Dismiss toast
   */
  dismiss(id?: string | number) {
    sonnerToast.dismiss(id);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    sonnerToast.dismiss();
  }
}

// Create singleton instance
export const toast = new ToastService();

// Export individual methods for convenience
export const {
  success,
  error,
  warning,
  info,
  loading,
  promise,
  dismiss,
  dismissAll,
} = toast;
