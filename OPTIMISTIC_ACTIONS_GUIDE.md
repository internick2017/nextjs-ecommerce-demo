# Optimistic Actions Guide

This guide covers optimistic delete and update operations with server actions, providing immediate user feedback while ensuring data consistency through rollback mechanisms.

## Table of Contents

1. [Introduction to Optimistic Actions](#introduction-to-optimistic-actions)
2. [Optimistic Delete Operations](#optimistic-delete-operations)
3. [Optimistic Update Operations](#optimistic-update-operations)
4. [State Management](#state-management)
5. [Rollback Strategies](#rollback-strategies)
6. [Error Handling](#error-handling)
7. [Visual Feedback](#visual-feedback)
8. [Best Practices](#best-practices)
9. [Advanced Patterns](#advanced-patterns)

## Introduction to Optimistic Actions

Optimistic actions provide immediate user feedback by applying changes to the UI before the server confirms them. This creates a more responsive user experience while maintaining data consistency through automatic rollback on errors.

### Key Benefits

- **Instant Feedback**: Users see changes immediately
- **Better UX**: No waiting for server responses
- **Rollback Safety**: Automatic restoration on errors
- **Visual States**: Clear indication of optimistic vs confirmed data
- **Error Recovery**: Graceful error handling with notifications

### Basic Flow

```typescript
// 1. Apply optimistic change to UI
setState(optimisticUpdate);

// 2. Send request to server
const result = await serverAction();

// 3. Handle result
if (result.success) {
  // Confirm the change
  setState(confirmedUpdate);
} else {
  // Rollback on error
  setState(originalState);
}
```

## Optimistic Delete Operations

### Basic Optimistic Delete

```typescript
const handleOptimisticDelete = async (id: number) => {
  // 1. Optimistically remove from UI
  setState(prev => ({
    ...prev,
    data: prev.data.filter(item => item.id !== id),
    pendingDeletes: new Set([...prev.pendingDeletes, id])
  }));

  try {
    // 2. Send delete request to server
    const result = await deleteAction(id);

    if (result.success) {
      // 3. Success - item stays removed
      addNotification({
        type: 'success',
        title: 'Item Deleted',
        message: 'Successfully deleted item'
      });
    } else {
      // 4. Error - restore item
      await reloadData();
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: result.error
      });
    }
  } catch (error) {
    // 5. Network error - restore item
    await reloadData();
    addNotification({
      type: 'error',
      title: 'Delete Failed',
      message: 'Network error occurred'
    });
  } finally {
    // 6. Clean up pending state
    setState(prev => ({
      ...prev,
      pendingDeletes: new Set([...prev.pendingDeletes].filter(itemId => itemId !== id))
    }));
  }
};
```

### Server Action for Delete

```typescript
'use server';

export async function optimisticDeleteUserAction(userId: number): Promise<OptimisticActionResponse> {
  try {
    // Simulate network delay for demo
    await new Promise(resolve => setTimeout(resolve, 1000));

    const deletedUser = await db.deleteUser(userId);

    // Revalidate cache
    revalidatePath('/users');
    revalidateTag('users');

    return {
      success: true,
      data: deletedUser,
      optimisticId: userId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
      optimisticId: userId,
    };
  }
}
```

### Delete Button Component

```typescript
function OptimisticDeleteButton({
  id,
  onDelete,
  pending,
  children
}: {
  id: number;
  onDelete: (id: number) => void;
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onDelete(id)}
      disabled={pending}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
        pending
          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
          : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
      }`}
    >
      {pending ? (
        <div className="flex items-center space-x-1">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
          <span>Deleting...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
```

## Optimistic Update Operations

### Basic Optimistic Update

```typescript
const handleOptimisticUpdate = async (id: number) => {
  const item = state.data.find(item => item.id === id);
  if (!item) return;

  // 1. Create optimistic update
  const optimisticUpdate = {
    ...item,
    name: `${item.name} (Updated)`,
    updatedAt: new Date().toISOString()
  };

  // 2. Apply optimistic update to UI
  setState(prev => ({
    ...prev,
    data: prev.data.map(item => item.id === id ? optimisticUpdate : item),
    pendingUpdates: new Map([...prev.pendingUpdates, [id, optimisticUpdate]]),
    optimisticUpdates: new Map([...prev.optimisticUpdates, [id, item]]) // Store original for rollback
  }));

  try {
    // 3. Send update request to server
    const result = await updateAction(id, optimisticUpdate);

    if (result.success) {
      // 4. Success - confirm the update
      addNotification({
        type: 'success',
        title: 'Item Updated',
        message: 'Successfully updated item'
      });
    } else {
      // 5. Error - rollback to original
      setState(prev => ({
        ...prev,
        data: prev.data.map(item => item.id === id ? prev.optimisticUpdates.get(id) || item : item)
      }));
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: result.error
      });
    }
  } catch (error) {
    // 6. Network error - rollback to original
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => item.id === id ? prev.optimisticUpdates.get(id) || item : item)
    }));
    addNotification({
      type: 'error',
      title: 'Update Failed',
      message: 'Network error occurred'
    });
  } finally {
    // 7. Clean up pending state
    setState(prev => {
      const newPendingUpdates = new Map(prev.pendingUpdates);
      newPendingUpdates.delete(id);
      const newOptimisticUpdates = new Map(prev.optimisticUpdates);
      newOptimisticUpdates.delete(id);
      return {
        ...prev,
        pendingUpdates: newPendingUpdates,
        optimisticUpdates: newOptimisticUpdates
      };
    });
  }
};
```

### Server Action for Update

```typescript
'use server';

export async function optimisticUpdateUserAction(userId: number, userData: any): Promise<OptimisticActionResponse> {
  try {
    // Validate data
    const validatedData = optimisticUserSchema.parse({ id: userId, ...userData });

    // Simulate network delay for demo
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedUser = await db.updateUser(userId, validatedData);

    // Revalidate cache
    revalidatePath('/users');
    revalidateTag('users');

    return {
      success: true,
      data: updatedUser,
      optimisticId: userId,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed: ' + error.errors.map(e => e.message).join(', '),
        optimisticId: userId,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
      optimisticId: userId,
    };
  }
}
```

### Update Button Component

```typescript
function OptimisticUpdateButton({
  id,
  onUpdate,
  pending,
  children
}: {
  id: number;
  onUpdate: (id: number) => void;
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onUpdate(id)}
      disabled={pending}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
        pending
          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      }`}
    >
      {pending ? (
        <div className="flex items-center space-x-1">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
          <span>Updating...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
```

## State Management

### Optimistic State Interface

```typescript
interface OptimisticState<T> {
  data: T[];
  pendingDeletes: Set<number>;
  pendingUpdates: Map<number, T>;
  optimisticUpdates: Map<number, T>;
}
```

### State Management Hook

```typescript
function useOptimisticState<T>(initialData: T[] = []) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    pendingDeletes: new Set(),
    pendingUpdates: new Map(),
    optimisticUpdates: new Map(),
  });

  const addOptimisticDelete = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      data: prev.data.filter(item => (item as any).id !== id),
      pendingDeletes: new Set([...prev.pendingDeletes, id])
    }));
  }, []);

  const removeOptimisticDelete = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      pendingDeletes: new Set([...prev.pendingDeletes].filter(itemId => itemId !== id))
    }));
  }, []);

  const addOptimisticUpdate = useCallback((id: number, optimisticData: T, originalData: T) => {
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => (item as any).id === id ? optimisticData : item),
      pendingUpdates: new Map([...prev.pendingUpdates, [id, optimisticData]]),
      optimisticUpdates: new Map([...prev.optimisticUpdates, [id, originalData]])
    }));
  }, []);

  const removeOptimisticUpdate = useCallback((id: number) => {
    setState(prev => {
      const newPendingUpdates = new Map(prev.pendingUpdates);
      newPendingUpdates.delete(id);
      const newOptimisticUpdates = new Map(prev.optimisticUpdates);
      newOptimisticUpdates.delete(id);
      return {
        ...prev,
        pendingUpdates: newPendingUpdates,
        optimisticUpdates: newOptimisticUpdates
      };
    });
  }, []);

  const rollbackUpdate = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => (item as any).id === id ? prev.optimisticUpdates.get(id) || item : item)
    }));
  }, []);

  return {
    state,
    setState,
    addOptimisticDelete,
    removeOptimisticDelete,
    addOptimisticUpdate,
    removeOptimisticUpdate,
    rollbackUpdate,
  };
}
```

## Rollback Strategies

### Automatic Rollback

```typescript
const handleOptimisticOperation = async (id: number, operation: () => Promise<any>) => {
  // Store original state
  const originalData = state.data.find(item => (item as any).id === id);

  // Apply optimistic change
  applyOptimisticChange(id);

  try {
    const result = await operation();

    if (result.success) {
      // Confirm change
      confirmChange(id, result.data);
    } else {
      // Rollback on error
      rollbackChange(id, originalData);
      showError(result.error);
    }
  } catch (error) {
    // Rollback on network error
    rollbackChange(id, originalData);
    showError('Network error occurred');
  }
};
```

### Manual Rollback

```typescript
const handleManualRollback = (id: number) => {
  const originalData = state.optimisticUpdates.get(id);
  if (originalData) {
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => (item as any).id === id ? originalData : item),
      optimisticUpdates: new Map([...prev.optimisticUpdates].filter(([key]) => key !== id))
    }));
  }
};
```

### Batch Rollback

```typescript
const handleBatchRollback = (ids: number[]) => {
  setState(prev => {
    const newData = [...prev.data];

    ids.forEach(id => {
      const originalData = prev.optimisticUpdates.get(id);
      if (originalData) {
        const index = newData.findIndex(item => (item as any).id === id);
        if (index !== -1) {
          newData[index] = originalData;
        }
      }
    });

    return {
      ...prev,
      data: newData,
      optimisticUpdates: new Map([...prev.optimisticUpdates].filter(([key]) => !ids.includes(key)))
    };
  });
};
```

## Error Handling

### Comprehensive Error Handling

```typescript
const handleOptimisticOperation = async (id: number, operation: () => Promise<any>) => {
  try {
    // Apply optimistic change
    applyOptimisticChange(id);

    const result = await operation();

    if (result.success) {
      // Success handling
      handleSuccess(result);
    } else {
      // Server error handling
      handleServerError(result.error, id);
    }
  } catch (error) {
    // Network error handling
    handleNetworkError(error, id);
  } finally {
    // Cleanup
    cleanupPendingState(id);
  }
};

const handleServerError = (error: string, id: number) => {
  // Rollback optimistic change
  rollbackChange(id);

  // Show error notification
  addNotification({
    type: 'error',
    title: 'Operation Failed',
    message: error,
    duration: 5000
  });

  // Log error for debugging
  console.error('Server error:', error);
};

const handleNetworkError = (error: any, id: number) => {
  // Rollback optimistic change
  rollbackChange(id);

  // Show network error notification
  addNotification({
    type: 'error',
    title: 'Network Error',
    message: 'Please check your connection and try again',
    duration: 5000
  });

  // Log error for debugging
  console.error('Network error:', error);
};
```

### Retry Logic

```typescript
const handleOptimisticOperationWithRetry = async (
  id: number,
  operation: () => Promise<any>,
  maxRetries: number = 3
) => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const result = await operation();

      if (result.success) {
        return result;
      } else {
        // Server error - don't retry
        throw new Error(result.error);
      }
    } catch (error) {
      retries++;

      if (retries >= maxRetries) {
        // Max retries reached - rollback
        rollbackChange(id);
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
};
```

## Visual Feedback

### Loading States

```typescript
function OptimisticItem({ item, isPending, isOptimistic, onDelete, onUpdate }) {
  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        isPending
          ? 'opacity-50 bg-gray-50'
          : isOptimistic
            ? 'border-blue-300 bg-blue-50'
            : 'border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {item.name}
            {isOptimistic && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Optimistic
              </span>
            )}
          </h4>
          {/* Item content */}
        </div>
        <div className="flex space-x-2 ml-4">
          <OptimisticUpdateButton
            id={item.id}
            onUpdate={onUpdate}
            pending={isPending}
          >
            Update
          </OptimisticUpdateButton>
          <OptimisticDeleteButton
            id={item.id}
            onDelete={onDelete}
            pending={isPending}
          >
            Delete
          </OptimisticDeleteButton>
        </div>
      </div>
    </div>
  );
}
```

### Progress Indicators

```typescript
function OptimisticProgressIndicator({ pendingOperations }) {
  if (pendingOperations.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Pending Operations</h4>
      <div className="space-y-2">
        {pendingOperations.map(operation => (
          <div key={operation.id} className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
            <span className="text-xs text-gray-600">{operation.type} {operation.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Toast Notifications

```typescript
function OptimisticNotification({ type, title, message, onDismiss }) {
  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
  const bgColor = type === 'success' ? 'bg-green-50' : type === 'error' ? 'bg-red-50' : 'bg-blue-50';
  const textColor = type === 'success' ? 'text-green-800' : type === 'error' ? 'text-red-800' : 'text-blue-800';
  const borderColor = type === 'success' ? 'border-green-200' : type === 'error' ? 'border-red-200' : 'border-blue-200';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-lg">{icon}</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
          <p className={`text-sm ${textColor}`}>{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onDismiss}
            className={`${textColor} hover:opacity-75`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Always Provide Rollback

```typescript
// Good: Always store original data for rollback
const optimisticUpdate = { ...originalData, ...changes };
setState(prev => ({
  ...prev,
  optimisticUpdates: new Map([...prev.optimisticUpdates, [id, originalData]])
}));

// Bad: No rollback mechanism
setState(prev => ({
  ...prev,
  data: prev.data.map(item => item.id === id ? optimisticUpdate : item)
}));
```

### 2. Clear Visual Indicators

```typescript
// Good: Clear visual states
const isPending = state.pendingUpdates.has(id);
const isOptimistic = state.optimisticUpdates.has(id);

return (
  <div className={`${isPending ? 'opacity-50' : ''} ${isOptimistic ? 'border-blue-300 bg-blue-50' : ''}`}>
    {/* Content */}
  </div>
);

// Bad: No visual feedback
return <div>{/* Content */}</div>;
```

### 3. Handle All Error Cases

```typescript
// Good: Comprehensive error handling
try {
  const result = await operation();
  if (result.success) {
    handleSuccess(result);
  } else {
    handleServerError(result.error);
  }
} catch (error) {
  handleNetworkError(error);
} finally {
  cleanup();
}

// Bad: Only handle success
const result = await operation();
if (result.success) {
  handleSuccess(result);
}
```

### 4. Use Appropriate Timeouts

```typescript
// Good: Reasonable timeout with retry logic
const handleOperation = async () => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 10000)
  );

  try {
    const result = await Promise.race([operation(), timeout]);
    return result;
  } catch (error) {
    if (error.message === 'Timeout') {
      rollbackChange();
      showError('Operation timed out');
    }
    throw error;
  }
};

// Bad: No timeout
const result = await operation();
```

### 5. Optimize for Performance

```typescript
// Good: Use useCallback for handlers
const handleDelete = useCallback(async (id: number) => {
  // Implementation
}, [dependencies]);

// Bad: Recreate function on every render
const handleDelete = async (id: number) => {
  // Implementation
};
```

## Advanced Patterns

### 1. Optimistic Batch Operations

```typescript
const handleBatchDelete = async (ids: number[]) => {
  // Optimistically remove all items
  setState(prev => ({
    ...prev,
    data: prev.data.filter(item => !ids.includes(item.id)),
    pendingDeletes: new Set([...prev.pendingDeletes, ...ids])
  }));

  try {
    // Send batch delete request
    const results = await Promise.allSettled(
      ids.map(id => deleteAction(id))
    );

    // Handle results
    const failedIds = results
      .map((result, index) => result.status === 'rejected' ? ids[index] : null)
      .filter(Boolean);

    if (failedIds.length > 0) {
      // Rollback failed items
      await reloadData();
      addNotification({
        type: 'error',
        title: 'Batch Delete Failed',
        message: `Failed to delete ${failedIds.length} items`
      });
    } else {
      addNotification({
        type: 'success',
        title: 'Batch Delete Successful',
        message: `Successfully deleted ${ids.length} items`
      });
    }
  } catch (error) {
    // Rollback all items
    await reloadData();
    addNotification({
      type: 'error',
      title: 'Batch Delete Failed',
      message: 'Network error occurred'
    });
  } finally {
    // Clean up pending state
    setState(prev => ({
      ...prev,
      pendingDeletes: new Set([...prev.pendingDeletes].filter(id => !ids.includes(id)))
    }));
  }
};
```

### 2. Optimistic Form Submissions

```typescript
const handleOptimisticFormSubmit = async (formData: FormData) => {
  // Create optimistic data
  const optimisticData = {
    id: createOptimisticId(),
    ...Object.fromEntries(formData),
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  // Add to UI immediately
  setState(prev => ({
    ...prev,
    data: [optimisticData, ...prev.data],
    pendingCreates: new Set([...prev.pendingCreates, optimisticData.id])
  }));

  try {
    const result = await createAction(formData);

    if (result.success) {
      // Replace optimistic data with real data
      setState(prev => ({
        ...prev,
        data: prev.data.map(item =>
          item.id === optimisticData.id ? result.data : item
        )
      }));
    } else {
      // Remove optimistic data
      setState(prev => ({
        ...prev,
        data: prev.data.filter(item => item.id !== optimisticData.id)
      }));
      showError(result.error);
    }
  } catch (error) {
    // Remove optimistic data
    setState(prev => ({
      ...prev,
      data: prev.data.filter(item => item.id !== optimisticData.id)
    }));
    showError('Network error occurred');
  } finally {
    // Clean up pending state
    setState(prev => ({
      ...prev,
      pendingCreates: new Set([...prev.pendingCreates].filter(id => id !== optimisticData.id))
    }));
  }
};
```

### 3. Optimistic Search

```typescript
const handleOptimisticSearch = async (query: string) => {
  // Show loading state immediately
  setState(prev => ({
    ...prev,
    searchQuery: query,
    isSearching: true
  }));

  try {
    const results = await searchAction(query);

    setState(prev => ({
      ...prev,
      searchResults: results,
      isSearching: false
    }));
  } catch (error) {
    setState(prev => ({
      ...prev,
      searchResults: [],
      isSearching: false
    }));
    showError('Search failed');
  }
};
```

## Summary

Optimistic actions provide an excellent user experience by:

- **Immediate Feedback**: Users see changes instantly
- **Better UX**: No waiting for server responses
- **Rollback Safety**: Automatic restoration on errors
- **Visual States**: Clear indication of optimistic vs confirmed data
- **Error Recovery**: Graceful error handling with notifications

Key implementation points:

1. **Always store original data** for rollback
2. **Provide clear visual indicators** for optimistic states
3. **Handle all error cases** comprehensively
4. **Use appropriate timeouts** and retry logic
5. **Optimize for performance** with proper memoization

Choose optimistic actions when you want to provide immediate feedback while maintaining data consistency and error recovery capabilities.
