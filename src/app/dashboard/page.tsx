import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Your Dashboard</h2>
        <p className="text-gray-600 mb-4">
          Monitor your e-commerce store performance with real-time analytics, order management, and user insights.
        </p>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/dashboard/products" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            📦 Manage Products
          </Link>
          <Link 
            href="/dashboard/orders" 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            🛒 View All Orders
          </Link>
          <Link 
            href="/dashboard/users" 
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
          >
            👥 Manage Users
          </Link>
          <Link 
            href="/dashboard/settings" 
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">API Services: Online</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Database: Connected</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Cache: Warming up</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-blue-600">🔄</span>
            <span className="text-gray-600">Dashboard loaded with parallel routes</span>
            <span className="text-gray-400">Just now</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-green-600">✅</span>
            <span className="text-gray-600">Analytics data refreshed</span>
            <span className="text-gray-400">2 minutes ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-purple-600">👤</span>
            <span className="text-gray-600">New user registered</span>
            <span className="text-gray-400">5 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}