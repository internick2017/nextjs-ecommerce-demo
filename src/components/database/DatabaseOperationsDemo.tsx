'use client';

import React, { useState, useEffect } from 'react';
import {
  useDatabaseQuery,
  useDatabaseMutation,
  useOptimisticMutation,
  useDatabaseSubscription,
  databaseUtils,
  DatabaseQuery,
  DatabaseMutation
} from '../../lib/databaseOperations';
import { useNotifications } from '../../contexts/AppContext';

// Component for database queries demo
export function DatabaseQueriesDemo() {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'basic' | 'pagination' | 'search' | 'realtime'>('basic');

  // Basic query - get all products
  const productsQuery: DatabaseQuery = {
    key: 'products',
    query: 'SELECT * FROM products ORDER BY name ASC',
    config: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30000 // 30 seconds
    }
  };

  const { data: products, loading, error, refetch, stale } = useDatabaseQuery(productsQuery);

  // Pagination query
  const [page, setPage] = useState(1);
  const limit = 2;

  const paginatedQuery: DatabaseQuery = {
    key: `products-page-${page}`,
    query: `SELECT * FROM products LIMIT $1 OFFSET $2`,
    params: [limit, (page - 1) * limit],
    config: {
      staleTime: 60000 // 1 minute
    }
  };

  const { data: paginatedProducts, loading: paginatedLoading } = useDatabaseQuery(paginatedQuery);

  // Search query
  const [searchTerm, setSearchTerm] = useState('');

  const searchQuery: DatabaseQuery = {
    key: `products-search-${searchTerm}`,
    query: `SELECT * FROM products WHERE name ILIKE $1 OR category ILIKE $1`,
    params: [`%${searchTerm}%`],
    config: {
      enabled: searchTerm.length > 0,
      staleTime: 30000
    }
  };

  const { data: searchResults, loading: searchLoading } = useDatabaseQuery(searchQuery);

  // Real-time subscription
  const { data: realtimeData, connected } = useDatabaseSubscription('products-realtime', products);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Database Queries Demo
      </h3>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          {[
            { id: 'basic', label: 'Basic Query' },
            { id: 'pagination', label: 'Pagination' },
            { id: 'search', label: 'Search' },
            { id: 'realtime', label: 'Real-time' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Basic Query Tab */}
      {activeTab === 'basic' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">All Products</h4>
            <div className="flex items-center space-x-2">
              {stale && (
                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  Stale
                </span>
              )}
              <button
                onClick={refetch}
                disabled={loading}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading products...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800">Error: {error.message}</p>
            </div>
          )}

          {products && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product: any) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900">{product.name}</h5>
                  <p className="text-gray-600">${product.price}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    product.inStock
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination Tab */}
      {activeTab === 'pagination' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Paginated Products</h4>

          {paginatedLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading page {page}...</p>
            </div>
          )}

          {paginatedProducts && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedProducts.map((product: any) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <h5 className="font-medium text-gray-900">{product.name}</h5>
                    <p className="text-gray-600">${product.price}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 border rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2">Page {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={paginatedProducts.length < limit}
                  className="px-3 py-2 border rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Search Products</h4>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {searchLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Searching...</p>
            </div>
          )}

          {searchResults && searchTerm && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((product: any) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900">{product.name}</h5>
                  <p className="text-gray-600">${product.price}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
              ))}
            </div>
          )}

          {searchResults && searchResults.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-gray-500">No products found for "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}

      {/* Real-time Tab */}
      {activeTab === 'realtime' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Real-time Products</h4>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {realtimeData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {realtimeData.map((product: any) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900">{product.name}</h5>
                  <p className="text-gray-600">${product.price}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Component for database mutations demo
export function DatabaseMutationsDemo() {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'create' | 'update' | 'delete' | 'optimistic'>('create');

  // Create product mutation
  const createProductMutation: DatabaseMutation = {
    key: 'createProduct',
    query: 'INSERT INTO products (name, price, category, inStock) VALUES ($1, $2, $3, $4) RETURNING *',
    config: {
      onSuccess: (data) => {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Product Created',
          message: `Successfully created ${data.name}`,
          duration: 5000
        });
      },
      onError: (error) => {
        addNotification({
          id: Date.now().toString(),
          type: 'error',
          title: 'Creation Failed',
          message: error.message,
          duration: 5000
        });
      }
    }
  };

  const { mutate: createProduct, loading: createLoading, error: createError } = useDatabaseMutation(createProductMutation);

  // Update product mutation
  const updateProductMutation: DatabaseMutation = {
    key: 'updateProduct',
    query: 'UPDATE products SET name = $1, price = $2, category = $3, inStock = $4 WHERE id = $5 RETURNING *',
    config: {
      onSuccess: (data) => {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Product Updated',
          message: `Successfully updated ${data.name}`,
          duration: 5000
        });
      }
    }
  };

  const { mutate: updateProduct, loading: updateLoading } = useDatabaseMutation(updateProductMutation);

  // Delete product mutation
  const deleteProductMutation: DatabaseMutation = {
    key: 'deleteProduct',
    query: 'DELETE FROM products WHERE id = $1 RETURNING *',
    config: {
      onSuccess: (data) => {
        addNotification({
          id: Date.now().toString(),
          type: 'success',
          title: 'Product Deleted',
          message: `Successfully deleted ${data.name}`,
          duration: 5000
        });
      }
    }
  };

  const { mutate: deleteProduct, loading: deleteLoading } = useDatabaseMutation(deleteProductMutation);

  // Optimistic update mutation
  const optimisticUpdateMutation: DatabaseMutation = {
    key: 'optimisticUpdateProduct',
    query: 'UPDATE products SET inStock = $1 WHERE id = $2 RETURNING *'
  };

  const { mutate: optimisticUpdate, loading: optimisticLoading, isOptimistic } = useOptimisticMutation(optimisticUpdateMutation, {
    optimisticData: (params) => ({ id: params[1], inStock: params[0] }),
    rollbackOnError: true,
    onSuccess: (data) => {
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Stock Updated',
        message: `Stock status updated for product ${data.id}`,
        duration: 3000
      });
    }
  });

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    inStock: true
  });

  const [updateForm, setUpdateForm] = useState({
    id: '',
    name: '',
    price: '',
    category: 'Electronics',
    inStock: true
  });

  const [deleteId, setDeleteId] = useState('');

  // Handle form submissions
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct([
      createForm.name,
      parseFloat(createForm.price),
      createForm.category,
      createForm.inStock
    ]);
    setCreateForm({ name: '', price: '', category: 'Electronics', inStock: true });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProduct([
      updateForm.name,
      parseFloat(updateForm.price),
      updateForm.category,
      updateForm.inStock,
      parseInt(updateForm.id)
    ]);
    setUpdateForm({ id: '', name: '', price: '', category: 'Electronics', inStock: true });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct([parseInt(deleteId)]);
      setDeleteId('');
    }
  };

  const handleOptimisticUpdate = async (productId: number, inStock: boolean) => {
    await optimisticUpdate([inStock, productId]);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Database Mutations Demo
      </h3>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          {[
            { id: 'create', label: 'Create' },
            { id: 'update', label: 'Update' },
            { id: 'delete', label: 'Delete' },
            { id: 'optimistic', label: 'Optimistic' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Create Product</h4>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                value={createForm.price}
                onChange={(e) => setCreateForm(prev => ({ ...prev, price: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
                <option value="Clothing">Clothing</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="inStock"
                checked={createForm.inStock}
                onChange={(e) => setCreateForm(prev => ({ ...prev, inStock: e.target.checked }))}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="inStock" className="ml-2 block text-sm text-gray-900">
                In Stock
              </label>
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {createLoading ? 'Creating...' : 'Create Product'}
            </button>
          </form>

          {createError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800">Error: {createError.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Update Tab */}
      {activeTab === 'update' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Update Product</h4>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
              <input
                type="number"
                value={updateForm.id}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, id: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={updateForm.name}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                value={updateForm.price}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, price: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={updateForm.category}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
                <option value="Clothing">Clothing</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="updateInStock"
                checked={updateForm.inStock}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, inStock: e.target.checked }))}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="updateInStock" className="ml-2 block text-sm text-gray-900">
                In Stock
              </label>
            </div>

            <button
              type="submit"
              disabled={updateLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {updateLoading ? 'Updating...' : 'Update Product'}
            </button>
          </form>
        </div>
      )}

      {/* Delete Tab */}
      {activeTab === 'delete' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Delete Product</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
              <input
                type="number"
                value={deleteId}
                onChange={(e) => setDeleteId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <button
              onClick={handleDelete}
              disabled={deleteLoading || !deleteId}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Product'}
            </button>
          </div>
        </div>
      )}

      {/* Optimistic Tab */}
      {activeTab === 'optimistic' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Optimistic Updates</h4>

          <div className="space-y-4">
            <p className="text-gray-600">
              Click the buttons below to toggle stock status with optimistic updates.
              The UI updates immediately, then syncs with the server.
            </p>

            {isOptimistic && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-yellow-800 text-sm">
                  ⚡ Optimistic update in progress...
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5].map((productId) => (
                <div key={productId} className="border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900">Product {productId}</h5>
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => handleOptimisticUpdate(productId, true)}
                      disabled={optimisticLoading}
                      className="w-full bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                    >
                      Set In Stock
                    </button>
                    <button
                      onClick={() => handleOptimisticUpdate(productId, false)}
                      disabled={optimisticLoading}
                      className="w-full bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                    >
                      Set Out of Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main demo component
export default function DatabaseOperationsDemo() {
  const [activeTab, setActiveTab] = useState<'queries' | 'mutations'>('queries');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Database Operations Demo
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive demonstration of database fetching and mutations with real-time updates and optimistic updates
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'queries', label: 'Database Queries' },
              { id: 'mutations', label: 'Database Mutations' }
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
          {activeTab === 'queries' && <DatabaseQueriesDemo />}
          {activeTab === 'mutations' && <DatabaseMutationsDemo />}
        </div>

        {/* Documentation */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Queries</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time data fetching with caching</li>
                <li>• Pagination and search functionality</li>
                <li>• Automatic refetch on focus/reconnect</li>
                <li>• Stale data detection and management</li>
                <li>• Real-time subscriptions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Mutations</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create, update, and delete operations</li>
                <li>• Optimistic updates for better UX</li>
                <li>• Automatic cache invalidation</li>
                <li>• Error handling and rollback</li>
                <li>• Success/error notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
