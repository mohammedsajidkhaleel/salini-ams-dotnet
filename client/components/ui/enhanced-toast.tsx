/**
 * Enhanced toast notification system
 */

import React from 'react';
import { toast as sonnerToast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
}

interface ToastProps {
  type: ToastType;
  title?: string;
  description?: string;
  action?: ToastOptions['action'];
  onDismiss?: () => void;
  className?: string;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: () => (
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
  )
};

const toastColors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  loading: 'bg-gray-50 border-gray-200 text-gray-800'
};

export function Toast({ type, title, description, action, onDismiss, className }: ToastProps) {
  const Icon = toastIcons[type];
  const colorClass = toastColors[type];

  return (
    <div className={cn(
      'flex items-start space-x-3 p-4 border rounded-lg shadow-lg max-w-md',
      colorClass,
      className
    )}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium">
            {title}
          </p>
        )}
        {description && (
          <p className={cn('text-sm', title ? 'mt-1' : '')}>
            {description}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Enhanced toast functions
 */
export const enhancedToast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
      onDismiss: options?.onDismiss,
      className: options?.className
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
      onDismiss: options?.onDismiss,
      className: options?.className
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
      onDismiss: options?.onDismiss,
      className: options?.className
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
      onDismiss: options?.onDismiss,
      className: options?.className
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      duration: options?.duration || Infinity,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
      onDismiss: options?.onDismiss,
      className: options?.className
    });
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  promise: (promise: Promise<any>, options: {
    loading: string;
    success: string | ((data: any) => string);
    error: string | ((error: any) => string);
    description?: string;
    duration?: number;
  }) => {
    return sonnerToast.promise(promise, options);
  }
};

/**
 * Toast container with custom styling
 */
export function ToastContainer() {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Toast notifications will be rendered here by sonner */}
    </div>
  );
}

/**
 * Hook for managing toast notifications
 */
import { useCallback } from 'react';

export function useToast() {
  const showSuccess = useCallback((message: string, options?: ToastOptions) => {
    return enhancedToast.success(message, options);
  }, []);

  const showError = useCallback((message: string, options?: ToastOptions) => {
    return enhancedToast.error(message, options);
  }, []);

  const showWarning = useCallback((message: string, options?: ToastOptions) => {
    return enhancedToast.warning(message, options);
  }, []);

  const showInfo = useCallback((message: string, options?: ToastOptions) => {
    return enhancedToast.info(message, options);
  }, []);

  const showLoading = useCallback((message: string, options?: ToastOptions) => {
    return enhancedToast.loading(message, options);
  }, []);

  const dismiss = useCallback((toastId?: string | number) => {
    enhancedToast.dismiss(toastId);
  }, []);

  const showPromise = useCallback((promise: Promise<any>, options: {
    loading: string;
    success: string | ((data: any) => string);
    error: string | ((error: any) => string);
    description?: string;
    duration?: number;
  }) => {
    return enhancedToast.promise(promise, options);
  }, []);

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    loading: showLoading,
    dismiss,
    promise: showPromise
  };
}

export default enhancedToast;