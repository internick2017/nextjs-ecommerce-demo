import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Page Not Found - Next.js E-Commerce Store",
  description: "The page you're looking for doesn't exist. Browse our products or return to the homepage to continue shopping.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-blue-600 mb-4">404</div>
          <div className="w-32 h-1 bg-blue-600 mx-auto mb-8"></div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          The page might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Go Back Home
          </Link>

          <Link
            href="/products"
            className="inline-block w-full bg-white text-blue-600 px-6 py-3 rounded-lg font-medium border-2 border-blue-600 hover:bg-blue-50 transition-colors duration-200"
          >
            Browse Products
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Products
            </Link>
            <Link
              href="/cart"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Shopping Cart
            </Link>
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Dashboard
            </Link>
            <Link
              href="/api-demo"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              API Demo
            </Link>
          </div>
        </div>

        {/* Search Suggestion */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow-sm border">
          <h4 className="font-medium text-gray-900 mb-2">Looking for something specific?</h4>
          <p className="text-sm text-gray-600 mb-3">
            Try searching our products or check out our main sections.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Error Code Info */}
        <div className="mt-8 text-xs text-gray-500">
          <p>Error Code: 404 - Page Not Found</p>
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>
    </div>
  );
}

/*
Next.js Custom 404 Page Features Demonstrated:

1. **Custom Error Pages**: Uses not-found.tsx for custom 404 error handling
2. **File-based Routing**: Automatically handles 404 errors across the application
3. **User-Friendly Design**: Provides helpful navigation and search options
4. **SEO Friendly**: Custom 404 pages are better for SEO than default error pages
5. **Navigation Recovery**: Multiple ways for users to get back to working pages
6. **Responsive Design**: Works well on all device sizes
7. **Brand Consistency**: Maintains the same design language as the rest of the app
8. **Helpful Actions**: Provides search functionality and popular page links
9. **Error Information**: Shows error code and support information
10. **Accessibility**: Proper heading structure and keyboard navigation

This custom 404 page will be shown when:
- Users navigate to a non-existent route
- A page component calls notFound() function
- Dynamic routes don't match any existing content
- API routes return 404 status

The custom error page improves user experience by providing
helpful navigation options instead of a generic browser error.
*/