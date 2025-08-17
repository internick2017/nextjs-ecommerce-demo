'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Types for server actions
export interface ServerActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface FormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

// Validation schemas
export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  role: z.enum(['user', 'admin', 'moderator']),
  bio: z.string().optional(),
  newsletter: z.boolean().default(false),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  inStock: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

export const orderSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })).min(1, 'At least one item is required'),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
  }),
  paymentMethod: z.enum(['credit_card', 'paypal', 'bank_transfer']),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

// Mock database for demo purposes
class MockDatabase {
  private users: any[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 25, role: 'user', bio: 'Software developer', newsletter: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 30, role: 'admin', bio: 'Product manager', newsletter: false },
  ];

  private products: any[] = [
    { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', description: 'High-performance laptop', inStock: true, tags: ['computer', 'tech'] },
    { id: 2, name: 'Phone', price: 599.99, category: 'Electronics', description: 'Smartphone with latest features', inStock: true, tags: ['mobile', 'tech'] },
  ];

  private orders: any[] = [];
  private contacts: any[] = [];

  // User operations
  async createUser(data: any) {
    const newUser = { id: this.users.length + 1, ...data, createdAt: new Date().toISOString() };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, data: any) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');

    this.users[index] = { ...this.users[index], ...data, updatedAt: new Date().toISOString() };
    return this.users[index];
  }

  async deleteUser(id: number) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');

    const deletedUser = this.users[index];
    this.users.splice(index, 1);
    return deletedUser;
  }

  async getUsers() {
    return this.users;
  }

  async getUser(id: number) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  }

  // Product operations
  async createProduct(data: any) {
    const newProduct = { id: this.products.length + 1, ...data, createdAt: new Date().toISOString() };
    this.products.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: number, data: any) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');

    this.products[index] = { ...this.products[index], ...data, updatedAt: new Date().toISOString() };
    return this.products[index];
  }

  async deleteProduct(id: number) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const deletedProduct = this.products[index];
    this.products.splice(index, 1);
    return deletedProduct;
  }

  async getProducts() {
    return this.products;
  }

  async getProduct(id: number) {
    const product = this.products.find(p => p.id === id);
    if (!product) throw new Error('Product not found');
    return product;
  }

  // Order operations
  async createOrder(data: any) {
    const newOrder = {
      id: this.orders.length + 1,
      ...data,
      status: 'pending',
      total: data.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
      createdAt: new Date().toISOString()
    };
    this.orders.push(newOrder);
    return newOrder;
  }

  async getOrders() {
    return this.orders;
  }

  // Contact operations
  async createContact(data: any) {
    const newContact = {
      id: this.contacts.length + 1,
      ...data,
      status: 'new',
      createdAt: new Date().toISOString()
    };
    this.contacts.push(newContact);
    return newContact;
  }

  async getContacts() {
    return this.contacts;
  }

  // Get all data for demo
  getAllData() {
    return {
      users: this.users,
      products: this.products,
      orders: this.orders,
      contacts: this.contacts,
    };
  }
}

const db = new MockDatabase();

// User server actions
export async function createUserAction(prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    // Validate form data
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      age: parseInt(formData.get('age') as string),
      role: formData.get('role') as 'user' | 'admin' | 'moderator',
      bio: formData.get('bio') as string || undefined,
      newsletter: formData.get('newsletter') === 'on',
    };

    const validatedData = userSchema.parse(rawData);

    // Create user in database
    const newUser = await db.createUser(validatedData);

    // Revalidate cache
    revalidatePath('/users');
    revalidateTag('users');

    return {
      success: true,
      message: `User ${newUser.name} created successfully!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Validation failed. Please check your input.',
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}

export async function updateUserAction(prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const userId = parseInt(formData.get('id') as string);
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      age: parseInt(formData.get('age') as string),
      role: formData.get('role') as 'user' | 'admin' | 'moderator',
      bio: formData.get('bio') as string || undefined,
      newsletter: formData.get('newsletter') === 'on',
    };

    const validatedData = userSchema.parse(rawData);
    const updatedUser = await db.updateUser(userId, validatedData);

    revalidatePath('/users');
    revalidateTag('users');

    return {
      success: true,
      message: `User ${updatedUser.name} updated successfully!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Validation failed. Please check your input.',
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user',
    };
  }
}

export async function deleteUserAction(userId: number): Promise<ServerActionResponse> {
  try {
    const deletedUser = await db.deleteUser(userId);

    revalidatePath('/users');
    revalidateTag('users');

    return {
      success: true,
      data: deletedUser,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

// Product server actions
export async function createProductAction(prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const rawData = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      inStock: formData.get('inStock') === 'on',
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(tag => tag.trim()) : [],
    };

    const validatedData = productSchema.parse(rawData);
    const newProduct = await db.createProduct(validatedData);

    revalidatePath('/products');
    revalidateTag('products');

    return {
      success: true,
      message: `Product ${newProduct.name} created successfully!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Validation failed. Please check your input.',
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create product',
    };
  }
}

export async function updateProductAction(prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const productId = parseInt(formData.get('id') as string);
    const rawData = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      inStock: formData.get('inStock') === 'on',
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(tag => tag.trim()) : [],
    };

    const validatedData = productSchema.parse(rawData);
    const updatedProduct = await db.updateProduct(productId, validatedData);

    revalidatePath('/products');
    revalidateTag('products');

    return {
      success: true,
      message: `Product ${updatedProduct.name} updated successfully!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Validation failed. Please check your input.',
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update product',
    };
  }
}

export async function deleteProductAction(productId: number): Promise<ServerActionResponse> {
  try {
    const deletedProduct = await db.deleteProduct(productId);

    revalidatePath('/products');
    revalidateTag('products');

    return {
      success: true,
      data: deletedProduct,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete product',
    };
  }
}

// Order server actions
export async function createOrderAction(prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const rawData = {
      customerName: formData.get('customerName') as string,
      customerEmail: formData.get('customerEmail') as string,
      items: JSON.parse(formData.get('items') as string),
      shippingAddress: {
        street: formData.get('street') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        zipCode: formData.get('zipCode') as string,
      },
      paymentMethod: formData.get('paymentMethod') as 'credit_card' | 'paypal' | 'bank_transfer',
    };

    const validatedData = orderSchema.parse(rawData);
    const newOrder = await db.createOrder(validatedData);

    revalidatePath('/orders');
    revalidateTag('orders');

    return {
      success: true,
      message: `Order #${newOrder.id} created successfully! Total: $${newOrder.total.toFixed(2)}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Validation failed. Please check your input.',
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}

// Contact server actions
export async function createContactAction(prevState: FormState, formData: FormData): Promise<FormState> {
  try {
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      priority: formData.get('priority') as 'low' | 'medium' | 'high',
    };

    const validatedData = contactSchema.parse(rawData);
    const newContact = await db.createContact(validatedData);

    revalidatePath('/contact');
    revalidateTag('contacts');

    return {
      success: true,
      message: `Contact form submitted successfully! We'll get back to you soon.`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Validation failed. Please check your input.',
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit contact form',
    };
  }
}

// Data fetching functions
export async function getUsersAction(): Promise<any[]> {
  return await db.getUsers();
}

export async function getProductsAction(): Promise<any[]> {
  return await db.getProducts();
}

export async function getOrdersAction(): Promise<any[]> {
  return await db.getOrders();
}

export async function getContactsAction(): Promise<any[]> {
  return await db.getContacts();
}

export async function getAllDataAction() {
  return db.getAllData();
}

// Utility functions
export function getFieldError(errors: Record<string, string[]> | undefined, field: string): string | undefined {
  return errors?.[field]?.[0];
}

export function hasFieldError(errors: Record<string, string[]> | undefined, field: string): boolean {
  return !!errors?.[field]?.length;
}
