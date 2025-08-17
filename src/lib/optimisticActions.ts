'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

// Types for optimistic actions
export interface OptimisticActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  optimisticId?: string | number;
}

export interface OptimisticState<T = any> {
  data: T[];
  optimisticUpdates: Map<string | number, T>;
  pendingDeletes: Set<string | number>;
  pendingUpdates: Map<string | number, T>;
}

// Validation schemas for optimistic actions
export const optimisticUserSchema = z.object({
  id: z.number(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  role: z.enum(['user', 'admin', 'moderator']),
  bio: z.string().optional(),
  newsletter: z.boolean().default(false),
});

export const optimisticProductSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  inStock: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

// Mock database for optimistic operations
class OptimisticDatabase {
  private users: any[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 25, role: 'user', bio: 'Software developer', newsletter: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 30, role: 'admin', bio: 'Product manager', newsletter: false },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 28, role: 'user', bio: 'Designer', newsletter: true },
  ];

  private products: any[] = [
    { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', description: 'High-performance laptop', inStock: true, tags: ['computer', 'tech'] },
    { id: 2, name: 'Phone', price: 599.99, category: 'Electronics', description: 'Smartphone with latest features', inStock: true, tags: ['mobile', 'tech'] },
    { id: 3, name: 'Tablet', price: 399.99, category: 'Electronics', description: 'Portable tablet device', inStock: false, tags: ['mobile', 'tablet'] },
  ];

  // User operations
  async updateUser(id: number, data: any) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');

    const updatedUser = { ...this.users[index], ...data, updatedAt: new Date().toISOString() };
    this.users[index] = updatedUser;
    return updatedUser;
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

  // Product operations
  async updateProduct(id: number, data: any) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const updatedProduct = { ...this.products[index], ...data, updatedAt: new Date().toISOString() };
    this.products[index] = updatedProduct;
    return updatedProduct;
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

  // Get all data
  getAllData() {
    return {
      users: this.users,
      products: this.products,
    };
  }
}

const db = new OptimisticDatabase();

// Optimistic Delete Actions
export async function optimisticDeleteUserAction(userId: number): Promise<OptimisticActionResponse> {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const deletedUser = await db.deleteUser(userId);

    // Revalidate cache
    revalidatePath('/users');
    revalidateTag('users');

    return {
      success: true,
      data: deletedUser,
      optimisticId: userId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
      optimisticId: userId,
    };
  }
}

export async function optimisticDeleteProductAction(productId: number): Promise<OptimisticActionResponse> {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const deletedProduct = await db.deleteProduct(productId);

    // Revalidate cache
    revalidatePath('/products');
    revalidateTag('products');

    return {
      success: true,
      data: deletedProduct,
      optimisticId: productId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete product',
      optimisticId: productId,
    };
  }
}

// Optimistic Update Actions
export async function optimisticUpdateUserAction(userId: number, userData: any): Promise<OptimisticActionResponse> {
  try {
    // Validate data
    const validatedData = optimisticUserSchema.parse({ id: userId, ...userData });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedUser = await db.updateUser(userId, validatedData);

    // Revalidate cache
    revalidatePath('/users');
    revalidateTag('users');

    return {
      success: true,
      data: updatedUser,
      optimisticId: userId,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed: ' + error.errors.map(e => e.message).join(', '),
        optimisticId: userId,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
      optimisticId: userId,
    };
  }
}

export async function optimisticUpdateProductAction(productId: number, productData: any): Promise<OptimisticActionResponse> {
  try {
    // Validate data
    const validatedData = optimisticProductSchema.parse({ id: productId, ...productData });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedProduct = await db.updateProduct(productId, validatedData);

    // Revalidate cache
    revalidatePath('/products');
    revalidateTag('products');

    return {
      success: true,
      data: updatedProduct,
      optimisticId: productId,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed: ' + error.errors.map(e => e.message).join(', '),
        optimisticId: productId,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update product',
      optimisticId: productId,
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

export async function getAllDataAction() {
  return db.getAllData();
}

// Utility functions for optimistic operations
export function createOptimisticId(): string {
  return `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isOptimisticId(id: string | number): boolean {
  return typeof id === 'string' && id.startsWith('optimistic_');
}
