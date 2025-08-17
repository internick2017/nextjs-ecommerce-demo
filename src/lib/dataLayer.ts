import { CrudEntity, CrudOperations } from './routeHandler';

// Base entity interface
export interface BaseEntity extends CrudEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User entity
export interface User extends BaseEntity {
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  isActive: boolean;
  avatar?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

// Product entity
export interface Product extends BaseEntity {
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  inStock: boolean;
  stock: number;
  rating: number;
  reviews: number;
  tags: string[];
  specifications?: Record<string, any>;
}

// Order entity
export interface Order extends BaseEntity {
  userId: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  trackingNumber?: string;
}

// Order item entity
export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

// Category entity
export interface Category extends BaseEntity {
  name: string;
  description: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
}

// Review entity
export interface Review extends BaseEntity {
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
}

// Generic in-memory storage class
class InMemoryStorage<T extends BaseEntity> {
  private data: Map<string, T> = new Map();
  private counter = 1;

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = `id_${this.counter++}`;
    const now = new Date().toISOString();

    const entity: T = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    } as T;

    this.data.set(id, entity);
    return entity;
  }

  async read(id: string): Promise<T | null> {
    return this.data.get(id) || null;
  }

  async readAll(filters?: Record<string, any>): Promise<T[]> {
    let entities = Array.from(this.data.values());

    // Apply filters
    if (filters) {
      entities = entities.filter(entity => {
        return Object.entries(filters).every(([key, value]) => {
          return (entity as any)[key] === value;
        });
      });
    }

    return entities;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const entity = this.data.get(id);
    if (!entity) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    const updatedEntity: T = {
      ...entity,
      ...data,
      id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString()
    };

    this.data.set(id, updatedEntity);
    return updatedEntity;
  }

  async delete(id: string): Promise<boolean> {
    return this.data.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.data.has(id);
  }

  async search(searchTerm: string, fields: string[]): Promise<T[]> {
    const entities = Array.from(this.data.values());

    if (!searchTerm) return entities;

    const lowerSearchTerm = searchTerm.toLowerCase();

    return entities.filter(entity => {
      return fields.some(field => {
        const value = (entity as any)[field];
        return value && String(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }

  async count(): Promise<number> {
    return this.data.size;
  }

  // Clear all data (useful for testing)
  async clear(): Promise<void> {
    this.data.clear();
    this.counter = 1;
  }
}

// Initialize mock data
const initializeMockData = () => {
  // Users
  const users: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      isActive: true,
      avatar: '/avatars/admin.jpg',
      phone: '+1234567890',
      address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'AS',
        zipCode: '12345',
        country: 'USA'
      }
    },
    {
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user',
      isActive: true,
      avatar: '/avatars/user.jpg',
      phone: '+1234567891'
    },
    {
      email: 'guest@example.com',
      name: 'Guest User',
      role: 'guest',
      isActive: false
    }
  ];

  // Categories
  const categories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      image: '/categories/electronics.jpg',
      isActive: true
    },
    {
      name: 'Clothing',
      description: 'Fashion and apparel',
      image: '/categories/clothing.jpg',
      isActive: true
    },
    {
      name: 'Home & Garden',
      description: 'Home improvement and garden supplies',
      image: '/categories/home.jpg',
      isActive: true
    }
  ];

  // Products
  const products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Premium Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 299.99,
      category: 'Electronics',
      image: '/products/headphones.jpg',
      inStock: true,
      stock: 15,
      rating: 4.8,
      reviews: 234,
      tags: ['wireless', 'noise-cancelling', 'premium'],
      specifications: {
        'Driver Size': '40mm',
        'Frequency Response': '20Hz - 20kHz',
        'Battery Life': '30 hours'
      }
    },
    {
      name: 'Smart Watch',
      description: 'Feature-rich smartwatch with health tracking',
      price: 199.99,
      category: 'Electronics',
      image: '/products/smartwatch.jpg',
      inStock: true,
      stock: 8,
      rating: 4.5,
      reviews: 189,
      tags: ['smartwatch', 'health', 'fitness'],
      specifications: {
        'Display': '1.4" AMOLED',
        'Battery': '7 days',
        'Water Rating': '5ATM'
      }
    },
    {
      name: 'Laptop Stand',
      description: 'Ergonomic aluminum laptop stand for better posture',
      price: 79.99,
      category: 'Electronics',
      image: '/products/laptop-stand.jpg',
      inStock: true,
      stock: 25,
      rating: 4.4,
      reviews: 67,
      tags: ['ergonomic', 'aluminum', 'adjustable']
    },
    {
      name: 'Wireless Mouse',
      description: 'Precision wireless mouse with ergonomic design',
      price: 49.99,
      category: 'Electronics',
      image: '/products/mouse.jpg',
      inStock: false,
      stock: 0,
      rating: 4.3,
      reviews: 98,
      tags: ['wireless', 'ergonomic', 'precision']
    }
  ];

  // Reviews
  const reviews: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      productId: 'id_1',
      userId: 'id_2',
      rating: 5,
      title: 'Excellent sound quality',
      comment: 'These headphones are amazing! The sound quality is incredible and the noise cancellation works perfectly.',
      isVerified: true
    },
    {
      productId: 'id_1',
      userId: 'id_1',
      rating: 4,
      title: 'Great headphones',
      comment: 'Very good headphones, comfortable to wear for long periods.',
      isVerified: true
    }
  ];

  return { users, categories, products, reviews };
};

// Create storage instances
const userStorage = new InMemoryStorage<User>();
const productStorage = new InMemoryStorage<Product>();
const orderStorage = new InMemoryStorage<Order>();
const categoryStorage = new InMemoryStorage<Category>();
const reviewStorage = new InMemoryStorage<Review>();

// Initialize with mock data
const initializeData = async () => {
  const { users, categories, products, reviews } = initializeMockData();

  // Create users
  for (const userData of users) {
    await userStorage.create(userData);
  }

  // Create categories
  for (const categoryData of categories) {
    await categoryStorage.create(categoryData);
  }

  // Create products
  for (const productData of products) {
    await productStorage.create(productData);
  }

  // Create reviews
  for (const reviewData of reviews) {
    await reviewStorage.create(reviewData);
  }

  console.log('📊 Mock data initialized successfully');
};

// CRUD operations for Users
export const userOperations: CrudOperations<User> = {
  create: async (data) => {
    // Check if email already exists
    const existingUsers = await userStorage.readAll();
    const emailExists = existingUsers.some(user => user.email === data.email);
    if (emailExists) {
      throw new Error('User with this email already exists');
    }
    return userStorage.create(data);
  },
  read: async (id) => userStorage.read(id as string),
  readAll: async (filters) => userStorage.readAll(filters),
  update: async (id, data) => userStorage.update(id as string, data),
  delete: async (id) => userStorage.delete(id as string),
  exists: async (id) => userStorage.exists(id as string)
};

// CRUD operations for Products
export const productOperations: CrudOperations<Product> = {
  create: async (data) => productStorage.create(data),
  read: async (id) => productStorage.read(id as string),
  readAll: async (filters) => productStorage.readAll(filters),
  update: async (id, data) => productStorage.update(id as string, data),
  delete: async (id) => productStorage.delete(id as string),
  exists: async (id) => productStorage.exists(id as string)
};

// CRUD operations for Orders
export const orderOperations: CrudOperations<Order> = {
  create: async (data) => {
    // Validate that user exists
    const user = await userStorage.read(data.userId);
    if (!user) {
      throw new Error('User not found');
    }
    return orderStorage.create(data);
  },
  read: async (id) => orderStorage.read(id as string),
  readAll: async (filters) => orderStorage.readAll(filters),
  update: async (id, data) => orderStorage.update(id as string, data),
  delete: async (id) => orderStorage.delete(id as string),
  exists: async (id) => orderStorage.exists(id as string)
};

// CRUD operations for Categories
export const categoryOperations: CrudOperations<Category> = {
  create: async (data) => categoryStorage.create(data),
  read: async (id) => categoryStorage.read(id as string),
  readAll: async (filters) => categoryStorage.readAll(filters),
  update: async (id, data) => categoryStorage.update(id as string, data),
  delete: async (id) => categoryStorage.delete(id as string),
  exists: async (id) => categoryStorage.exists(id as string)
};

// CRUD operations for Reviews
export const reviewOperations: CrudOperations<Review> = {
  create: async (data) => {
    // Validate that product and user exist
    const product = await productStorage.read(data.productId);
    const user = await userStorage.read(data.userId);

    if (!product) {
      throw new Error('Product not found');
    }
    if (!user) {
      throw new Error('User not found');
    }

    return reviewStorage.create(data);
  },
  read: async (id) => reviewStorage.read(id as string),
  readAll: async (filters) => reviewStorage.readAll(filters),
  update: async (id, data) => reviewStorage.update(id as string, data),
  delete: async (id) => reviewStorage.delete(id as string),
  exists: async (id) => reviewStorage.exists(id as string)
};

// Initialize data when module is loaded
if (typeof window === 'undefined') {
  // Only initialize on server side
  initializeData().catch(console.error);
}

// Export storage instances for direct access if needed
export {
  userStorage,
  productStorage,
  orderStorage,
  categoryStorage,
  reviewStorage
};
