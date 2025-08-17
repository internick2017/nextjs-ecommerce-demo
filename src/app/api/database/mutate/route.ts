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

  private nextIds = {
    users: 4,
    products: 6,
    orders: 4,
    categories: 4
  };

  async mutate(query: string, params: any[] = []): Promise<any> {
    const normalizedQuery = query.toLowerCase().trim();

    // Handle INSERT queries
    if (normalizedQuery.startsWith('insert')) {
      return this.handleInsertQuery(query, params);
    }

    // Handle UPDATE queries
    if (normalizedQuery.startsWith('update')) {
      return this.handleUpdateQuery(query, params);
    }

    // Handle DELETE queries
    if (normalizedQuery.startsWith('delete')) {
      return this.handleDeleteQuery(query, params);
    }

    throw new Error(`Unsupported mutation type: ${query}`);
  }

  private handleInsertQuery(query: string, params: any[]): any {
    const tableMatch = query.match(/insert\s+into\s+(\w+)/i);
    if (!tableMatch) throw new Error('Invalid INSERT query');

    const tableName = tableMatch[1] as keyof typeof this.data;
    if (!this.data[tableName]) throw new Error(`Unknown table: ${tableName}`);

    // Extract column names and values
    const columnsMatch = query.match(/\(([^)]+)\)\s+values\s*\(([^)]+)\)/i);
    if (!columnsMatch) throw new Error('Invalid INSERT query format');

    const columns = columnsMatch[1].split(',').map(col => col.trim());
    const placeholders = columnsMatch[2].split(',').map(ph => ph.trim());

    // Create new record
    const newRecord: any = {};
    columns.forEach((column, index) => {
      const placeholder = placeholders[index];
      if (placeholder.startsWith('$')) {
        const paramIndex = parseInt(placeholder.replace('$', '')) - 1;
        newRecord[column] = params[paramIndex];
      } else {
        newRecord[column] = placeholder.replace(/'/g, '');
      }
    });

    // Add ID if not provided
    if (!newRecord.id) {
      newRecord.id = this.nextIds[tableName]++;
    }

    // Add timestamp if not provided
    if (!newRecord.createdAt && tableName === 'orders') {
      newRecord.createdAt = new Date().toISOString().split('T')[0];
    }

    // Add to data
    this.data[tableName].push(newRecord);

    return newRecord;
  }

  private handleUpdateQuery(query: string, params: any[]): any {
    const tableMatch = query.match(/update\s+(\w+)/i);
    if (!tableMatch) throw new Error('Invalid UPDATE query');

    const tableName = tableMatch[1] as keyof typeof this.data;
    if (!this.data[tableName]) throw new Error(`Unknown table: ${tableName}`);

    // Extract SET clause
    const setMatch = query.match(/set\s+(.+?)\s+where/i);
    if (!setMatch) throw new Error('Invalid UPDATE query format');

    const setClause = setMatch[1];
    const setPairs = setClause.split(',').map(pair => pair.trim());

    // Extract WHERE clause
    const whereMatch = query.match(/where\s+(.+?)(?:\s+returning|$)/i);
    if (!whereMatch) throw new Error('Invalid UPDATE query format');

    const whereClause = whereMatch[1];
    const whereConditions = whereClause.split(/\s+and\s+/i);

    // Find records to update
    const recordsToUpdate = this.data[tableName].filter(record => {
      return whereConditions.every(condition => {
        const [field, operator, value] = condition.trim().split(/\s+/);

        if (operator === '=') {
          const paramIndex = parseInt(value.replace('$', '')) - 1;
          return record[field] === params[paramIndex];
        }

        return true;
      });
    });

    if (recordsToUpdate.length === 0) {
      throw new Error('No records found to update');
    }

    // Update records
    const updatedRecords = recordsToUpdate.map(record => {
      const updatedRecord = { ...record };

      setPairs.forEach(pair => {
        const [field, value] = pair.split('=').map(part => part.trim());

        if (value.startsWith('$')) {
          const paramIndex = parseInt(value.replace('$', '')) - 1;
          updatedRecord[field] = params[paramIndex];
        } else {
          updatedRecord[field] = value.replace(/'/g, '');
        }
      });

      // Update in data array
      const index = this.data[tableName].findIndex(r => r.id === record.id);
      if (index !== -1) {
        this.data[tableName][index] = updatedRecord;
      }

      return updatedRecord;
    });

    return updatedRecords.length === 1 ? updatedRecords[0] : updatedRecords;
  }

  private handleDeleteQuery(query: string, params: any[]): any {
    const tableMatch = query.match(/delete\s+from\s+(\w+)/i);
    if (!tableMatch) throw new Error('Invalid DELETE query');

    const tableName = tableMatch[1] as keyof typeof this.data;
    if (!this.data[tableName]) throw new Error(`Unknown table: ${tableName}`);

    // Extract WHERE clause
    const whereMatch = query.match(/where\s+(.+?)(?:\s+returning|$)/i);
    if (!whereMatch) throw new Error('Invalid DELETE query format');

    const whereClause = whereMatch[1];
    const whereConditions = whereClause.split(/\s+and\s+/i);

    // Find records to delete
    const recordsToDelete = this.data[tableName].filter(record => {
      return whereConditions.every(condition => {
        const [field, operator, value] = condition.trim().split(/\s+/);

        if (operator === '=') {
          const paramIndex = parseInt(value.replace('$', '')) - 1;
          return record[field] === params[paramIndex];
        }

        return true;
      });
    });

    if (recordsToDelete.length === 0) {
      throw new Error('No records found to delete');
    }

    // Delete records
    recordsToDelete.forEach(record => {
      const index = this.data[tableName].findIndex(r => r.id === record.id);
      if (index !== -1) {
        this.data[tableName].splice(index, 1);
      }
    });

    return recordsToDelete.length === 1 ? recordsToDelete[0] : recordsToDelete;
  }

  // Get current data for debugging
  getData() {
    return this.data;
  }
}

// Database instance
const db = new MockDatabase();

// Validation schema for mutation requests
const mutationSchema = {
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

async function handleMutation(request: NextRequest) {
  const body = await request.json();

  // Validate request
  const query = mutationSchema.query(body.query);
  const params = mutationSchema.params(body.params);

  try {
    // Execute mutation
    const result = await db.mutate(query, params);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    throw new Error(`Database mutation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export the handler with middleware
export const POST = withCors(
  withValidation(
    withErrorHandler(handleMutation)
  )
);
