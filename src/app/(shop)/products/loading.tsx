export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-80 mb-6 animate-pulse"></div>

          {/* Filter Buttons Skeleton */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="h-10 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map(() => (
            <div key={`product-skeleton-${crypto.randomUUID()}`} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Product Image Skeleton */}
              <div className="h-48 bg-gray-200 animate-pulse"></div>

              {/* Product Info Skeleton */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>

                <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>

                <div className="flex justify-between items-center">
                  <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>

                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section Skeleton */}
        <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map(() => (
              <div key={`feature-skeleton-${crypto.randomUUID()}`}>
                <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="text-sm font-medium">Loading products...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
Route Group: (shop)
This loading component is now organized under the (shop) route group,
which groups shopping-related pages together without affecting
the URL structure. The URL remains /products.

Next.js Loading UI Features Demonstrated:

1. **Automatic Loading States**: This loading.tsx file automatically shows when navigating to /products
2. **Skeleton UI**: Provides visual feedback that matches the actual content structure
3. **Smooth Transitions**: Creates a seamless user experience during page loads
4. **File-based Convention**: Uses Next.js file naming convention for automatic loading states
5. **Responsive Design**: Loading skeleton adapts to different screen sizes
6. **Animation**: Uses Tailwind CSS animations for smooth loading effects
7. **Layout Preservation**: Maintains the same layout structure as the actual page
8. **User Feedback**: Clear indication that content is loading

This loading component will be automatically shown by Next.js when:
- Navigating to /products route
- The page is being server-rendered
- Any async operations are happening in the page component

The loading state helps improve perceived performance and provides
a better user experience during navigation and data fetching.
*/