'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Cart item interface
interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

// Mock cart data - in a real app, this would come from a state management solution
const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: "Premium Headphones",
    price: 299.99,
    image: "/next.svg",
    quantity: 1
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 199.99,
    image: "/vercel.svg",
    quantity: 2
  }
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart items from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else {
      // Use initial cart items for demo
      setCartItems(initialCartItems);
      localStorage.setItem('cart', JSON.stringify(initialCartItems));
    }
    setIsLoading(false);
  }, []);

  // Update localStorage whenever cart changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isLoading]);

  // Update item quantity
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Remove item from cart
  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 100 ? 0 : 9.99; // Free shipping over $100
  const total = subtotal + tax + shipping;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Shopping Cart</h1>
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Cart</span>
          </nav>
        </div>

        {cartItems.length === 0 ? (
          // Empty cart state
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-gray-400">🛒</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Looks like you haven&apos;t added any items to your cart yet.</p>
              <Link
                href="/products"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Cart Items ({cartItems.length})</h2>
                    <button
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>

                <div className="divide-y">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6 flex items-center space-x-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="dark:invert"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-blue-600 font-bold">${item.price.toFixed(2)}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 text-sm mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue Shopping */}
              <div className="mt-6">
                <Link
                  href="/products"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping === 0 && (
                    <p className="text-green-600 text-sm">🎉 Free shipping on orders over $100!</p>
                  )}
                  <hr />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-6">
                  Proceed to Checkout
                </button>

                {/* Security badges */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Secure Checkout</p>
                  <div className="flex justify-center space-x-2 text-xs text-gray-500">
                    <span>🔒 SSL</span>
                    <span>💳 Secure</span>
                    <span>✅ Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next.js Features Explanation */}
        <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">🚀 Next.js Features Demonstrated</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Client-Side State Management</h3>
              <p className="text-gray-600 text-sm">
                Uses React hooks (useState, useEffect) for managing cart state on the client side.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Local Storage Integration</h3>
              <p className="text-gray-600 text-sm">
                Persists cart data in browser localStorage for a seamless user experience.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Responsive Design</h3>
              <p className="text-gray-600 text-sm">
                Mobile-first responsive layout that adapts to different screen sizes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Interactive UI Components</h3>
              <p className="text-gray-600 text-sm">
                Dynamic quantity controls, item removal, and real-time total calculations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
Route Group: (shop)
This cart page is now organized under the (shop) route group,
which groups shopping-related pages together without
affecting the URL structure. The URL remains /cart.

Next.js Shopping Cart Features Demonstrated:

1. **Client-Side Rendering**: Uses 'use client' directive for interactive features
2. **State Management**: React hooks for cart state management
3. **Local Storage**: Persistent cart data across browser sessions
4. **Real-time Updates**: Dynamic quantity changes and total calculations
5. **Responsive Design**: Mobile-first responsive layout
6. **Loading States**: Loading indicator while cart data loads
7. **Empty State**: User-friendly empty cart experience
8. **Image Optimization**: Next.js Image component for product images
9. **Navigation**: Breadcrumb navigation and continue shopping links
10. **TypeScript Integration**: Full type safety for cart items and functions

This cart page integrates with:
- Products listing and detail pages
- Local storage for persistence
- Next.js routing system
- Responsive design principles
*/