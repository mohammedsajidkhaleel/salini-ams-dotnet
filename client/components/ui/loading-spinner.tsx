/**
 * Enhanced loading spinner component with different variants
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'bars';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const colorClasses = {
  primary: 'text-cyan-600',
  secondary: 'text-gray-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600'
};

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  color = 'primary',
  className,
  text
}: LoadingSpinnerProps) {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={cn('flex space-x-1', className)}>
            <div className={cn('h-2 w-2 rounded-full bg-current animate-bounce', colorClass)} style={{ animationDelay: '0ms' }} />
            <div className={cn('h-2 w-2 rounded-full bg-current animate-bounce', colorClass)} style={{ animationDelay: '150ms' }} />
            <div className={cn('h-2 w-2 rounded-full bg-current animate-bounce', colorClass)} style={{ animationDelay: '300ms' }} />
          </div>
        );

      case 'pulse':
        return (
          <div className={cn('rounded-full bg-current animate-pulse', sizeClass, colorClass, className)} />
        );

      case 'bounce':
        return (
          <div className={cn('rounded-full bg-current animate-bounce', sizeClass, colorClass, className)} />
        );

      case 'bars':
        return (
          <div className={cn('flex space-x-1', className)}>
            <div className={cn('h-full w-1 bg-current animate-pulse', colorClass)} style={{ animationDelay: '0ms' }} />
            <div className={cn('h-full w-1 bg-current animate-pulse', colorClass)} style={{ animationDelay: '150ms' }} />
            <div className={cn('h-full w-1 bg-current animate-pulse', colorClass)} style={{ animationDelay: '300ms' }} />
            <div className={cn('h-full w-1 bg-current animate-pulse', colorClass)} style={{ animationDelay: '450ms' }} />
          </div>
        );

      default:
        return (
          <div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', sizeClass, colorClass, className)} />
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderSpinner()}
      {text && (
        <p className={cn('text-sm font-medium', colorClass)}>
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * Loading overlay component
 */
interface LoadingOverlayProps {
  loading: boolean;
  text?: string;
  variant?: LoadingSpinnerProps['variant'];
  size?: LoadingSpinnerProps['size'];
  color?: LoadingSpinnerProps['color'];
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({
  loading,
  text,
  variant = 'default',
  size = 'lg',
  color = 'primary',
  className,
  children
}: LoadingOverlayProps) {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <LoadingSpinner
          variant={variant}
          size={size}
          color={color}
          text={text}
        />
      </div>
    </div>
  );
}

/**
 * Skeleton loading component
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: ''
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
}

/**
 * Table skeleton loading
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header skeleton */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-6 flex-1" />
        ))}
      </div>
      
      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card skeleton loading
 */
interface CardSkeletonProps {
  className?: string;
  showAvatar?: boolean;
  showActions?: boolean;
}

export function CardSkeleton({ className, showAvatar = false, showActions = false }: CardSkeletonProps) {
  return (
    <div className={cn('p-6 border rounded-lg space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      
      {/* Actions */}
      {showActions && (
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      )}
    </div>
  );
}

export default LoadingSpinner;
