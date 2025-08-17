import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  withParams,
  paramSchemas,
  processParams,
  staticParamsUtils,
  paramUtils
} from '../../../../lib/paramsHandler';

// Product interface
interface Product {
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

// Mock product data
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Laptop Pro',
    description: 'High-performance laptop for professionals',
    price: 1299.99,
    category: 'electronics',
    image: 'https://picsum.photos/400/300?random=1',
    rating: 4.8,
    reviews: 156,
    inStock: true,
    tags: ['laptop', 'professional', 'high-performance']
  },
  {
    id: 2,
    name: 'Smartphone X',
    description: 'Latest smartphone with advanced features',
    price: 899.99,
    category: 'electronics',
    image: 'https://picsum.photos/400/300?random=2',
    rating: 4.6,
    reviews: 89,
    inStock: true,
    tags: ['smartphone', 'mobile', 'advanced']
  },
  {
    id: 3,
    name: 'Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt for everyday wear',
    price: 29.99,
    category: 'clothing',
    image: 'https://picsum.photos/400/300?random=3',
    rating: 4.2,
    reviews: 234,
    inStock: true,
    tags: ['t-shirt', 'cotton', 'comfortable']
  },
  {
    id: 4,
    name: 'Denim Jeans',
    description: 'Classic denim jeans with perfect fit',
    price: 79.99,
    category: 'clothing',
    image: 'https://picsum.photos/400/300?random=4',
    rating: 4.4,
    reviews: 167,
    inStock: false,
    tags: ['jeans', 'denim', 'classic']
  }
];

// Product component with parameter validation
const ProductPage = async ({ params }: { params: { id: string; category?: string; slug?: string } }) => {
  // Process and validate parameters
  const result = await processParams(params, paramSchemas.product);

  if (!result.isValid) {
    notFound();
  }

  const { id, category } = result.data;

  // Find product
  const product = mockProducts.find(p => p.id === id);

  if (!product) {
    notFound();
  }

  // Generate metadata
  const metadata: Metadata = {
    title: `${product.name} - E-commerce Store`,
    description: product.description,
    keywords: product.tags.join(', '),
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
      type: 'product'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/" className="text-gray-700 hover:text-blue-600">
                Home
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <a href="/products" className="text-gray-700 hover:text-blue-600">
                  Products
                </a>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <a href={`/products?category=${product.category}`} className="text-gray-700 hover:text-blue-600 capitalize">
                  {product.category}
                </a>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="space-y-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg"
              />
              <div className="flex space-x-2">
                {product.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-yellow-400 text-xl">★</span>
                    <span className="ml-1 text-gray-600">{product.rating}</span>
                    <span className="ml-1 text-gray-500">({product.reviews} reviews)</span>
                  </div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                    {product.category}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-blue-600">${product.price}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    product.inStock
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  disabled={!product.inStock}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    product.inStock
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>

                <button className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Add to Wishlist
                </button>
              </div>

              {/* Parameter Debug Info (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Parameter Debug Info:</h3>
                  <pre className="text-sm text-gray-600">
                    {JSON.stringify({
                      original: params,
                      processed: result.data,
                      validation: result.isValid
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockProducts
              .filter(p => p.id !== product.id && p.category === product.category)
              .slice(0, 4)
              .map(relatedProduct => (
                <div key={relatedProduct.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{relatedProduct.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{relatedProduct.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">${relatedProduct.price}</span>
                      <span className="text-yellow-400">★ {relatedProduct.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Generate static parameters
export async function generateStaticParams() {
  return await staticParamsUtils.generateProductParams();
}

// Generate metadata
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const result = await processParams(params, paramSchemas.product);

  if (!result.isValid) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    };
  }

  const { id } = result.data;
  const product = mockProducts.find(p => p.id === id);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    };
  }

  return {
    title: `${product.name} - E-commerce Store`,
    description: product.description,
    keywords: product.tags.join(', '),
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
      type: 'product'
    }
  };
}

// Export with parameter validation
export default withParams(ProductPage, paramSchemas.product);