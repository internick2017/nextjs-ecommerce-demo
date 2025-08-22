import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4 mb-4">
          {user.imageUrl && (
            <img
              src={user.imageUrl}
              alt={user.fullName || 'User'}
              className="w-16 h-16 rounded-full border-2 border-gray-200"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}!
            </h2>
            <p className="text-gray-600">
              Monitor your e-commerce store performance with real-time analytics, order management, and user insights.
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Member since: {new Date(user.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>Email: {user.emailAddresses[0]?.emailAddress}</span>
            </div>
          </div>
        </div>

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

      {/* User Profile Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <p className="text-gray-900">{user.fullName || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{user.emailAddresses[0]?.emailAddress}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Status</label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Sign In</label>
            <p className="text-gray-900">
              {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : 'Never'}
            </p>
          </div>
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
            <span className="text-gray-600">Dashboard loaded with Clerk authentication</span>
            <span className="text-gray-400">Just now</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-green-600">✅</span>
            <span className="text-gray-600">User profile loaded successfully</span>
            <span className="text-gray-400">2 minutes ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-purple-600">🔐</span>
            <span className="text-gray-600">Authentication session verified</span>
            <span className="text-gray-400">5 minutes ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}