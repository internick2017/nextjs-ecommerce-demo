import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// Mock products data - same as products page
const products = [
  {
    id: 1,
    name: "Premium Headphones",
    price: 299.99,
    image: "/next.svg",
    description: "High-quality wireless headphones with noise cancellation",
    category: "Electronics",
    inStock: true,
    features: [
      "Active Noise Cancellation",
      "30-hour battery life",
      "Bluetooth 5.0",
      "Premium leather padding"
    ],
    specifications: {
      "Driver Size": "40mm",
      "Frequency Response": "20Hz - 20kHz",
      "Impedance": "32 ohms",
      "Weight": "250g"
    }
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 199.99,
    image: "/vercel.svg",
    description: "Feature-rich smartwatch with health tracking",
    category: "Electronics",
    inStock: true,
    features: [
      "Heart rate monitoring",
      "GPS tracking",
      "Water resistant",
      "7-day battery life"
    ],
    specifications: {
      "Display": "1.4\" AMOLED",
      "Battery": "300mAh",
      "Water Rating": "5ATM",
      "Connectivity": "Bluetooth 5.0, WiFi"
    }
  },
  {
    id: 3,
    name: "Laptop Stand",
    price: 79.99,
    image: "/globe.svg",
    description: "Ergonomic aluminum laptop stand for better posture",
    category: "Accessories",
    inStock: true,
    features: [
      "Adjustable height",
      "Aluminum construction",
      "Heat dissipation",
      "Portable design"
    ],
    specifications: {
      "Material": "Aluminum alloy",
      "Weight": "1.2kg",
      "Compatibility": "11-17 inch laptops",
      "Adjustability": "6 height levels"
    }
  }
];

// This function generates static params for all product IDs
// This enables static generation for dynamic routes
export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id.toString(),
  }));
}

// Generate metadata for each product page
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = await params;
  const product = products.find(p => p.id === parseInt(id));

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.name} - Next.js E-Commerce Store`,
    description: product.description,
  };
}

// Product detail page component
export default async function ProductPage({ params }: Readonly<{ params: { id: string } }>) {
  const { id } = await params;
  const productId = parseInt(id);
  const product = products.find(p => p.id === productId);

  // If product not found, show 404
  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-blue-600">Products</Link>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-white rounded-lg p-8 shadow-md">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <Image
                src={product.image}
                alt={product.name}
                width={300}
                height={300}
                className="dark:invert"
                priority
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                {product.category}
              </span>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <p className="text-gray-600 text-lg">{product.description}</p>
            </div>

            <div className="border-t border-b py-6">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-blue-600">${product.price}</span>
                <div className="flex items-center space-x-2">
                  {product.inStock ? (
                    <span className="text-green-600 font-medium">✓ In Stock</span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Out of Stock</span>
                  )}
                </div>
              </div>
            </div>

            {/* Add to Cart Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label htmlFor="quantity" className="font-medium">Quantity:</label>
                <select
                  id="quantity"
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!product.inStock}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors ${
                    product.inStock
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!product.inStock}
                >
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  ♡ Wishlist
                </button>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Key Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-center space-x-2">
                    <span className="text-green-600">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-16 bg-white rounded-lg p-8 shadow-md">
          <h2 className="text-2xl font-bold mb-6">Specifications</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">{key}:</span>
                <span className="text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next.js Features Explanation */}
        <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">🚀 Next.js Features Demonstrated</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Dynamic Routing</h3>
              <p className="text-gray-600 text-sm">
                This page uses dynamic routing with [id] to create individual product pages.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">generateStaticParams</h3>
              <p className="text-gray-600 text-sm">
                Static generation for dynamic routes using generateStaticParams function.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Dynamic Metadata</h3>
              <p className="text-gray-600 text-sm">
                Each product page has unique metadata generated dynamically for better SEO.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">notFound() Function</h3>
              <p className="text-gray-600 text-sm">
                Automatic 404 handling for non-existent products using Next.js notFound().
              </p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {products
              .filter(p => p.id !== product.id && p.category === product.category)
              .slice(0, 3)
              .map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-32 bg-gray-100 flex items-center justify-center">
                    <Image
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      width={60}
                      height={60}
                      className="dark:invert"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{relatedProduct.name}</h3>
                    <p className="text-blue-600 font-bold">${relatedProduct.price}</p>
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/*
Route Group: (shop)
This page is now organized under the (shop) route group,
which groups shopping-related pages together without
affecting the URL structure. The URL remains /products/[id].

Next.js Dynamic Routing Features Demonstrated:

1. **Dynamic Routes**: Uses [id] parameter for individual product pages
2. **generateStaticParams**: Pre-generates static pages for all products
3. **Dynamic Metadata**: SEO-optimized metadata for each product
4. **notFound() Function**: Automatic 404 handling for invalid products
5. **Static Generation**: Pre-built pages for better performance
6. **Image Optimization**: Next.js Image component with priority loading
7. **Breadcrumb Navigation**: User-friendly navigation structure
8. **Related Products**: Cross-selling with filtered product suggestions
9. **Responsive Design**: Mobile-first responsive layout
10. **TypeScript Integration**: Full type safety for params and props

This product detail page integrates with:
- Products listing page
- Shopping cart functionality
- Next.js routing system
- SEO optimization features
*/