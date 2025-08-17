import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home - Next.js E-Commerce Store",
  description: "Welcome to our Next.js E-Commerce Store showcasing modern web development features including Server Components, Static Generation, and more.",
};

// Mock product data to showcase Next.js features
const featuredProducts = [
  {
    id: 1,
    name: "Premium Headphones",
    price: 299.99,
    image: "/next.svg", // Using existing SVG as placeholder
    description: "High-quality wireless headphones with noise cancellation"
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 199.99,
    image: "/vercel.svg",
    description: "Feature-rich smartwatch with health tracking"
  },
  {
    id: 3,
    name: "Laptop Stand",
    price: 79.99,
    image: "/globe.svg",
    description: "Ergonomic aluminum laptop stand for better posture"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Next.js E-Commerce Store</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            A comprehensive showcase of Next.js features including App Router, 
            Server Components, Static Generation, and more!
          </p>
          <Link 
            href="/products" 
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Next.js Features Demonstrated</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">🚀 App Router</h3>
              <p className="text-gray-600">
                Modern file-based routing with layouts, loading states, and error boundaries.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">⚡ Server Components</h3>
              <p className="text-gray-600">
                React Server Components for better performance and SEO.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">🎨 Static Generation</h3>
              <p className="text-gray-600">
                Pre-rendered pages for lightning-fast loading times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div key={product.id} className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={100}
                    height={100}
                    className="dark:invert"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">${product.price}</span>
                    <Link 
                      href={`/products/${product.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation Links */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Explore the App</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link href="/products" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-2">Products</h3>
              <p className="text-sm text-gray-600">Browse all products with filtering</p>
            </Link>
            <Link href="/cart" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-2">Shopping Cart</h3>
              <p className="text-sm text-gray-600">Client-side state management</p>
            </Link>
            <Link href="/dashboard" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-2">Dashboard</h3>
              <p className="text-sm text-gray-600">Protected routes & middleware</p>
            </Link>
            <Link href="/api-demo" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h3 className="font-semibold mb-2">API Routes</h3>
              <p className="text-sm text-gray-600">Server-side API endpoints</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
