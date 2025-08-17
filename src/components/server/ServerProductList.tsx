import React from 'react';
import { getServerData, getServerDataSafe } from '../../lib/dataFetching';
import { Product } from '../../lib/dataLayer';

// Server component with server-side data fetching
export default async function ServerProductList() {
  // Fetch data on the server with caching
  const products = await getServerData<Product[]>(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/products`,
    {
      cache: 'force-cache', // Cache indefinitely
      revalidate: 3600, // Revalidate every hour
      tags: ['products'], // Tag for cache invalidation
    }
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {product.name}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {product.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                ${product.price}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                product.inStock
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Server component with safe data fetching (with fallback)
export async function ServerProductListSafe() {
  // Fetch data with error handling and fallback
  const products = await getServerDataSafe<Product[]>(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/products`,
    {
      cache: 'force-cache',
      revalidate: 3600,
      tags: ['products'],
      fallback: [], // Return empty array if fetch fails
    }
  );

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {product.name}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {product.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                ${product.price}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                product.inStock
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Server component with parallel data fetching
export async function ServerProductListWithCategories() {
  // Fetch products and categories in parallel
  const [products, categories] = await Promise.all([
    getServerData<Product[]>(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/products`,
      { cache: 'force-cache', revalidate: 3600 }
    ),
    getServerData<any[]>(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/categories`,
      { cache: 'force-cache', revalidate: 3600 }
    ),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories</h2>
        <div className="flex space-x-4">
          {categories.map((category) => (
            <span
              key={category.id}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {category.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {product.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">
                  ${product.price}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.inStock
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Server component with streaming data fetching
export async function ServerProductListStreaming() {
  // This would be used with streaming for large datasets
  const products = await getServerData<Product[]>(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/products`,
    { cache: 'no-store' } // No caching for real-time data
  );

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Real-time Products ({products.length})
        </h2>
        <p className="text-sm text-gray-600">
          Updated in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {product.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">
                  ${product.price}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.inStock
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
