'use client';

import React, { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  createOrderAction,
  createContactAction,
  getUsersAction,
  getProductsAction,
  getOrdersAction,
  getContactsAction,
  getAllDataAction,
  getFieldError,
  hasFieldError,
  FormState
} from '../../lib/serverActions';

// Loading button component using useFormStatus
function SubmitButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
    >
      {pending ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// User form component
function UserForm({ user, mode = 'create' }: { user?: any; mode?: 'create' | 'edit' }) {
  const initialState: FormState = {};
  const [state, formAction] = useFormState(
    mode === 'create' ? createUserAction : updateUserAction,
    initialState
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {mode === 'create' ? 'Create User' : 'Edit User'}
      </h3>

      {/* Success/Error Message */}
      {state.message && (
        <div className={`mb-4 p-3 rounded ${
          state.success
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {mode === 'edit' && (
          <input type="hidden" name="id" value={user?.id} />
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={user?.name}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'name') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError(state.errors, 'name') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'name')}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={user?.email}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'email') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError(state.errors, 'email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'email')}</p>
          )}
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
            Age *
          </label>
          <input
            type="number"
            id="age"
            name="age"
            defaultValue={user?.age}
            min="18"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'age') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError(state.errors, 'age') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'age')}</p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            id="role"
            name="role"
            defaultValue={user?.role || 'user'}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'role') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
          {getFieldError(state.errors, 'role') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'role')}</p>
          )}
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={user?.bio}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="newsletter"
            name="newsletter"
            defaultChecked={user?.newsletter}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-900">
            Subscribe to newsletter
          </label>
        </div>

        <SubmitButton className="w-full">
          {mode === 'create' ? 'Create User' : 'Update User'}
        </SubmitButton>
      </form>
    </div>
  );
}

// Product form component
function ProductForm({ product, mode = 'create' }: { product?: any; mode?: 'create' | 'edit' }) {
  const initialState: FormState = {};
  const [state, formAction] = useFormState(
    mode === 'create' ? createProductAction : updateProductAction,
    initialState
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {mode === 'create' ? 'Create Product' : 'Edit Product'}
      </h3>

      {state.message && (
        <div className={`mb-4 p-3 rounded ${
          state.success
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {mode === 'edit' && (
          <input type="hidden" name="id" value={product?.id} />
        )}

        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            id="productName"
            name="name"
            defaultValue={product?.name}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'name') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError(state.errors, 'name') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'name')}</p>
          )}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            defaultValue={product?.price}
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'price') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError(state.errors, 'price') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'price')}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            id="category"
            name="category"
            defaultValue={product?.category || 'Electronics'}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'category') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Books">Books</option>
            <option value="Home">Home & Garden</option>
          </select>
          {getFieldError(state.errors, 'category') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'category')}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={product?.description}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'description') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError(state.errors, 'description') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'description')}</p>
          )}
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            defaultValue={product?.tags?.join(', ')}
            placeholder="tech, computer, laptop"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="inStock"
            name="inStock"
            defaultChecked={product?.inStock !== false}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="inStock" className="ml-2 block text-sm text-gray-900">
            In Stock
          </label>
        </div>

        <SubmitButton className="w-full">
          {mode === 'create' ? 'Create Product' : 'Update Product'}
        </SubmitButton>
      </form>
    </div>
  );
}

// Contact form component
function ContactForm() {
  const initialState: FormState = {};
  const [state, formAction] = useFormState(createContactAction, initialState);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h3>

      {state.message && (
        <div className={`mb-4 p-3 rounded ${
          state.success
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="contactName"
            name="name"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'name') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError(state.errors, 'name') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'name')}</p>
          )}
        </div>

        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="contactEmail"
            name="email"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'email') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError(state.errors, 'email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'email')}</p>
          )}
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'subject') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError(state.errors, 'subject') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'subject')}</p>
          )}
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="medium"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasFieldError(state.errors, 'message') ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {getFieldError(state.errors, 'message') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'message')}</p>
          )}
        </div>

        <SubmitButton className="w-full">
          Send Message
        </SubmitButton>
      </form>
    </div>
  );
}

// Data display component
function DataDisplay({ title, data, onDelete }: { title: string; data: any[]; onDelete?: (id: number) => void }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.name || item.customerName}</h4>
                <p className="text-sm text-gray-600">
                  {item.email || item.customerEmail || item.description}
                </p>
                {item.price && <p className="text-sm text-gray-600">${item.price}</p>}
                {item.total && <p className="text-sm text-gray-600">Total: ${item.total}</p>}
                {item.status && <p className="text-sm text-gray-600">Status: {item.status}</p>}
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(item.id)}
                  className="ml-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main demo component
export default function ServerActionsDemo() {
  const [activeTab, setActiveTab] = useState<'users' | 'products' | 'contact' | 'data'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, productsData, ordersData, contactsData] = await Promise.all([
        getUsersAction(),
        getProductsAction(),
        getOrdersAction(),
        getContactsAction(),
      ]);

      setUsers(usersData);
      setProducts(productsData);
      setOrders(ordersData);
      setContacts(contactsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const result = await deleteUserAction(userId);
      if (result.success) {
        setUsers(users.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      const result = await deleteProductAction(productId);
      if (result.success) {
        setProducts(products.filter(product => product.id !== productId));
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setActiveTab('users');
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setActiveTab('products');
  };

  const handleFormSuccess = () => {
    setEditingUser(null);
    setEditingProduct(null);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Server Actions Demo
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive demonstration of Next.js 15 Server Actions with useFormStatus and useFormAction
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'users', label: 'Users' },
              { id: 'products', label: 'Products' },
              { id: 'contact', label: 'Contact' },
              { id: 'data', label: 'Data View' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Forms */}
          <div className="space-y-8">
            {activeTab === 'users' && (
              <>
                <UserForm
                  user={editingUser}
                  mode={editingUser ? 'edit' : 'create'}
                />
                {editingUser && (
                  <button
                    onClick={() => setEditingUser(null)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel Edit
                  </button>
                )}
              </>
            )}

            {activeTab === 'products' && (
              <>
                <ProductForm
                  product={editingProduct}
                  mode={editingProduct ? 'edit' : 'create'}
                />
                {editingProduct && (
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel Edit
                  </button>
                )}
              </>
            )}

            {activeTab === 'contact' && <ContactForm />}
          </div>

          {/* Data Display */}
          <div className="space-y-8">
            {activeTab === 'users' && (
              <DataDisplay
                title="Users"
                data={users}
                onDelete={handleDeleteUser}
              />
            )}

            {activeTab === 'products' && (
              <DataDisplay
                title="Products"
                data={products}
                onDelete={handleDeleteProduct}
              />
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <DataDisplay title="Users" data={users} />
                <DataDisplay title="Products" data={products} />
                <DataDisplay title="Orders" data={orders} />
                <DataDisplay title="Contacts" data={contacts} />
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>📧 Email: contact@example.com</p>
                  <p>📞 Phone: +1 (555) 123-4567</p>
                  <p>📍 Address: 123 Main St, City, State 12345</p>
                  <p>⏰ Hours: Monday - Friday, 9 AM - 5 PM</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Server Actions</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Form data processed on the server</li>
                <li>• Zod validation with detailed error messages</li>
                <li>• Automatic cache revalidation</li>
                <li>• Type-safe with TypeScript</li>
                <li>• Progressive enhancement</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">useFormStatus & useFormAction</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Loading states with useFormStatus</li>
                <li>• Form state management with useFormAction</li>
                <li>• Optimistic updates</li>
                <li>• Error handling and validation</li>
                <li>• Real-time feedback</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
