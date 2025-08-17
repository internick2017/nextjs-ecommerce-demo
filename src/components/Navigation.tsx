'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, useCart, useUI } from '../contexts/AppContext';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItemCount } = useCart();
  const { theme, setTheme } = useUI();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/cart', label: 'Cart' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/api-demo', label: 'API Demo' },
    { href: '/crud-demo', label: 'CRUD Demo' },
    { href: '/headers-cookies-demo', label: 'Headers & Cookies Demo' },
    { href: '/redirects-cache-demo', label: 'Redirects & Cache Demo' },
    { href: '/middleware-demo', label: 'Middleware Demo' },
    { href: '/suspense-rendering-demo', label: 'Suspense & Rendering Demo' },
    { href: '/ssr-streaming-demo', label: 'SSR & Streaming Demo' },
    { href: '/params-demo', label: 'Params Demo' },
    { href: '/context-forms-demo', label: 'Context & Forms Demo' },
    { href: '/data-fetching-demo', label: 'Data Fetching Demo' },
    { href: '/error-handling-demo', label: 'Error Demo' },
    { href: '/global-error-demo', label: 'Global Error Demo' },
    { href: '/login', label: 'Login' },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              NextJS Store
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
                    isActiveLink(link.href)
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-md"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <Link href="/cart" className="text-gray-600 hover:text-blue-600 transition-colors relative">
              🛒 Cart
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-sm">
                  Hello, {user?.name}
                </span>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md transition-colors ${
                    isActiveLink(link.href)
                      ? 'text-blue-600 bg-blue-50 font-medium'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}