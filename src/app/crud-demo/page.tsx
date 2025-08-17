'use client';

import { useState, useEffect } from 'react';
import { routeHelpers } from '../../lib/routeHandler';

interface Entity {
  id: string;
  [key: string]: any;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  pagination?: any;
}

const CrudDemo: React.FC = () => {
  const [activeEntity, setActiveEntity] = useState<'users' | 'products' | 'orders' | 'categories' | 'reviews'>('products');
  const [data, setData] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Entity | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pagination, setPagination] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const entities = {
    users: {
      name: 'Users',
      fields: ['email', 'name', 'role', 'isActive'],
      required: ['email', 'name', 'role'],
      sampleData: {
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user',
        isActive: true,
        phone: '+1234567890'
      }
    },
    products: {
      name: 'Products',
      fields: ['name', 'description', 'price', 'category', 'inStock'],
      required: ['name', 'description', 'price', 'category'],
      sampleData: {
        name: 'New Product',
        description: 'A new product description',
        price: 99.99,
        category: 'Electronics',
        inStock: true,
        stock: 10,
        rating: 0,
        reviews: 0,
        tags: ['new', 'featured']
      }
    },
    orders: {
      name: 'Orders',
      fields: ['userId', 'status', 'total', 'paymentStatus'],
      required: ['userId', 'items', 'total', 'shippingAddress', 'paymentMethod'],
      sampleData: {
        userId: 'id_2',
        items: [
          {
            productId: 'id_1',
            quantity: 1,
            price: 299.99,
            name: 'Premium Headphones'
          }
        ],
        status: 'pending',
        total: 299.99,
        shippingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        },
        paymentMethod: 'credit_card',
        paymentStatus: 'pending'
      }
    },
    categories: {
      name: 'Categories',
      fields: ['name', 'description', 'isActive'],
      required: ['name', 'description'],
      sampleData: {
        name: 'New Category',
        description: 'A new category description',
        isActive: true
      }
    },
    reviews: {
      name: 'Reviews',
      fields: ['productId', 'userId', 'rating', 'title'],
      required: ['productId', 'userId', 'rating', 'title', 'comment'],
      sampleData: {
        productId: 'id_1',
        userId: 'id_2',
        rating: 5,
        title: 'Great Product!',
        comment: 'This is an excellent product that I highly recommend.',
        isVerified: false
      }
    }
  };

  const fetchData = async (page = 1, search = '') => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '5',
        ...(search && { search })
      });

      const response = await fetch(`/api/${activeEntity}?${params}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setData(result.data || []);
        setPagination(result.pagination || null);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/${activeEntity}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setFormData({});
        fetchData(currentPage, searchTerm);
      } else {
        setError(result.error || 'Failed to create item');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async () => {
    if (!selectedItem) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/${activeEntity}?id=${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setFormData({});
        setSelectedItem(null);
        fetchData(currentPage, searchTerm);
      } else {
        setError(result.error || 'Failed to update item');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/${activeEntity}?id=${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        fetchData(currentPage, searchTerm);
      } else {
        setError(result.error || 'Failed to delete item');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Entity) => {
    setSelectedItem(item);
    setFormData(item);
  };

  const handleCancel = () => {
    setSelectedItem(null);
    setFormData({});
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, searchTerm);
  };

  const loadSampleData = () => {
    setFormData(entities[activeEntity].sampleData);
  };

  useEffect(() => {
    fetchData(1, '');
    setCurrentPage(1);
    setSearchTerm('');
    setSelectedItem(null);
    setFormData({});
  }, [activeEntity]);

  const currentEntity = entities[activeEntity];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CRUD Operations Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test Create, Read, Update, and Delete operations for different entities
          </p>
        </div>

        {/* Entity Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Entity</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(entities).map(([key, entity]) => (
              <button
                key={key}
                onClick={() => setActiveEntity(key as any)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  activeEntity === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium">{entity.name}</h3>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Data Display */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentEntity.name} Data
              </h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              {data.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">ID: {item.id}</h3>
                      <div className="mt-2 space-y-1">
                        {currentEntity.fields.map((field) => (
                          <p key={field} className="text-sm text-gray-600">
                            <span className="font-medium">{field}:</span>{' '}
                            {typeof item[field] === 'boolean'
                              ? item[field] ? 'Yes' : 'No'
                              : String(item[field] || 'N/A')}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                  ({pagination.totalItems} total items)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedItem ? 'Edit' : 'Create'} {currentEntity.name.slice(0, -1)}
              </h2>
              <button
                onClick={loadSampleData}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Load Sample
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); selectedItem ? updateItem() : createItem(); }}>
              <div className="space-y-4">
                {currentEntity.fields.map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                      {currentEntity.required.includes(field) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {field === 'isActive' || field === 'inStock' || field === 'isVerified' ? (
                      <select
                        value={formData[field] || ''}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : field === 'role' ? (
                      <select
                        value={formData[field] || ''}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select role...</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="guest">Guest</option>
                      </select>
                    ) : field === 'status' ? (
                      <select
                        value={formData[field] || ''}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select status...</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : field === 'paymentStatus' ? (
                      <select
                        value={formData[field] || ''}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select payment status...</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                      </select>
                    ) : field === 'rating' ? (
                      <select
                        value={formData[field] || ''}
                        onChange={(e) => setFormData({ ...formData, [field]: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select rating...</option>
                        {[1, 2, 3, 4, 5].map(rating => (
                          <option key={rating} value={rating}>{rating} Star{rating !== 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field === 'price' || field === 'stock' || field === 'reviews' ? 'number' : 'text'}
                        value={formData[field] || ''}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Enter ${field}`}
                      />
                    )}
                  </div>
                ))}

                {/* Additional fields for complex entities */}
                {activeEntity === 'orders' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Address (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(formData.shippingAddress || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const address = JSON.parse(e.target.value);
                          setFormData({ ...formData, shippingAddress: address });
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Enter shipping address as JSON"
                    />
                  </div>
                )}

                {activeEntity === 'reviews' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comment
                    </label>
                    <textarea
                      value={formData.comment || ''}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter review comment"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (selectedItem ? 'Update' : 'Create')}
                </button>
                {selectedItem && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            API Endpoints for {currentEntity.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Read Operations</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• <code>GET /api/{activeEntity}</code> - List all</li>
                <li>• <code>GET /api/{activeEntity}?id=123</code> - Get by ID</li>
                <li>• <code>GET /api/{activeEntity}?search=term</code> - Search</li>
                <li>• <code>GET /api/{activeEntity}?page=1&limit=10</code> - Pagination</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Write Operations</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• <code>POST /api/{activeEntity}</code> - Create new</li>
                <li>• <code>PUT /api/{activeEntity}?id=123</code> - Full update</li>
                <li>• <code>PATCH /api/{activeEntity}?id=123</code> - Partial update</li>
                <li>• <code>DELETE /api/{activeEntity}?id=123</code> - Delete</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrudDemo;
