'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  optimisticDeleteUserAction,
  optimisticDeleteProductAction,
  optimisticUpdateUserAction,
  optimisticUpdateProductAction,
  getUsersAction,
  getProductsAction,
  OptimisticActionResponse,
  createOptimisticId,
  isOptimisticId
} from '../../lib/optimisticActions';
import { useNotifications } from '../../contexts/AppContext';

// Types for optimistic state management
interface OptimisticState<T> {
  data: T[];
  pendingDeletes: Set<number>;
  pendingUpdates: Map<number, T>;
  optimisticUpdates: Map<number, T>;
}

// Optimistic delete button component
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

// Optimistic update button component
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

// User list component with optimistic operations
function OptimisticUserList() {
  const { addNotification } = useNotifications();
  const [state, setState] = useState<OptimisticState<any>>({
    data: [],
    pendingDeletes: new Set(),
    pendingUpdates: new Map(),
    optimisticUpdates: new Map(),
  });

  // Load initial data
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await getUsersAction();
      setState(prev => ({ ...prev, data: users }));
    } catch (error) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Failed to load users',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
    }
  };

  // Optimistic delete user
  const handleDeleteUser = useCallback(async (userId: number) => {
    // Optimistically remove from UI
    setState(prev => ({
      ...prev,
      data: prev.data.filter(user => user.id !== userId),
      pendingDeletes: new Set([...prev.pendingDeletes, userId])
    }));

    try {
      const result = await optimisticDeleteUserAction(userId);

      if (result.success) {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'User Deleted',
          message: `Successfully deleted user ${result.data?.name}`,
          duration: 3000
        });
      } else {
        // Rollback on error
        await loadUsers();
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          title: 'Delete Failed',
          message: result.error || 'Failed to delete user',
          duration: 5000
        });
      }
    } catch (error) {
      // Rollback on error
      await loadUsers();
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
    } finally {
      // Remove from pending deletes
      setState(prev => ({
        ...prev,
        pendingDeletes: new Set([...prev.pendingDeletes].filter(id => id !== userId))
      }));
    }
  }, [addNotification]);

  // Optimistic update user
  const handleUpdateUser = useCallback(async (userId: number) => {
    const user = state.data.find(u => u.id === userId);
    if (!user) return;

    // Create optimistic update
    const optimisticUpdate = {
      ...user,
      name: `${user.name} (Updated)`,
      age: user.age + 1,
      updatedAt: new Date().toISOString()
    };

    // Apply optimistic update
    setState(prev => ({
      ...prev,
      data: prev.data.map(u => u.id === userId ? optimisticUpdate : u),
      pendingUpdates: new Map([...prev.pendingUpdates, [userId, optimisticUpdate]]),
      optimisticUpdates: new Map([...prev.optimisticUpdates, [userId, user]]) // Store original for rollback
    }));

    try {
      const result = await optimisticUpdateUserAction(userId, {
        name: optimisticUpdate.name,
        email: optimisticUpdate.email,
        age: optimisticUpdate.age,
        role: optimisticUpdate.role,
        bio: optimisticUpdate.bio,
        newsletter: optimisticUpdate.newsletter
      });

      if (result.success) {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'User Updated',
          message: `Successfully updated user ${result.data?.name}`,
          duration: 3000
        });
      } else {
        // Rollback on error
        setState(prev => ({
          ...prev,
          data: prev.data.map(u => u.id === userId ? prev.optimisticUpdates.get(userId) || u : u)
        }));
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          title: 'Update Failed',
          message: result.error || 'Failed to update user',
          duration: 5000
        });
      }
    } catch (error) {
      // Rollback on error
      setState(prev => ({
        ...prev,
        data: prev.data.map(u => u.id === userId ? prev.optimisticUpdates.get(userId) || u : u)
      }));
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
    } finally {
      // Remove from pending updates
      setState(prev => {
        const newPendingUpdates = new Map(prev.pendingUpdates);
        newPendingUpdates.delete(userId);
        const newOptimisticUpdates = new Map(prev.optimisticUpdates);
        newOptimisticUpdates.delete(userId);
        return {
          ...prev,
          pendingUpdates: newPendingUpdates,
          optimisticUpdates: newOptimisticUpdates
        };
      });
    }
  }, [state.data, addNotification]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimistic User Operations</h3>

      <div className="space-y-3">
        {state.data.map((user) => {
          const isPendingDelete = state.pendingDeletes.has(user.id);
          const isPendingUpdate = state.pendingUpdates.has(user.id);
          const isOptimistic = state.optimisticUpdates.has(user.id);

          return (
            <div
              key={user.id}
              className={`border rounded-lg p-4 transition-all ${
                isPendingDelete
                  ? 'opacity-50 bg-gray-50'
                  : isOptimistic
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {user.name}
                    {isOptimistic && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Optimistic
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-600">Age: {user.age} | Role: {user.role}</p>
                  {user.bio && <p className="text-sm text-gray-600">{user.bio}</p>}
                  {user.updatedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Updated: {new Date(user.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <OptimisticUpdateButton
                    id={user.id}
                    onUpdate={handleUpdateUser}
                    pending={isPendingUpdate}
                  >
                    Update
                  </OptimisticUpdateButton>
                  <OptimisticDeleteButton
                    id={user.id}
                    onDelete={handleDeleteUser}
                    pending={isPendingDelete}
                  >
                    Delete
                  </OptimisticDeleteButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.data.length === 0 && (
        <p className="text-gray-500 text-center py-8">No users available</p>
      )}
    </div>
  );
}

// Product list component with optimistic operations
function OptimisticProductList() {
  const { addNotification } = useNotifications();
  const [state, setState] = useState<OptimisticState<any>>({
    data: [],
    pendingDeletes: new Set(),
    pendingUpdates: new Map(),
    optimisticUpdates: new Map(),
  });

  // Load initial data
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const products = await getProductsAction();
      setState(prev => ({ ...prev, data: products }));
    } catch (error) {
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Failed to load products',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
    }
  };

  // Optimistic delete product
  const handleDeleteProduct = useCallback(async (productId: number) => {
    // Optimistically remove from UI
    setState(prev => ({
      ...prev,
      data: prev.data.filter(product => product.id !== productId),
      pendingDeletes: new Set([...prev.pendingDeletes, productId])
    }));

    try {
      const result = await optimisticDeleteProductAction(productId);

      if (result.success) {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Product Deleted',
          message: `Successfully deleted product ${result.data?.name}`,
          duration: 3000
        });
      } else {
        // Rollback on error
        await loadProducts();
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          title: 'Delete Failed',
          message: result.error || 'Failed to delete product',
          duration: 5000
        });
      }
    } catch (error) {
      // Rollback on error
      await loadProducts();
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
    } finally {
      // Remove from pending deletes
      setState(prev => ({
        ...prev,
        pendingDeletes: new Set([...prev.pendingDeletes].filter(id => id !== productId))
      }));
    }
  }, [addNotification]);

  // Optimistic update product
  const handleUpdateProduct = useCallback(async (productId: number) => {
    const product = state.data.find(p => p.id === productId);
    if (!product) return;

    // Create optimistic update
    const optimisticUpdate = {
      ...product,
      name: `${product.name} (Updated)`,
      price: product.price + 10,
      inStock: !product.inStock,
      updatedAt: new Date().toISOString()
    };

    // Apply optimistic update
    setState(prev => ({
      ...prev,
      data: prev.data.map(p => p.id === productId ? optimisticUpdate : p),
      pendingUpdates: new Map([...prev.pendingUpdates, [productId, optimisticUpdate]]),
      optimisticUpdates: new Map([...prev.optimisticUpdates, [productId, product]]) // Store original for rollback
    }));

    try {
      const result = await optimisticUpdateProductAction(productId, {
        name: optimisticUpdate.name,
        price: optimisticUpdate.price,
        category: optimisticUpdate.category,
        description: optimisticUpdate.description,
        inStock: optimisticUpdate.inStock,
        tags: optimisticUpdate.tags
      });

      if (result.success) {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Product Updated',
          message: `Successfully updated product ${result.data?.name}`,
          duration: 3000
        });
      } else {
        // Rollback on error
        setState(prev => ({
          ...prev,
          data: prev.data.map(p => p.id === productId ? prev.optimisticUpdates.get(productId) || p : p)
        }));
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          title: 'Update Failed',
          message: result.error || 'Failed to update product',
          duration: 5000
        });
      }
    } catch (error) {
      // Rollback on error
      setState(prev => ({
        ...prev,
        data: prev.data.map(p => p.id === productId ? prev.optimisticUpdates.get(productId) || p : p)
      }));
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000
      });
    } finally {
      // Remove from pending updates
      setState(prev => {
        const newPendingUpdates = new Map(prev.pendingUpdates);
        newPendingUpdates.delete(productId);
        const newOptimisticUpdates = new Map(prev.optimisticUpdates);
        newOptimisticUpdates.delete(productId);
        return {
          ...prev,
          pendingUpdates: newPendingUpdates,
          optimisticUpdates: newOptimisticUpdates
        };
      });
    }
  }, [state.data, addNotification]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimistic Product Operations</h3>

      <div className="space-y-3">
        {state.data.map((product) => {
          const isPendingDelete = state.pendingDeletes.has(product.id);
          const isPendingUpdate = state.pendingUpdates.has(product.id);
          const isOptimistic = state.optimisticUpdates.has(product.id);

          return (
            <div
              key={product.id}
              className={`border rounded-lg p-4 transition-all ${
                isPendingDelete
                  ? 'opacity-50 bg-gray-50'
                  : isOptimistic
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {product.name}
                    {isOptimistic && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Optimistic
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600">${product.price}</p>
                  <p className="text-sm text-gray-600">{product.category}</p>
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    product.inStock
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-2">
                      {product.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {product.updatedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Updated: {new Date(product.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <OptimisticUpdateButton
                    id={product.id}
                    onUpdate={handleUpdateProduct}
                    pending={isPendingUpdate}
                  >
                    Update
                  </OptimisticUpdateButton>
                  <OptimisticDeleteButton
                    id={product.id}
                    onDelete={handleDeleteProduct}
                    pending={isPendingDelete}
                  >
                    Delete
                  </OptimisticDeleteButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.data.length === 0 && (
        <p className="text-gray-500 text-center py-8">No products available</p>
      )}
    </div>
  );
}

// Main demo component
export default function OptimisticActionsDemo() {
  const [activeTab, setActiveTab] = useState<'users' | 'products'>('users');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Optimistic Actions Demo
          </h1>
          <p className="text-lg text-gray-600">
            Demonstration of optimistic delete and update operations with rollback capabilities
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'users', label: 'Users' },
              { id: 'products', label: 'Products' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'users' && <OptimisticUserList />}
          {activeTab === 'products' && <OptimisticProductList />}
        </div>

        {/* Documentation */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How Optimistic Updates Work</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Optimistic Delete</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Item immediately removed from UI</li>
                <li>• Delete request sent to server</li>
                <li>• On success: Item stays removed</li>
                <li>• On error: Item restored to UI</li>
                <li>• Loading state during operation</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Optimistic Update</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Changes immediately applied to UI</li>
                <li>• Update request sent to server</li>
                <li>• On success: Changes confirmed</li>
                <li>• On error: Changes rolled back</li>
                <li>• Visual indicators for optimistic state</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Key Benefits</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Instant Feedback:</strong> Users see changes immediately</li>
              <li>• <strong>Better UX:</strong> No waiting for server responses</li>
              <li>• <strong>Rollback Safety:</strong> Automatic restoration on errors</li>
              <li>• <strong>Visual States:</strong> Clear indication of optimistic vs confirmed data</li>
              <li>• <strong>Error Handling:</strong> Graceful error recovery with notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
