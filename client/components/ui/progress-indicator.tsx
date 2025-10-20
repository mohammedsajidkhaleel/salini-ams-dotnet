/**
 * Enhanced progress indicator components
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showDescriptions?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: {
    step: 'h-6 w-6',
    line: 'h-0.5',
    text: 'text-xs',
    description: 'text-xs'
  },
  md: {
    step: 'h-8 w-8',
    line: 'h-1',
    text: 'text-sm',
    description: 'text-sm'
  },
  lg: {
    step: 'h-10 w-10',
    line: 'h-1.5',
    text: 'text-base',
    description: 'text-sm'
  }
};

export function ProgressIndicator({
  steps,
  currentStep,
  orientation = 'horizontal',
  size = 'md',
  showLabels = true,
  showDescriptions = false,
  className
}: ProgressIndicatorProps) {
  const sizeClass = sizeClasses[size];
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const getStepIcon = (step: Step, index: number) => {
    const isCompleted = step.status === 'completed' || index < currentStepIndex;
    const isCurrent = step.status === 'current' || index === currentStepIndex;
    const isError = step.status === 'error';

    if (isError) {
      return <Circle className="h-4 w-4 text-red-500" />;
    }

    if (isCompleted) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    if (isCurrent) {
      return <Loader2 className="h-4 w-4 text-cyan-600 animate-spin" />;
    }

    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  const getStepClasses = (step: Step, index: number) => {
    const isCompleted = step.status === 'completed' || index < currentStepIndex;
    const isCurrent = step.status === 'current' || index === currentStepIndex;
    const isError = step.status === 'error';

    return cn(
      'flex items-center justify-center rounded-full border-2 transition-colors',
      sizeClass.step,
      {
        'bg-green-500 border-green-500 text-white': isCompleted,
        'bg-cyan-600 border-cyan-600 text-white': isCurrent,
        'bg-red-500 border-red-500 text-white': isError,
        'bg-white border-gray-300 text-gray-400': !isCompleted && !isCurrent && !isError
      }
    );
  };

  const getLineClasses = (index: number) => {
    const isCompleted = index < currentStepIndex;
    return cn(
      'transition-colors',
      sizeClass.line,
      {
        'bg-green-500': isCompleted,
        'bg-gray-300': !isCompleted
      }
    );
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col space-y-4', className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-4">
            <div className={getStepClasses(step, index)}>
              {getStepIcon(step, index)}
            </div>
            
            <div className="flex-1 min-w-0">
              {showLabels && (
                <p className={cn('font-medium text-gray-900', sizeClass.text)}>
                  {step.title}
                </p>
              )}
              {showDescriptions && step.description && (
                <p className={cn('text-gray-500 mt-1', sizeClass.description)}>
                  {step.description}
                </p>
              )}
            </div>
            
            {index < steps.length - 1 && (
              <div className={cn('w-px h-8 ml-4', getLineClasses(index))} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={getStepClasses(step, index)}>
              {getStepIcon(step, index)}
            </div>
            
            {showLabels && (
              <div className="mt-2 text-center">
                <p className={cn('font-medium text-gray-900', sizeClass.text)}>
                  {step.title}
                </p>
                {showDescriptions && step.description && (
                  <p className={cn('text-gray-500 mt-1', sizeClass.description)}>
                    {step.description}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {index < steps.length - 1 && (
            <div className={cn('flex-1 mx-4', getLineClasses(index))} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Circular progress indicator
 */
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showValue?: boolean;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 'md',
  strokeWidth,
  showValue = false,
  showPercentage = false,
  color = 'primary',
  className
}: CircularProgressProps) {
  const sizeClasses = {
    sm: { size: 40, stroke: 4 },
    md: { size: 60, stroke: 6 },
    lg: { size: 80, stroke: 8 },
    xl: { size: 120, stroke: 10 }
  };

  const colorClasses = {
    primary: 'text-cyan-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  const { size: svgSize, stroke: defaultStroke } = sizeClasses[size];
  const stroke = strokeWidth || defaultStroke;
  const radius = (svgSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={svgSize}
        height={svgSize}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-300 ease-in-out', colorClasses[color])}
          strokeLinecap="round"
        />
      </svg>
      
      {(showValue || showPercentage) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-medium', colorClasses[color])}>
            {showValue && showPercentage ? `${value}%` : showValue ? value : `${Math.round(percentage)}%`}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Linear progress indicator
 */
interface LinearProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  animated?: boolean;
  className?: string;
}

export function LinearProgress({
  value,
  max = 100,
  size = 'md',
  showValue = false,
  showPercentage = false,
  color = 'primary',
  animated = false,
  className
}: LinearProgressProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-cyan-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  };

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {(showValue || showPercentage) && (
          <span className="text-sm font-medium text-gray-700">
            {showValue && showPercentage ? `${value}%` : showValue ? value : `${Math.round(percentage)}%`}
          </span>
        )}
      </div>
      
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            'h-full transition-all duration-300 ease-in-out rounded-full',
            colorClasses[color],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressIndicator;
