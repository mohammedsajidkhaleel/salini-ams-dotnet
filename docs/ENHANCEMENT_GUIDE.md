# Salini AMS - Enhancement Guide

## Overview

This guide covers the new enhancements added to Salini AMS, including performance optimizations, error handling improvements, and UI/UX enhancements.

## Performance Optimizations

### Caching System

The application now includes a comprehensive caching system to improve performance and reduce API calls.

#### Usage

```typescript
import { apiCache, cacheKeys, cacheInvalidation } from '@/lib/cache';

// Cache API response
const cacheKey = cacheKeys.users(1, 10);
const cachedUsers = apiCache.get(cacheKey);
if (!cachedUsers) {
  const users = await fetchUsers();
  apiCache.set(cacheKey, users, 5 * 60 * 1000); // 5 minutes TTL
}

// Invalidate cache after updates
cacheInvalidation.invalidateUsers();
```

#### Cache Keys

```typescript
// User management
cacheKeys.users(page, pageSize)
cacheKeys.user(id)
cacheKeys.userPermissions(id)
cacheKeys.userProjects(id)

// Assets
cacheKeys.assets(page, pageSize, projectId)
cacheKeys.asset(id)
cacheKeys.assetStats()

// Master data (longer TTL)
cacheKeys.projects()
cacheKeys.departments()
cacheKeys.companies()
```

### Optimized Data Fetching Hooks

#### useApiData Hook

```typescript
import { useApiData } from '@/hooks/useApiData';

function UserList() {
  const { data, loading, error, refetch } = useApiData(
    () => userService.getAllUsers(),
    {
      cacheKey: 'users_all',
      ttl: 5 * 60 * 1000, // 5 minutes
      enabled: true,
      onSuccess: (users) => console.log('Users loaded:', users),
      onError: (error) => console.error('Error loading users:', error)
    }
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <UserTable users={data} />;
}
```

#### usePaginatedApiData Hook

```typescript
import { usePaginatedApiData } from '@/hooks/useApiData';

function AssetList() {
  const { data, loading, error, hasMore, loadMore } = usePaginatedApiData(
    (page, pageSize) => assetService.getAssets({ page, pageSize }),
    {
      cacheKey: 'assets_paginated',
      ttl: 5 * 60 * 1000
    }
  );

  return (
    <div>
      <AssetTable assets={data} />
      {hasMore && (
        <Button onClick={loadMore} disabled={loading}>
          Load More
        </Button>
      )}
    </div>
  );
}
```

### Performance Monitoring

```typescript
import { performanceMonitor, usePerformanceMonitoring } from '@/lib/performance';

// Monitor API calls
const result = await performanceMonitor.measureApiCall(
  () => userService.getAllUsers()
);

// Monitor component renders
const { measureRender } = usePerformanceMonitoring();
const component = measureRender(() => <ExpensiveComponent />);

// Get performance metrics
const metrics = performanceMonitor.getMetrics();
console.log('Performance metrics:', metrics);
```

## Error Handling Improvements

### Enhanced Error Handler

```typescript
import { ErrorHandler, useErrorHandler } from '@/lib/errorHandler';

// Handle API errors
try {
  await userService.createUser(userData);
} catch (error) {
  const errorInfo = ErrorHandler.handleApiError(error);
  toast.error(errorInfo.userMessage);
  
  if (errorInfo.shouldLogout) {
    // Redirect to login
  }
}

// Use in React components
function UserForm() {
  const { handleError, shouldRetry } = useErrorHandler();
  
  const handleSubmit = async (data) => {
    try {
      await userService.createUser(data);
    } catch (error) {
      handleError(error, 'UserForm');
    }
  };
}
```

### Structured Logging

```typescript
import { logger, useLogger } from '@/lib/logger';

// Basic logging
logger.info('User created successfully', 'UserService', { userId: '123' });
logger.error('Failed to create user', 'UserService', { error, userData });

// Use in React components
function UserForm() {
  const log = useLogger('UserForm');
  
  const handleSubmit = async (data) => {
    log.userAction('submit_user_form', { formData: data });
    
    try {
      await userService.createUser(data);
      log.info('User created successfully');
    } catch (error) {
      log.error('Failed to create user', { error });
    }
  };
}

// Performance logging
logger.time('user-creation');
await userService.createUser(userData);
logger.timeEnd('user-creation');

// API call logging
logger.apiCall('POST', '/api/Users', 201, 250, { userId: '123' });
```

### Error Boundaries

```typescript
import { ErrorBoundary, withErrorBoundary } from '@/components/error-boundary';

// Wrap components with error boundary
<ErrorBoundary
  onError={(error, errorInfo) => {
    logger.error('Component error', 'ErrorBoundary', { error, errorInfo });
  }}
>
  <UserForm />
</ErrorBoundary>

// HOC for error boundaries
const SafeUserForm = withErrorBoundary(UserForm, {
  fallback: <div>Something went wrong with the user form</div>
});
```

## UI/UX Enhancements

### Enhanced Loading States

```typescript
import { LoadingSpinner, LoadingOverlay, Skeleton } from '@/components/ui/loading-spinner';

// Different spinner variants
<LoadingSpinner variant="dots" size="lg" color="primary" text="Loading users..." />
<LoadingSpinner variant="pulse" size="md" color="success" />
<LoadingSpinner variant="bounce" size="sm" color="warning" />

// Loading overlay
<LoadingOverlay loading={isLoading} text="Saving user...">
  <UserForm />
</LoadingOverlay>

// Skeleton loading
<Skeleton className="h-4 w-full" />
<Skeleton variant="circular" width={40} height={40} />
<TableSkeleton rows={5} columns={4} />
<CardSkeleton showAvatar showActions />
```

### Enhanced Toast Notifications

```typescript
import { enhancedToast, useToast } from '@/components/ui/enhanced-toast';

// Basic toast notifications
enhancedToast.success('User created successfully!');
enhancedToast.error('Failed to create user', {
  description: 'Please check your input and try again.',
  action: {
    label: 'Retry',
    onClick: () => retryUserCreation()
  }
});

// Use in React components
function UserForm() {
  const toast = useToast();
  
  const handleSubmit = async (data) => {
    const loadingToast = toast.loading('Creating user...');
    
    try {
      await userService.createUser(data);
      toast.dismiss(loadingToast);
      toast.success('User created successfully!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to create user');
    }
  };
}

// Promise-based toasts
toast.promise(
  userService.createUser(userData),
  {
    loading: 'Creating user...',
    success: 'User created successfully!',
    error: 'Failed to create user'
  }
);
```

### Progress Indicators

```typescript
import { ProgressIndicator, CircularProgress, LinearProgress } from '@/components/ui/progress-indicator';

// Step progress
const steps = [
  { id: '1', title: 'User Details', status: 'completed' },
  { id: '2', title: 'Permissions', status: 'current' },
  { id: '3', title: 'Projects', status: 'pending' }
];

<ProgressIndicator
  steps={steps}
  currentStep="2"
  orientation="horizontal"
  size="md"
  showLabels
  showDescriptions
/>

// Circular progress
<CircularProgress
  value={75}
  max={100}
  size="lg"
  showPercentage
  color="primary"
/>

// Linear progress
<LinearProgress
  value={60}
  max={100}
  size="md"
  showValue
  color="success"
  animated
/>
```

### Animations

```typescript
import { animations, animationPresets, useAnimation, useStaggerAnimation } from '@/lib/animations';

// CSS classes
<div className={`${animations.fadeIn} ${animationDurations.normal}`}>
  Content
</div>

// Animation presets
<Modal className={animationPresets.modal.enter}>
  Modal content
</Modal>

// React hooks
function AnimatedList({ items }) {
  const { isVisible, startAnimation } = useAnimation(animations.fadeInUp);
  const { getItemAnimation } = useStaggerAnimation(items, animations.fadeInLeft);
  
  useEffect(() => {
    startAnimation();
  }, []);
  
  return (
    <div>
      {items.map((item, index) => (
        <div key={item.id} className={getItemAnimation(index)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

## Best Practices

### Performance

1. **Use caching strategically**: Cache frequently accessed data with appropriate TTL
2. **Implement lazy loading**: Use React.lazy for code splitting
3. **Optimize re-renders**: Use React.memo, useMemo, and useCallback
4. **Monitor performance**: Use performance monitoring tools

### Error Handling

1. **Handle errors gracefully**: Always provide user-friendly error messages
2. **Log errors appropriately**: Use structured logging with context
3. **Implement retry logic**: For transient errors, implement exponential backoff
4. **Use error boundaries**: Catch and handle component errors

### UI/UX

1. **Provide loading states**: Always show loading indicators for async operations
2. **Use consistent animations**: Follow the animation presets for consistency
3. **Implement progressive disclosure**: Show information gradually
4. **Provide feedback**: Use toast notifications for user actions

### Code Quality

1. **Use TypeScript**: Leverage type safety for better development experience
2. **Follow naming conventions**: Use consistent naming for components and functions
3. **Write meaningful comments**: Document complex logic and business rules
4. **Test thoroughly**: Write unit tests for critical functionality

## Migration Guide

### From Supabase to Custom API

1. **Update imports**: Replace supabase imports with custom API services
2. **Update data fetching**: Use the new API service methods
3. **Handle errors**: Use the enhanced error handling system
4. **Update caching**: Implement caching for better performance

### Example Migration

```typescript
// Before (Supabase)
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('is_active', true);

// After (Custom API)
const users = await userService.getUsers({
  pageNumber: 1,
  pageSize: 100,
  isActive: true
});
```

## Troubleshooting

### Common Issues

1. **Cache not updating**: Check cache invalidation after data mutations
2. **Performance issues**: Use performance monitoring to identify bottlenecks
3. **Error handling**: Ensure proper error boundaries and logging
4. **TypeScript errors**: Use proper type definitions and interfaces

### Debug Tools

1. **Performance monitoring**: Check browser dev tools and performance metrics
2. **Error logging**: Review console logs and error boundaries
3. **Cache debugging**: Use cache statistics and cleanup functions
4. **Network monitoring**: Check API calls and response times

## Support

For questions or issues with the enhancements:
- **Email**: dev@salini.com
- **Documentation**: Check the API documentation and component guides
- **Code examples**: Review the existing implementations in the codebase
