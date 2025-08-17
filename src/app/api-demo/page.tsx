'use client';

import { useState, useEffect } from 'react';
import { useErrorHandler } from '../../components/ErrorBoundary';
import { handleClientError } from '../../lib/errorHandler';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "API Demo - Next.js E-Commerce Store",
  description: "Interactive demonstration of Next.js API routes with full CRUD operations, dynamic routing, and real-time data management.",
};

// Interface for API response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  inStock: boolean;
  stock: number;
}

export default function ApiDemoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [apiResponse, setApiResponse] = useState<string>('');
  const { handleError } = useErrorHandler();
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Electronics'
  });

  // Fetch all products
  const fetchProducts = async (filters?: { category?: string; search?: string }) => {
    setLoading(true);
    setApiResponse('Loading products...');

    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);

      const response = await fetch(`/api/products?${params}`);
      const result: ApiResponse<{ products: Product[] }> = await response.json();

      if (result.success && result.data) {
        setProducts(result.data.products);
        setApiResponse(`✅ ${result.message} - Found ${result.data.products.length} products`);
      } else {
        setApiResponse(`❌ ${result.error || 'Failed to fetch products'}`);
      }
    } catch (error) {
      const errorId = handleError(error as Error, { action: 'fetchProducts' });
      setApiResponse(`❌ Network error: ${error} (ID: ${errorId})`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single product
  const fetchProduct = async (id: number) => {
    setLoading(true);
    setApiResponse(`Loading product ${id}...`);

    try {
      const response = await fetch(`/api/products/${id}`);
      const result: ApiResponse<Product> = await response.json();

      if (result.success && result.data) {
        setSelectedProduct(result.data);
        setApiResponse(`✅ ${result.message}`);
      } else {
        setApiResponse(`❌ ${result.error || 'Failed to fetch product'}`);
        setSelectedProduct(null);
      }
    } catch (error) {
      const errorId = handleError(error as Error, { action: 'fetchProduct' });
      setApiResponse(`❌ Network error: ${error} (ID: ${errorId})`);
      setSelectedProduct(null);
    } finally {
      setLoading(false);
    }
  };

  // Create new product
  const createProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.description) {
      setApiResponse('❌ Please fill in all required fields');
      return;
    }

    setLoading(true);
    setApiResponse('Creating product...');

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          inStock: true,
          stock: 10
        }),
      });

      const result: ApiResponse<Product> = await response.json();

      if (result.success) {
        setApiResponse(`✅ ${result.message}`);
        setNewProduct({ name: '', price: '', description: '', category: 'Electronics' });
        fetchProducts(); // Refresh the list
      } else {
        setApiResponse(`❌ ${result.error || 'Failed to create product'}`);
      }
    } catch (error) {
      const errorId = handleError(error as Error, { action: 'createProduct' });
      setApiResponse(`❌ Network error: ${error} (ID: ${errorId})`);
    } finally {
      setLoading(false);
    }
  };

  // Update product stock
  const updateStock = async (id: number, newStock: number) => {
    setLoading(true);
    setApiResponse(`Updating stock for product ${id}...`);

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStock',
          quantity: newStock
        }),
      });

      const result: ApiResponse<Product> = await response.json();

      if (result.success) {
        setApiResponse(`✅ ${result.message}`);
        fetchProducts(); // Refresh the list
        if (selectedProduct?.id === id) {
          setSelectedProduct(result.data || null);
        }
      } else {
        setApiResponse(`❌ ${result.error || 'Failed to update stock'}`);
      }
    } catch (error) {
      const errorId = handleError(error as Error, { action: 'updateStock' });
      setApiResponse(`❌ Network error: ${error} (ID: ${errorId})`);
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setLoading(true);
    setApiResponse(`Deleting product ${id}...`);

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<Product> = await response.json();

      if (result.success) {
        setApiResponse(`✅ ${result.message}`);
        fetchProducts(); // Refresh the list
        if (selectedProduct?.id === id) {
          setSelectedProduct(null);
        }
      } else {
        setApiResponse(`❌ ${result.error || 'Failed to delete product'}`);
      }
    } catch (error) {
      const errorId = handleError(error as Error, { action: 'deleteProduct' });
      setApiResponse(`❌ Network error: ${error} (ID: ${errorId})`);
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">API Routes Demo</h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates Next.js API Routes with full CRUD operations.
            All data is managed through server-side API endpoints.
          </p>
        </div>

        {/* API Response Display */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg mb-8 font-mono text-sm">
          <div className="flex items-center mb-2">
            <span className="text-blue-400">API Response:</span>
            {loading && <div className="ml-2 animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>}
          </div>
          <div>{apiResponse}</div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - API Operations */}
          <div className="space-y-8">
            {/* Fetch Operations */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">📥 Fetch Operations</h2>

              <div className="space-y-4">
                <div>
                  <button
                    onClick={() => fetchProducts()}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mr-2"
                  >
                    GET /api/products
                  </button>
                  <button
                    onClick={() => fetchProducts({ category: 'Electronics' })}
                    disabled={loading}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 mr-2"
                  >
                    Filter Electronics
                  </button>
                  <button
                    onClick={() => fetchProducts({ search: 'watch' })}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Search &quot;watch&quot;
                  </button>
                  <button
                    onClick={() => fetchProduct(999)}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Test API Error (404)
                  </button>
                  <button
                    onClick={() => {
                      try {
                        throw new Error('Test client error');
                      } catch (error) {
                        const errorId = handleError(error as Error, { action: 'testClientError' });
                        setApiResponse(`❌ Client error: ${error} (ID: ${errorId})`);
                      }
                    }}
                    disabled={loading}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    Test Client Error
                  </button>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Fetch specific product:</p>
                  <div className="flex space-x-2">
                    {[1, 2, 3].map(id => (
                      <button
                        key={id}
                        onClick={() => fetchProduct(id)}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50 text-sm"
                      >
                        GET /api/products/{id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Create Product */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">➕ Create Product</h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Product name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="number"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <textarea
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                />

                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Accessories">Accessories</option>
                </select>

                <button
                  onClick={createProduct}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  POST /api/products
                </button>
              </div>
            </div>

            {/* Selected Product Details */}
            {selectedProduct && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">🔍 Selected Product</h2>

                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <Image
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      width={32}
                      height={32}
                      className="dark:invert"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedProduct.name}</h3>
                    <p className="text-gray-600 text-sm">{selectedProduct.description}</p>
                    <p className="text-blue-600 font-bold">${selectedProduct.price}</p>
                    <p className="text-sm">Stock: {selectedProduct.stock} | Status: {selectedProduct.inStock ? '✅ In Stock' : '❌ Out of Stock'}</p>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => updateStock(selectedProduct.id, selectedProduct.stock + 5)}
                    disabled={loading}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    +5 Stock (PATCH)
                  </button>
                  <button
                    onClick={() => updateStock(selectedProduct.id, Math.max(0, selectedProduct.stock - 5))}
                    disabled={loading}
                    className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
                  >
                    -5 Stock (PATCH)
                  </button>
                  <button
                    onClick={() => deleteProduct(selectedProduct.id)}
                    disabled={loading}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                  >
                    Delete (DELETE)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Products List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📦 Products ({products.length})</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
selectedProduct?.id === product.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={20}
                        height={20}
                        className="dark:invert"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>${product.price}</span>
                        <span className={product.inStock ? 'text-green-600' : 'text-red-600'}>
                          {product.inStock ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Next.js Features Explanation */}
        <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">🚀 Next.js API Features Demonstrated</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">API Routes</h3>
              <p className="text-gray-600 text-sm">
                Server-side API endpoints with full CRUD operations using HTTP methods.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Dynamic API Routes</h3>
              <p className="text-gray-600 text-sm">
                Dynamic routing for individual resources using [id] parameter.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Request Handling</h3>
              <p className="text-gray-600 text-sm">
                Proper HTTP status codes, error handling, and JSON responses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Client-Server Communication</h3>
              <p className="text-gray-600 text-sm">
                Fetch API calls from client components to server-side API routes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}