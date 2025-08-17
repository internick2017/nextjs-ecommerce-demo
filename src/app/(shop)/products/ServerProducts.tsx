import React from 'react';
import {
  ServerDataFetcher,
  ServerRenderedList,
  ServerSearch,
  ServerPagination,
  ServerMetadata,
  ServerPerformanceMonitor,
  serverUtils,
  StreamingComponent
} from '../../../lib/serverComponents';

// Server-side product interface
interface ServerProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  tags: string[];
}

// Server-side product card component
async function ServerProductCard({ product }: { product: ServerProduct }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        {!product.inStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
            Out of Stock
          </div>
        )}
        {product.rating >= 4.5 && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded text-sm font-medium">
            ⭐ Top Rated
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-600">${product.price}</span>
          <div className="flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
            <span className="text-sm text-gray-500 ml-1">({product.reviews})</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {product.category}
          </span>
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              product.inStock
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!product.inStock}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>

        {product.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Server-side product grid component
async function ServerProductGrid({ products }: { products: ServerProduct[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <ServerProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Server-side product filters component
async function ServerProductFilters({
  categories,
  selectedCategory,
  onCategoryChange
}: {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Categories</h3>
      <div className="space-y-2">
        <button
          onClick={() => onCategoryChange('')}
          className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
            selectedCategory === ''
              ? 'bg-blue-100 text-blue-800'
              : 'hover:bg-gray-100'
          }`}
        >
          All Categories
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              selectedCategory === category
                ? 'bg-blue-100 text-blue-800'
                : 'hover:bg-gray-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

// Server-side product search component
async function ServerProductSearch({
  query,
  onSearch
}: {
  query: string;
  onSearch: (query: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Search
        </button>
      </div>
    </div>
  );
}

// Server-side product pagination component
async function ServerProductPagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.slice(
    Math.max(0, currentPage - 3),
    Math.min(totalPages, currentPage + 2)
  );

  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      {visiblePages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 border rounded-md transition-colors ${
            page === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}

// Main server-side products page component
export default async function ServerProductsPage({
  searchParams
}: {
  searchParams: { page?: string; category?: string; search?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const category = searchParams.category || '';
  const searchQuery = searchParams.search || '';

  return (
    <ServerPerformanceMonitor componentName="ServerProductsPage">
      <ServerMetadata
        title="Products - E-commerce Store"
        description="Browse our wide selection of products with server-side rendering and streaming"
        keywords="products, e-commerce, shopping, server-side rendering"
        type="website"
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Our Products
            </h1>
            <p className="text-lg text-gray-600">
              Server-side rendered with streaming and optimization
            </p>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="lg:col-span-3">
              <ServerProductSearch
                query={searchQuery}
                onSearch={(query) => {
                  // This would be handled by client-side navigation
                  console.log('Search:', query);
                }}
              />
            </div>
            <div className="lg:col-span-1">
              <ServerProductFilters
                categories={['Electronics', 'Clothing', 'Books', 'Home', 'Sports']}
                selectedCategory={category}
                onCategoryChange={(cat) => {
                  console.log('Category:', cat);
                }}
              />
            </div>
          </div>

          {/* Products Grid with Streaming */}
          <StreamingComponent config={{ enableStreaming: true, chunkSize: 8 }}>
            <ServerDataFetcher
              url={`/api/products?page=${page}&category=${category}&search=${searchQuery}`}
              cacheStrategy="revalidate"
              revalidateTime={300} // 5 minutes
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                      <div className="h-48 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              }
            >
              {(data: { products: ServerProduct[]; pagination: any }) => (
                <>
                  <ServerProductGrid products={data.products} />
                  <ServerProductPagination
                    currentPage={data.pagination.page}
                    totalPages={data.pagination.totalPages}
                    onPageChange={(newPage) => {
                      console.log('Page:', newPage);
                    }}
                  />
                </>
              )}
            </ServerDataFetcher>
          </StreamingComponent>

          {/* Server-side analytics */}
          <ServerAnalytics
            event="page_view"
            data={{
              page: 'products',
              category,
              search: searchQuery,
              userAgent: await serverUtils.getUserAgent(),
              clientIP: await serverUtils.getClientIP(),
              isBot: await serverUtils.isBot()
            }}
          >
            <div style={{ display: 'none' }}>
              {/* Analytics data will be logged on the server */}
            </div>
          </ServerAnalytics>
        </div>
      </div>
    </ServerPerformanceMonitor>
  );
}
