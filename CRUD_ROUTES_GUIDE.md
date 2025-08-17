# CRUD Routes System Guide

This document provides a comprehensive guide to the CRUD (Create, Read, Update, Delete) routes system implemented in the Next.js e-commerce application.

## Overview

The CRUD routes system provides a standardized way to handle database operations across different entities. It includes automatic validation, error handling, pagination, search, and middleware integration.

## Architecture

### Core Components

1. **RouteHandler** (`src/lib/routeHandler.ts`)
   - Generic CRUD route handler
   - Validation system
   - Pagination and search utilities
   - Middleware composition

2. **DataLayer** (`src/lib/dataLayer.ts`)
   - Entity definitions
   - In-memory storage implementation
   - CRUD operations for each entity
   - Mock data initialization

3. **API Routes** (`src/app/api/*/route.ts`)
   - Individual entity routes
   - Configuration and validation rules
   - Export of HTTP methods

## Entity Definitions

### Base Entity
All entities extend the base entity interface:

```typescript
interface BaseEntity extends CrudEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
```

### User Entity
```typescript
interface User extends BaseEntity {
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
```

### Product Entity
```typescript
interface Product extends BaseEntity {
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
```

### Order Entity
```typescript
interface Order extends BaseEntity {
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
```

### Category Entity
```typescript
interface Category extends BaseEntity {
  name: string;
  description: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
}
```

### Review Entity
```typescript
interface Review extends BaseEntity {
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
}
```

## CRUD Operations

### Create (POST)
Creates a new entity.

**Endpoint:** `POST /api/{entity}`

**Example:**
```typescript
const response = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'New Product',
    description: 'Product description',
    price: 99.99,
    category: 'Electronics',
    inStock: true,
    stock: 10
  })
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "id_5",
    "name": "New Product",
    "description": "Product description",
    "price": 99.99,
    "category": "Electronics",
    "inStock": true,
    "stock": 10,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Product created successfully"
}
```

### Read (GET)
Retrieves entities with optional filtering, pagination, and search.

**Endpoint:** `GET /api/{entity}`

**Query Parameters:**
- `id` - Get specific entity by ID
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term
- `sortBy` - Field to sort by
- `sortOrder` - Sort order ('asc' or 'desc')

**Examples:**

Get all products:
```typescript
const response = await fetch('/api/products');
```

Get specific product:
```typescript
const response = await fetch('/api/products?id=id_1');
```

Get products with pagination and search:
```typescript
const response = await fetch('/api/products?page=1&limit=5&search=headphones&sortBy=price&sortOrder=desc');
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "id_1",
      "name": "Premium Headphones",
      "price": 299.99,
      // ... other fields
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 8,
    "itemsPerPage": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "message": "Products retrieved successfully"
}
```

### Update (PUT/PATCH)
Updates an existing entity.

**PUT Endpoint:** `PUT /api/{entity}?id={id}` (Full update)
**PATCH Endpoint:** `PATCH /api/{entity}?id={id}` (Partial update)

**Example:**
```typescript
const response = await fetch('/api/products?id=id_1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Updated Product Name',
    price: 199.99
  })
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "id_1",
    "name": "Updated Product Name",
    "price": 199.99,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Product updated successfully"
}
```

### Delete (DELETE)
Deletes an entity.

**Endpoint:** `DELETE /api/{entity}?id={id}`

**Example:**
```typescript
const response = await fetch('/api/products?id=id_1', {
  method: 'DELETE'
});
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

## Validation System

### Built-in Validation Rules

```typescript
const validationRules = {
  email: (value: any) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof value === 'string' && emailRegex.test(value);
  },

  phone: (value: any) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return typeof value === 'string' && phoneRegex.test(value.replace(/\s/g, ''));
  },

  url: (value: any) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  positiveNumber: (value: any) => {
    return typeof value === 'number' && value > 0;
  },

  nonNegativeNumber: (value: any) => {
    return typeof value === 'number' && value >= 0;
  },

  boolean: (value: any) => {
    return typeof value === 'boolean';
  },

  date: (value: any) => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  minLength: (min: number) => (value: any) => {
    return typeof value === 'string' && value.length >= min;
  },

  maxLength: (max: number) => (value: any) => {
    return typeof value === 'string' && value.length <= max;
  },

  range: (min: number, max: number) => (value: any) => {
    return typeof value === 'number' && value >= min && value <= max;
  },

  enum: (allowedValues: any[]) => (value: any) => {
    return allowedValues.includes(value);
  }
};
```

### Entity Validation Configuration

```typescript
// User validation
const userValidationConfig = {
  required: ['email', 'name', 'role'],
  rules: {
    email: validationRules.email,
    role: validationRules.enum(['admin', 'user', 'guest']),
    phone: validationRules.phone,
    name: validationRules.minLength(2)
  }
};

// Product validation
const productValidationConfig = {
  required: ['name', 'description', 'price', 'category'],
  rules: {
    price: validationRules.positiveNumber,
    stock: validationRules.nonNegativeNumber,
    rating: validationRules.range(0, 5),
    reviews: validationRules.nonNegativeNumber,
    name: validationRules.minLength(2),
    description: validationRules.minLength(10)
  }
};
```

## Creating New CRUD Routes

### Step 1: Define Entity Interface
```typescript
// src/lib/dataLayer.ts
export interface NewEntity extends BaseEntity {
  field1: string;
  field2: number;
  field3: boolean;
}
```

### Step 2: Create Storage and Operations
```typescript
// src/lib/dataLayer.ts
const newEntityStorage = new InMemoryStorage<NewEntity>();

export const newEntityOperations: CrudOperations<NewEntity> = {
  create: async (data) => newEntityStorage.create(data),
  read: async (id) => newEntityStorage.read(id as string),
  readAll: async (filters) => newEntityStorage.readAll(filters),
  update: async (id, data) => newEntityStorage.update(id as string, data),
  delete: async (id) => newEntityStorage.delete(id as string),
  exists: async (id) => newEntityStorage.exists(id as string)
};
```

### Step 3: Create API Route
```typescript
// src/app/api/new-entities/route.ts
import { createCrudRoutes, validationRules } from '../../../lib/routeHandler';
import { newEntityOperations, NewEntity } from '../../../lib/dataLayer';

const newEntityValidationConfig = {
  required: ['field1', 'field2'],
  rules: {
    field1: validationRules.minLength(2),
    field2: validationRules.positiveNumber,
    field3: validationRules.boolean
  }
};

export const { GET, POST, PUT, PATCH, DELETE } = createCrudRoutes<NewEntity>(
  newEntityOperations,
  'NewEntity',
  ['field1', 'field2'], // Search fields
  {
    enableAuth: true,
    enableCors: true,
    rateLimit: {
      maxRequests: 50,
      windowMs: 15 * 60 * 1000
    },
    validation: newEntityValidationConfig
  }
);
```

## Configuration Options

### RouteHandlerConfig
```typescript
interface RouteHandlerConfig {
  enableAuth?: boolean;        // Enable authentication middleware
  enableCors?: boolean;        // Enable CORS middleware
  rateLimit?: {
    maxRequests: number;       // Maximum requests per window
    windowMs: number;          // Time window in milliseconds
  };
  validation?: {
    required?: string[];       // Required fields
    rules?: Record<string, (value: any) => boolean>; // Custom validation rules
  };
}
```

### Example Configuration
```typescript
const config = {
  enableAuth: true,           // Require authentication
  enableCors: true,           // Enable CORS
  rateLimit: {
    maxRequests: 100,         // 100 requests per window
    windowMs: 15 * 60 * 1000  // 15 minutes
  },
  validation: {
    required: ['name', 'email'],
    rules: {
      email: validationRules.email,
      name: validationRules.minLength(2)
    }
  }
};
```

## Error Handling

The CRUD system integrates with the global error handling system:

### Common Error Types
- **ValidationError**: Invalid input data
- **NotFoundError**: Entity not found
- **ConflictError**: Entity already exists
- **UnauthorizedError**: Authentication required
- **ForbiddenError**: Insufficient permissions

### Error Response Format
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "email",
    "value": "invalid-email",
    "type": "email_format"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Pagination and Search

### Pagination Response
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Search Implementation
- Case-insensitive search
- Searches across specified fields
- Supports partial matches
- Can be combined with pagination

### Sorting
- Sort by any entity field
- Ascending or descending order
- Applied before pagination

## Testing

### Using the CRUD Demo Page
1. Navigate to `/crud-demo`
2. Select an entity type
3. Test Create, Read, Update, Delete operations
4. Use search and pagination features
5. Load sample data for testing

### Manual API Testing
```bash
# Get all products
curl http://localhost:3000/api/products

# Create a product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":99.99}'

# Update a product
curl -X PUT "http://localhost:3000/api/products?id=id_1" \
  -H "Content-Type: application/json" \
  -d '{"price":199.99}'

# Delete a product
curl -X DELETE "http://localhost:3000/api/products?id=id_1"
```

## Best Practices

### 1. Validation
- Always define required fields
- Use appropriate validation rules
- Provide clear error messages

### 2. Security
- Enable authentication for sensitive operations
- Implement proper rate limiting
- Validate all input data

### 3. Performance
- Use pagination for large datasets
- Implement efficient search
- Consider caching for frequently accessed data

### 4. Error Handling
- Provide meaningful error messages
- Log errors for debugging
- Handle edge cases gracefully

### 5. API Design
- Use consistent response formats
- Include helpful metadata
- Follow REST conventions

## Integration with Database

To integrate with a real database, replace the `InMemoryStorage` class:

```typescript
class DatabaseStorage<T extends BaseEntity> {
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    // Database insert logic
  }

  async read(id: string): Promise<T | null> {
    // Database select logic
  }

  async readAll(filters?: Record<string, any>): Promise<T[]> {
    // Database select with filters
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    // Database update logic
  }

  async delete(id: string): Promise<boolean> {
    // Database delete logic
  }

  async exists(id: string): Promise<boolean> {
    // Database exists check
  }
}
```

## Conclusion

The CRUD routes system provides a robust, scalable foundation for handling database operations. It includes comprehensive validation, error handling, pagination, and search capabilities while maintaining a clean, consistent API design.

For more information, refer to the individual route files and the demo page at `/crud-demo`.
