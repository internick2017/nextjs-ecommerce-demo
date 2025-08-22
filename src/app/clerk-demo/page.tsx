'use client';

import { useState } from 'react';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function ClerkDemoPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testProtectedAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/protected');
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      setApiResponse({ error: 'Failed to fetch API response' });
    } finally {
      setLoading(false);
    }
  };

  const testProtectedAPIPost = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/protected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Hello from Clerk Demo!',
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      setApiResponse({ error: 'Failed to fetch API response' });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Clerk Authentication Demo
          </h1>
          <p className="text-xl text-gray-600">
            Explore the power of Clerk's authentication system with Next.js
          </p>
        </div>

        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Authentication Status
          </h2>

          {isSignedIn ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {user?.imageUrl && (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'User'}
                    className="w-16 h-16 rounded-full border-2 border-gray-200"
                  />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
                  </h3>
                  <p className="text-gray-600">
                    You are successfully authenticated with Clerk
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Full Name:</label>
                  <p className="text-gray-900">{user?.fullName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Email:</label>
                  <p className="text-gray-900">{user?.emailAddresses[0]?.emailAddress}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">User ID:</label>
                  <p className="text-gray-900 font-mono text-xs">{user?.id}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Member Since:</label>
                  <p className="text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: 'w-10 h-10',
                    },
                  }}
                />
                <Link
                  href="/user-profile"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Manage Profile
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                You are not currently signed in. Sign in to access protected features.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <SignInButton mode="modal">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </div>
          )}
        </div>

        {/* API Testing */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Protected API Testing
          </h2>

          <div className="space-y-4">
            <p className="text-gray-600">
              Test the protected API endpoints that require authentication.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={testProtectedAPI}
                disabled={!isSignedIn || loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? 'Testing...' : 'Test GET /api/protected'}
              </button>

              <button
                onClick={testProtectedAPIPost}
                disabled={!isSignedIn || loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {loading ? 'Testing...' : 'Test POST /api/protected'}
              </button>
            </div>

            {apiResponse && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">API Response:</h3>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Features Showcase */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Clerk Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🔐 Authentication</h3>
              <p className="text-gray-600 text-sm">
                Secure user authentication with email/password, social logins, and multi-factor authentication.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">👤 User Management</h3>
              <p className="text-gray-600 text-sm">
                Complete user profile management with customizable fields and avatar support.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🛡️ Security</h3>
              <p className="text-gray-600 text-sm">
                Built-in security features including session management, rate limiting, and fraud detection.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🎨 Customizable UI</h3>
              <p className="text-gray-600 text-sm">
                Fully customizable components that match your brand and design system.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">⚡ Performance</h3>
              <p className="text-gray-600 text-sm">
                Optimized for performance with edge caching and minimal bundle size.
              </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🔧 Easy Integration</h3>
              <p className="text-gray-600 text-sm">
                Simple integration with Next.js, React, and other popular frameworks.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Explore More
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/sign-in"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Sign In Page</h3>
              <p className="text-gray-600 text-sm">
                Full-page sign in experience with custom styling
              </p>
            </Link>

            <Link
              href="/sign-up"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Sign Up Page</h3>
              <p className="text-gray-600 text-sm">
                User registration with email verification
              </p>
            </Link>

            <Link
              href="/user-profile"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">User Profile</h3>
              <p className="text-gray-600 text-sm">
                Complete profile management interface
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-gray-600 text-sm">
                Protected dashboard with user information
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
