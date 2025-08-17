import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";
import GlobalErrorBoundary from "../components/GlobalErrorBoundary";
import GlobalErrorMonitor from "../components/GlobalErrorMonitor";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next.js E-Commerce Store",
  description: "A comprehensive showcase of Next.js features through an e-commerce application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalErrorBoundary
          enableGlobalErrorHandling={true}
          showErrorDetails={process.env.NODE_ENV === 'development'}
          onGlobalError={(event) => {
            console.log('Global error detected:', event);
          }}
        >
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
          <GlobalErrorMonitor />
        </GlobalErrorBoundary>
        <footer className="bg-gray-800 text-white py-12 mt-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Brand Section */}
              <div className="md:col-span-2">
                <h3 className="text-xl font-bold text-blue-400 mb-4">NextJS Store</h3>
                <p className="text-gray-300 mb-4">
                  A comprehensive showcase of Next.js features including App Router,
                  Server Components, Static Generation, and modern e-commerce functionality.
                </p>
                <div className="flex space-x-4">
                  <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer"
                     className="text-gray-400 hover:text-white transition-colors">
                    Next.js Docs
                  </a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                     className="text-gray-400 hover:text-white transition-colors">
                    GitHub
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                  <li><Link href="/products" className="text-gray-400 hover:text-white transition-colors">Products</Link></li>
                  <li><a href="/cart" className="text-gray-400 hover:text-white transition-colors">Shopping Cart</a></li>
                  <li><a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a></li>
                </ul>
              </div>

              {/* Features */}
              <div>
                <h4 className="font-semibold mb-4">Features</h4>
                <ul className="space-y-2">
                  <li><a href="/api-demo" className="text-gray-400 hover:text-white transition-colors">API Routes</a></li>
                  <li><a href="/login" className="text-gray-400 hover:text-white transition-colors">Authentication</a></li>
                  <li><Link href="/server-components" className="text-gray-400 hover:text-white transition-colors">Server Components</Link></li>
                  <li><Link href="/static-generation" className="text-gray-400 hover:text-white transition-colors">Static Generation</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-700 mt-8 pt-8 text-center">
              <p className="text-gray-400">
                &copy; 2024 Next.js E-Commerce Store. Built to showcase Next.js features.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
