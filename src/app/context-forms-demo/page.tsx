'use client';

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useAuth,
  useCart,
  useUI,
  useNotifications,
  usePreferences,
  User,
  CartItem
} from '../../contexts/AppContext';
import {
  loginSchema,
  registerSchema,
  productSchema,
  contactSchema,
  LoginForm,
  RegisterForm,
  ProductForm,
  ContactForm
} from '../../lib/formValidation';
import {
  TextInput,
  EmailInput,
  PasswordInput,
  NumberInput,
  Select,
  Checkbox,
  RadioGroup,
  Rating,
  FileInput,
  SubmitButton
} from '../../components/forms/FormComponents';

// Mock product data for cart demo
const mockProducts: Omit<CartItem, 'quantity'>[] = [
  {
    id: '1',
    name: 'Laptop Pro',
    price: 1299.99,
    image: 'https://picsum.photos/400/300?random=1',
    category: 'electronics'
  },
  {
    id: '2',
    name: 'Smartphone X',
    price: 899.99,
    image: 'https://picsum.photos/400/300?random=2',
    category: 'electronics'
  },
  {
    id: '3',
    name: 'Cotton T-Shirt',
    price: 29.99,
    image: 'https://picsum.photos/400/300?random=3',
    category: 'clothing'
  }
];

export default function ContextFormsDemo() {
  const [activeTab, setActiveTab] = useState('context');
  const { user, isAuthenticated, login, logout } = useAuth();
  const { cart, cartTotal, cartItemCount, addToCart, removeFromCart, updateCartItem, clearCart } = useCart();
  const { theme, setTheme, language, setLanguage, sidebarOpen, toggleSidebar } = useUI();
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { preferences, updatePreferences } = usePreferences();

  // Form methods
  const loginMethods = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const registerMethods = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  });

  const productMethods = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      stock: 0,
      tags: []
    }
  });

  const contactMethods = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' }
  });

  // Form handlers
  const handleLogin = (data: LoginForm) => {
    const mockUser: User = {
      id: '1',
      name: 'Demo User',
      email: data.email,
      role: 'user'
    };
    login(mockUser);
    addNotification({
      type: 'success',
      title: 'Login Successful',
      message: `Welcome back, ${mockUser.name}!`,
      duration: 3000
    });
  };

  const handleRegister = (data: RegisterForm) => {
    const mockUser: User = {
      id: '2',
      name: data.name,
      email: data.email,
      role: 'user'
    };
    login(mockUser);
    addNotification({
      type: 'success',
      title: 'Registration Successful',
      message: `Account created for ${mockUser.name}!`,
      duration: 3000
    });
  };

  const handleProductSubmit = (data: ProductForm) => {
    addNotification({
      type: 'success',
      title: 'Product Created',
      message: `Product "${data.name}" has been created successfully!`,
      duration: 3000
    });
  };

  const handleContactSubmit = (data: ContactForm) => {
    addNotification({
      type: 'success',
      title: 'Message Sent',
      message: 'Your message has been sent successfully!',
      duration: 3000
    });
  };

  const handleAddToCart = (product: Omit<CartItem, 'quantity'>) => {
    addToCart(product);
  };

  const handleRemoveFromCart = (productId: string) => {
    removeFromCart(productId);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    updateCartItem(productId, quantity);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleLogout = () => {
    logout();
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLanguageChange = (newLanguage: 'en' | 'es' | 'fr') => {
    setLanguage(newLanguage);
  };

  const handleToggleSidebar = () => {
    toggleSidebar();
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const handleTestNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    addNotification({
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
      message: `This is a ${type} notification test.`,
      duration: 5000
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Context & Forms Demo
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive demonstration of React Context and React Hook Form with Zod validation
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'context', label: 'Context State' },
              { id: 'forms', label: 'Form Validation' },
              { id: 'cart', label: 'Shopping Cart' },
              { id: 'notifications', label: 'Notifications' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Context State Tab */}
        {activeTab === 'context' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Authentication */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Authentication</h2>
              <div className="space-y-4">
                {isAuthenticated ? (
                  <div>
                    <p className="text-gray-600">Welcome, {user?.name}!</p>
                    <p className="text-sm text-gray-500">Email: {user?.email}</p>
                    <p className="text-sm text-gray-500">Role: {user?.role}</p>
                    <button
                      onClick={handleLogout}
                      className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600">Not authenticated</p>
                    <button
                      onClick={() => {
                        const mockUser: User = {
                          id: '1',
                          name: 'Demo User',
                          email: 'demo@example.com',
                          role: 'user'
                        };
                        login(mockUser);
                      }}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Login Demo User
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* UI State */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">UI State</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme: {theme}
                  </label>
                  <button
                    onClick={handleThemeToggle}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Toggle Theme
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language: {language}
                  </label>
                  <div className="space-x-2">
                    {(['en', 'es', 'fr'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`px-3 py-1 rounded ${
                          language === lang
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sidebar: {sidebarOpen ? 'Open' : 'Closed'}
                  </label>
                  <button
                    onClick={handleToggleSidebar}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Toggle Sidebar
                  </button>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Preferences</h2>
              <div className="space-y-4">
                {Object.entries(preferences).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <button
                      onClick={() => handlePreferenceChange(key as keyof typeof preferences, !value)}
                      className={`px-3 py-1 rounded text-sm ${
                        value
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {value ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Cart Summary</h2>
              <div className="space-y-4">
                <p className="text-gray-600">Items: {cartItemCount}</p>
                <p className="text-gray-600">Total: ${cartTotal.toFixed(2)}</p>
                <button
                  onClick={handleClearCart}
                  disabled={cartItemCount === 0}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Forms Tab */}
        {activeTab === 'forms' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Login Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Login Form</h2>
              <FormProvider {...loginMethods}>
                <form onSubmit={loginMethods.handleSubmit(handleLogin)} className="space-y-4">
                  <EmailInput
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    required
                  />
                  <PasswordInput
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    required
                  />
                  <SubmitButton>Login</SubmitButton>
                </form>
              </FormProvider>
            </div>

            {/* Register Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Register Form</h2>
              <FormProvider {...registerMethods}>
                <form onSubmit={registerMethods.handleSubmit(handleRegister)} className="space-y-4">
                  <TextInput
                    name="name"
                    label="Name"
                    placeholder="Enter your name"
                    required
                  />
                  <EmailInput
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    required
                  />
                  <PasswordInput
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    required
                  />
                  <PasswordInput
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    required
                  />
                  <SubmitButton>Register</SubmitButton>
                </form>
              </FormProvider>
            </div>

            {/* Product Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Product Form</h2>
              <FormProvider {...productMethods}>
                <form onSubmit={productMethods.handleSubmit(handleProductSubmit)} className="space-y-4">
                  <TextInput
                    name="name"
                    label="Product Name"
                    placeholder="Enter product name"
                    required
                  />
                  <TextInput
                    name="description"
                    label="Description"
                    placeholder="Enter product description"
                    multiline
                    rows={3}
                    required
                  />
                  <NumberInput
                    name="price"
                    label="Price"
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    required
                  />
                  <Select
                    name="category"
                    label="Category"
                    options={[
                      { value: 'electronics', label: 'Electronics' },
                      { value: 'clothing', label: 'Clothing' },
                      { value: 'books', label: 'Books' }
                    ]}
                    required
                  />
                  <NumberInput
                    name="stock"
                    label="Stock"
                    placeholder="0"
                    min={0}
                    required
                  />
                  <SubmitButton>Create Product</SubmitButton>
                </form>
              </FormProvider>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Form</h2>
              <FormProvider {...contactMethods}>
                <form onSubmit={contactMethods.handleSubmit(handleContactSubmit)} className="space-y-4">
                  <TextInput
                    name="name"
                    label="Name"
                    placeholder="Enter your name"
                    required
                  />
                  <EmailInput
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    required
                  />
                  <TextInput
                    name="subject"
                    label="Subject"
                    placeholder="Enter subject"
                    required
                  />
                  <TextInput
                    name="message"
                    label="Message"
                    placeholder="Enter your message"
                    multiline
                    rows={4}
                    required
                  />
                  <SubmitButton>Send Message</SubmitButton>
                </form>
              </FormProvider>
            </div>
          </div>
        )}

        {/* Cart Tab */}
        {activeTab === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Available Products */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Available Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow p-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded mb-4"
                    />
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{product.category}</p>
                    <p className="text-blue-600 font-bold">${product.price}</p>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Items */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Cart Items</h2>
              <div className="bg-white rounded-lg shadow p-4">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="border-b pb-4">
                        <div className="flex items-center space-x-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-gray-600 text-sm">${item.price}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"
                              >
                                +
                              </button>
                              <button
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="ml-2 text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={handleClearCart}
                        className="w-full mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        Clear Cart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Notification Testing</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleTestNotification('success')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Success
              </button>
              <button
                onClick={() => handleTestNotification('error')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Error
              </button>
              <button
                onClick={() => handleTestNotification('warning')}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Warning
              </button>
              <button
                onClick={() => handleTestNotification('info')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Info
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Active Notifications</h3>
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No active notifications</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
