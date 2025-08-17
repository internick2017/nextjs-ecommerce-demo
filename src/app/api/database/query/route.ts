import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, withValidation, withCors } from '../../../lib/apiErrorHandler';

// Mock database connection - replace with your actual database
class MockDatabase {
  private data = {
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'admin' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' }
    ],
    products: [
      { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', inStock: true },
      { id: 2, name: 'Phone', price: 599.99, category: 'Electronics', inStock: true },
      { id: 3, name: 'Tablet', price: 399.99, category: 'Electronics', inStock: false },
      { id: 4, name: 'Headphones', price: 99.99, category: 'Accessories', inStock: true },
      { id: 5, name: 'Mouse', price: 29.99, category: 'Accessories', inStock: true }
    ],
    orders: [
      { id: 1, userId: 1, total: 1099.98, status: 'completed', createdAt: '2024-01-15' },
      { id: 2, userId: 2, total: 599.99, status: 'pending', createdAt: '2024-01-16' },
      { id: 3, userId: 1, total: 129.98, status: 'processing', createdAt: '2024-01-17' }
    ],
    categories: [
      { id: 1, name: 'Electronics', description: 'Electronic devices' },
      { id: 2, name: 'Accessories', description: 'Device accessories' },
      { id: 3, name: 'Clothing', description: 'Apparel and clothing' }
    ]
  };

  async query(query: string, params: any[] = []): Promise<any> {
    // Simple query parser for demo purposes
    // In a real application, you would use a proper SQL parser and database driver

    const normalizedQuery = query.toLowerCase().trim();

    // Handle SELECT queries
    if (normalizedQuery.startsWith('select')) {
      return this.handleSelectQuery(query, params);
    }

    // Handle COUNT queries
    if (normalizedQuery.includes('count')) {
      return this.handleCountQuery(query, params);
    }

    throw new Error(`Unsupported query type: ${query}`);
  }

  private handleSelectQuery(query: string, params: any[]): any {
    const normalizedQuery = query.toLowerCase();

    // Extract table name
    let tableName = '';
    if (normalizedQuery.includes('from users')) tableName = 'users';
    else if (normalizedQuery.includes('from products')) tableName = 'products';
    else if (normalizedQuery.includes('from orders')) tableName = 'orders';
    else if (normalizedQuery.includes('from categories')) tableName = 'categories';
    else throw new Error('Unknown table in query');

    let results = [...this.data[tableName as keyof typeof this.data]];

    // Handle WHERE clauses
    if (normalizedQuery.includes('where')) {
      results = this.applyWhereClause(results, query, params);
    }

    // Handle ORDER BY
    if (normalizedQuery.includes('order by')) {
      results = this.applyOrderBy(results, query);
    }

    // Handle LIMIT and OFFSET
    if (normalizedQuery.includes('limit')) {
      results = this.applyLimitOffset(results, query);
    }

    return results;
  }

  private handleCountQuery(query: string, params: any[]): any {
    const results = this.handleSelectQuery(query, params);
    return { count: results.length };
  }

  private applyWhereClause(data: any[], query: string, params: any[]): any[] {
    // Simple WHERE clause parser
    const whereMatch = query.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|$)/i);
    if (!whereMatch) return data;

    const whereClause = whereMatch[1];
    const conditions = whereClause.split(/\s+and\s+/i);

    return data.filter(item => {
      return conditions.every(condition => {
        const [field, operator, value] = condition.trim().split(/\s+/);

        if (operator === '=') {
          const paramIndex = parseInt(value.replace('$', '')) - 1;
          return item[field] === params[paramIndex];
        }

        if (operator === '>') {
          const paramIndex = parseInt(value.replace('$', '')) - 1;
          return item[field] > params[paramIndex];
        }

        if (operator === '<') {
          const paramIndex = parseInt(value.replace('$', '')) - 1;
          return item[field] < params[paramIndex];
        }

        if (operator === 'ilike') {
          const paramIndex = parseInt(value.replace('$', '')) - 1;
          const searchTerm = params[paramIndex].replace(/%/g, '');
          return item[field].toLowerCase().includes(searchTerm.toLowerCase());
        }

        return true;
      });
    });
  }

  private applyOrderBy(data: any[], query: string): any[] {
    const orderMatch = query.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
    if (!orderMatch) return data;

    const field = orderMatch[1];
    const direction = orderMatch[2]?.toLowerCase() || 'asc';

    return [...data].sort((a, b) => {
      if (direction === 'desc') {
        return b[field] > a[field] ? 1 : -1;
      }
      return a[field] > b[field] ? 1 : -1;
    });
  }

  private applyLimitOffset(data: any[], query: string): any[] {
    const limitMatch = query.match(/limit\s+(\d+)/i);
    const offsetMatch = query.match(/offset\s+(\d+)/i);

    let results = data;

    if (offsetMatch) {
      const offset = parseInt(offsetMatch[1]);
      results = results.slice(offset);
    }

    if (limitMatch) {
      const limit = parseInt(limitMatch[1]);
      results = results.slice(0, limit);
    }

    return results;
  }
}

// Database instance
const db = new MockDatabase();

// Validation schema for query requests
const querySchema = {
  query: (value: any) => {
    if (!value || typeof value !== 'string') {
      throw new Error('Query is required and must be a string');
    }
    if (value.length > 10000) {
      throw new Error('Query too long');
    }
    return value;
  },
  params: (value: any) => {
    if (value && !Array.isArray(value)) {
      throw new Error('Params must be an array');
    }
    return value || [];
  }
};

async function handleQuery(request: NextRequest) {
  const body = await request.json();

  // Validate request
  const query = querySchema.query(body.query);
  const params = querySchema.params(body.params);

  try {
    // Execute query
    const result = await db.query(query, params);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export the handler with middleware
export const POST = withCors(
  withValidation(
    withErrorHandler(handleQuery)
  )
);
