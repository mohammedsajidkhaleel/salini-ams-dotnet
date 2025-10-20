# Error Handling Guide

This guide explains the comprehensive error handling system implemented in the Salini AMS frontend.

## Overview

The error handling system provides:
- Centralized error processing
- User-friendly error messages
- Automatic retry mechanisms
- Network status monitoring
- Loading state management
- React error boundaries

## Components

### 1. ErrorHandler (`lib/errorHandler.ts`)

Central error processing class that converts technical errors into user-friendly messages.

```typescript
import { ErrorHandler } from '@/lib/errorHandler';

// Handle API errors
try {
  await apiCall();
} catch (error) {
  const userMessage = ErrorHandler.showError(error, 'ComponentName');
  toast.error(userMessage);
}
```

**Features:**
- HTTP status code handling (400, 401, 403, 404, 409, 422, 429, 500, 503)
- Network error detection
- Validation error parsing
- Automatic logout on 401 errors
- Retry recommendations

### 2. ErrorBoundary (`components/error-boundary.tsx`)

React error boundary that catches JavaScript errors in component trees.

```typescript
import { ErrorBoundary } from '@/components/error-boundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Catches unhandled React errors
- Provides fallback UI
- Logs errors for debugging
- Retry and navigation options
- Development error details

### 3. RetryManager (`lib/retry.ts`)

Automatic retry mechanism for failed API calls.

```typescript
import { RetryManager } from '@/lib/retry';

// Execute with retry
const result = await RetryManager.execute(
  () => apiCall(),
  { maxAttempts: 3, baseDelay: 1000 }
);
```

**Features:**
- Exponential backoff
- Configurable retry conditions
- Maximum retry limits
- Safe execution mode

### 4. NetworkMonitor (`lib/network-monitor.ts`)

Monitors network connectivity and connection quality.

```typescript
import { useNetworkStatus } from '@/lib/network-monitor';

function MyComponent() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  
  if (!isOnline) {
    return <OfflineMessage />;
  }
}
```

**Features:**
- Online/offline detection
- Connection speed monitoring
- Automatic toast notifications
- React hooks for easy integration

### 5. LoadingManager (`lib/loading-manager.ts`)

Manages loading states across the application.

```typescript
import { useLoadingState } from '@/lib/loading-manager';

function MyComponent() {
  const { isLoading, startLoading, stopLoading } = useLoadingState('myOperation');
  
  const handleAction = async () => {
    startLoading('Processing...');
    try {
      await apiCall();
    } finally {
      stopLoading();
    }
  };
}
```

**Features:**
- Operation-specific loading states
- Progress tracking
- Cancellation support
- Global loading management

## Usage Patterns

### 1. API Error Handling

```typescript
import { ErrorHandler } from '@/lib/errorHandler';
import { toast } from '@/lib/toast';

const handleApiCall = async () => {
  try {
    const result = await apiService.getData();
    toast.success('Data loaded successfully');
    return result;
  } catch (error) {
    const userMessage = ErrorHandler.showError(error, 'DataLoading');
    toast.error(userMessage);
    
    // Handle logout if needed
    if (ErrorHandler.shouldLogout(error)) {
      authService.logout();
    }
  }
};
```

### 2. Retry with Loading

```typescript
import { RetryManager } from '@/lib/retry';
import { useLoadingState } from '@/lib/loading-manager';

const MyComponent = () => {
  const { startLoading, stopLoading } = useLoadingState('dataFetch');
  
  const fetchData = async () => {
    startLoading('Fetching data...');
    try {
      const result = await RetryManager.execute(
        () => apiService.getData(),
        { maxAttempts: 3 }
      );
      return result;
    } finally {
      stopLoading();
    }
  };
};
```

### 3. Network-Aware Operations

```typescript
import { useNetworkStatus } from '@/lib/network-monitor';

const MyComponent = () => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  
  const handleSync = async () => {
    if (!isOnline) {
      toast.error('You are offline. Please check your connection.');
      return;
    }
    
    if (isSlowConnection) {
      toast.warning('Slow connection detected. This may take longer.');
    }
    
    // Proceed with sync
  };
};
```

### 4. Form Error Handling

```typescript
import { ErrorHandler } from '@/lib/errorHandler';

const MyForm = () => {
  const [errors, setErrors] = useState({});
  
  const handleSubmit = async (data) => {
    try {
      await apiService.submitData(data);
      toast.success('Form submitted successfully');
    } catch (error) {
      if (error.statusCode === 422) {
        // Handle validation errors
        setErrors(ErrorHandler.getValidationErrors(error));
      } else {
        toast.error(ErrorHandler.showError(error, 'FormSubmission'));
      }
    }
  };
};
```

## Error Types

### 1. Network Errors
- Connection timeouts
- Offline status
- Slow connections
- DNS resolution failures

### 2. API Errors
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limiting
- **500 Internal Server Error**: Server issues
- **503 Service Unavailable**: Service maintenance

### 3. Validation Errors
- Required field validation
- Format validation (email, phone, etc.)
- Business rule validation
- File upload validation

### 4. React Errors
- Component rendering errors
- Hook usage errors
- State management errors
- Lifecycle errors

## Best Practices

### 1. Always Handle Errors
```typescript
// ❌ Bad
const data = await apiCall();

// ✅ Good
try {
  const data = await apiCall();
} catch (error) {
  ErrorHandler.showError(error, 'ComponentName');
}
```

### 2. Provide User Feedback
```typescript
// ❌ Bad
catch (error) {
  console.error(error);
}

// ✅ Good
catch (error) {
  const message = ErrorHandler.showError(error, 'ComponentName');
  toast.error(message);
}
```

### 3. Use Appropriate Retry Logic
```typescript
// ❌ Bad
for (let i = 0; i < 5; i++) {
  try {
    await apiCall();
    break;
  } catch (error) {
    if (i === 4) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// ✅ Good
await RetryManager.execute(() => apiCall(), { maxAttempts: 3 });
```

### 4. Handle Loading States
```typescript
// ❌ Bad
const [loading, setLoading] = useState(false);
setLoading(true);
await apiCall();
setLoading(false);

// ✅ Good
const { startLoading, stopLoading } = useLoadingState('operation');
startLoading('Processing...');
try {
  await apiCall();
} finally {
  stopLoading();
}
```

### 5. Monitor Network Status
```typescript
// ❌ Bad
await apiCall(); // May fail silently if offline

// ✅ Good
const { isOnline } = useNetworkStatus();
if (!isOnline) {
  toast.error('You are offline');
  return;
}
await apiCall();
```

## Configuration

### Error Handler Configuration
```typescript
// Custom retry conditions
const customRetryCondition = (error: Error) => {
  return error.statusCode >= 500 || error.statusCode === 429;
};

await RetryManager.execute(
  () => apiCall(),
  { 
    maxAttempts: 5,
    retryCondition: customRetryCondition 
  }
);
```

### Network Monitor Configuration
```typescript
// Custom slow connection detection
const isSlowConnection = (connection: any) => {
  return connection.effectiveType === '2g' || connection.downlink < 1;
};
```

## Testing

### Error Boundary Testing
```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error-boundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('ErrorBoundary catches errors', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
});
```

### Retry Testing
```typescript
import { RetryManager } from '@/lib/retry';

test('RetryManager retries on failure', async () => {
  let attempts = 0;
  const failingFunction = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error('Temporary failure');
    }
    return 'success';
  };
  
  const result = await RetryManager.execute(failingFunction, { maxAttempts: 3 });
  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```

## Monitoring and Logging

### Error Logging
All errors are automatically logged with context information:
- Error message and stack trace
- Component/function context
- User actions leading to error
- Network status at time of error
- Browser and device information

### Performance Monitoring
- API response times
- Retry attempt counts
- Network quality metrics
- Loading state durations

## Troubleshooting

### Common Issues

1. **Errors not being caught**
   - Ensure ErrorBoundary wraps components
   - Check try-catch blocks in async functions
   - Verify error handling in useEffect hooks

2. **Retry not working**
   - Check retry conditions
   - Verify maxAttempts configuration
   - Ensure errors are retryable

3. **Loading states not updating**
   - Check operation IDs are unique
   - Ensure startLoading/stopLoading pairs
   - Verify component unmounting

4. **Network detection issues**
   - Check browser compatibility
   - Verify event listener setup
   - Test offline/online scenarios

### Debug Mode
Enable debug mode for detailed error information:
```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  window.debugErrors = true;
}
```

This comprehensive error handling system ensures a robust and user-friendly experience across all scenarios.
