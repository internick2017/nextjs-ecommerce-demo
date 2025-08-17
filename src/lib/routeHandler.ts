import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandler,
  withLogging,
  withRateLimit,
  withValidation,
  withAuth,
  withCors,
  compose
} from './apiErrorHandler';
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  validateRequired,
  validateEmail,
  validatePositiveNumber,
  validateStringLength
} from './errorHandler';

// Generic CRUD interface
export interface CrudEntity {
  id: string | number;
  [key: string]: any;
}

// CRUD operations interface
export interface CrudOperations<T extends CrudEntity> {
  create: (data: Omit<T, 'id'>) => Promise<T>;
  read: (id: string | number) => Promise<T | null>;
  readAll: (filters?: Record<string, any>) => Promise<T[]>;
  update: (id: string | number, data: Partial<T>) => Promise<T>;
  delete: (id: string | number) => Promise<boolean>;
  exists: (id: string | number) => Promise<boolean>;
}

// Pagination interface
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Search and filter interface
export interface SearchFilters {
  search?: string;
  filters?: Record<string, any>;
  pagination?: PaginationOptions;
}

// Route handler configuration
export interface RouteHandlerConfig {
  enableAuth?: boolean;
  enableCors?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  validation?: {
    required?: string[];
    rules?: Record<string, (value: any) => boolean>;
  };
}

// Base route handler class
export abstract class BaseRouteHandler<T extends CrudEntity> {
  protected operations: CrudOperations<T>;
  protected config: RouteHandlerConfig;

  constructor(operations: CrudOperations<T>, config: RouteHandlerConfig = {}) {
    this.operations = operations;
    this.config = {
      enableAuth: true,
      enableCors: true,
      rateLimit: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
      ...config
    };
  }

  // Validation helpers
  protected validateEntity(data: any): Partial<T> {
    const validated: Partial<T> = {};

    // Required fields validation
    if (this.config.validation?.required) {
      for (const field of this.config.validation.required) {
        validateRequired(data[field], field);
        validated[field as keyof T] = data[field];
      }
    }

    // Custom rules validation
    if (this.config.validation?.rules) {
      for (const [field, rule] of Object.entries(this.config.validation.rules)) {
        if (data[field] !== undefined && !rule(data[field])) {
          throw new ValidationError(`Invalid value for ${field}`);
        }
        if (data[field] !== undefined) {
          validated[field as keyof T] = data[field];
        }
      }
    }

    return validated;
  }

  // Pagination helper
  protected paginateData<T>(data: T[], options: PaginationOptions): PaginatedResponse<T> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'asc' } = options;

    let processedData = [...data];

    // Sort data if sortBy is provided
    if (sortBy) {
      processedData.sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];

        if (sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    // Calculate pagination
    const totalItems = processedData.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = processedData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  // Search helper
  protected searchData<T>(data: T[], searchTerm: string, searchFields: string[]): T[] {
    if (!searchTerm) return data;

    const lowerSearchTerm = searchTerm.toLowerCase();

    return data.filter(item => {
      return searchFields.some(field => {
        const value = (item as any)[field];
        return value && String(value).toLowerCase().includes(lowerSearchTerm);
      });
    });
  }

  // Create middleware stack
  protected createMiddlewareStack(handler: Function) {
    let middlewareStack = handler;

    // Add error handling
    middlewareStack = withErrorHandler(middlewareStack);

    // Add logging
    middlewareStack = withLogging(middlewareStack);

    // Add rate limiting
    if (this.config.rateLimit) {
      middlewareStack = withRateLimit(
        this.config.rateLimit.maxRequests,
        this.config.rateLimit.windowMs
      )(middlewareStack);
    }

    // Add authentication
    if (this.config.enableAuth) {
      middlewareStack = withAuth(middlewareStack);
    }

    // Add CORS
    if (this.config.enableCors) {
      middlewareStack = withCors()(middlewareStack);
    }

    return middlewareStack;
  }

  // Abstract methods to be implemented by subclasses
  abstract getHandler(): (request: NextRequest) => Promise<NextResponse>;
  abstract postHandler(): (request: NextRequest) => Promise<NextResponse>;
  abstract putHandler(): (request: NextRequest) => Promise<NextResponse>;
  abstract deleteHandler(): (request: NextRequest) => Promise<NextResponse>;
  abstract patchHandler(): (request: NextRequest) => Promise<NextResponse>;
}

// Generic CRUD route handler
export class CrudRouteHandler<T extends CrudEntity> extends BaseRouteHandler<T> {
  private entityName: string;
  private searchFields: string[];

  constructor(
    operations: CrudOperations<T>,
    entityName: string,
    searchFields: string[] = [],
    config: RouteHandlerConfig = {}
  ) {
    super(operations, config);
    this.entityName = entityName;
    this.searchFields = searchFields;
  }

  // GET - Read all or single entity
  getHandler(): (request: NextRequest) => Promise<NextResponse> {
    return this.createMiddlewareStack(async (request: NextRequest) => {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const sortBy = searchParams.get('sortBy') || undefined;
      const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

      if (id) {
        // Get single entity
        const entity = await this.operations.read(id);
        if (!entity) {
          throw new NotFoundError(`${this.entityName} with ID ${id}`);
        }
        return NextResponse.json({
          success: true,
          data: entity,
          message: `${this.entityName} retrieved successfully`
        });
      } else {
        // Get all entities with pagination and search
        let entities = await this.operations.readAll();

        // Apply search if provided
        if (search && this.searchFields.length > 0) {
          entities = this.searchData(entities, search, this.searchFields);
        }

        // Apply pagination
        const paginatedResult = this.paginateData(entities, {
          page,
          limit,
          sortBy,
          sortOrder
        });

        return NextResponse.json({
          success: true,
          data: paginatedResult.data,
          pagination: paginatedResult.pagination,
          message: `${this.entityName}s retrieved successfully`
        });
      }
    });
  }

  // POST - Create new entity
  postHandler(): (request: NextRequest) => Promise<NextResponse> {
    return this.createMiddlewareStack(async (request: NextRequest) => {
      const body = await request.json();

      // Validate input data
      const validatedData = this.validateEntity(body);

      // Check if entity already exists (if unique constraints apply)
      if (validatedData.id && await this.operations.exists(validatedData.id)) {
        throw new ConflictError(`${this.entityName} with this ID already exists`);
      }

      // Create entity
      const newEntity = await this.operations.create(validatedData as Omit<T, 'id'>);

      return NextResponse.json({
        success: true,
        data: newEntity,
        message: `${this.entityName} created successfully`
      }, { status: 201 });
    });
  }

  // PUT - Update entity (full update)
  putHandler(): (request: NextRequest) => Promise<NextResponse> {
    return this.createMiddlewareStack(async (request: NextRequest) => {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      const body = await request.json();

      if (!id) {
        throw new ValidationError('ID is required for update');
      }

      // Check if entity exists
      if (!await this.operations.exists(id)) {
        throw new NotFoundError(`${this.entityName} with ID ${id}`);
      }

      // Validate input data
      const validatedData = this.validateEntity(body);

      // Update entity
      const updatedEntity = await this.operations.update(id, validatedData);

      return NextResponse.json({
        success: true,
        data: updatedEntity,
        message: `${this.entityName} updated successfully`
      });
    });
  }

  // PATCH - Partial update
  patchHandler(): (request: NextRequest) => Promise<NextResponse> {
    return this.createMiddlewareStack(async (request: NextRequest) => {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      const body = await request.json();

      if (!id) {
        throw new ValidationError('ID is required for update');
      }

      // Check if entity exists
      if (!await this.operations.exists(id)) {
        throw new NotFoundError(`${this.entityName} with ID ${id}`);
      }

      // Validate input data (only provided fields)
      const validatedData = this.validateEntity(body);

      // Update entity
      const updatedEntity = await this.operations.update(id, validatedData);

      return NextResponse.json({
        success: true,
        data: updatedEntity,
        message: `${this.entityName} updated successfully`
      });
    });
  }

  // DELETE - Delete entity
  deleteHandler(): (request: NextRequest) => Promise<NextResponse> {
    return this.createMiddlewareStack(async (request: NextRequest) => {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');

      if (!id) {
        throw new ValidationError('ID is required for deletion');
      }

      // Check if entity exists
      if (!await this.operations.exists(id)) {
        throw new NotFoundError(`${this.entityName} with ID ${id}`);
      }

      // Delete entity
      const deleted = await this.operations.delete(id);

      if (!deleted) {
        throw new Error(`Failed to delete ${this.entityName}`);
      }

      return NextResponse.json({
        success: true,
        message: `${this.entityName} deleted successfully`
      });
    });
  }
}

// Route factory for creating CRUD routes
export function createCrudRoutes<T extends CrudEntity>(
  operations: CrudOperations<T>,
  entityName: string,
  searchFields: string[] = [],
  config: RouteHandlerConfig = {}
) {
  const handler = new CrudRouteHandler(operations, entityName, searchFields, config);

  return {
    GET: handler.getHandler(),
    POST: handler.postHandler(),
    PUT: handler.putHandler(),
    PATCH: handler.patchHandler(),
    DELETE: handler.deleteHandler()
  };
}

// Utility functions for common validations
export const validationRules = {
  email: (value: any) => {
    if (typeof value !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  phone: (value: any) => {
    if (typeof value !== 'string') return false;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/\s/g, ''));
  },

  url: (value: any) => {
    if (typeof value !== 'string') return false;
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
    if (typeof value !== 'string') return false;
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

// Route response helpers
export const routeHelpers = {
  success: (data: any, message: string = 'Success', status: number = 200) => {
    return NextResponse.json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    }, { status });
  },

  error: (message: string, status: number = 400, details?: any) => {
    return NextResponse.json({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    }, { status });
  },

  paginated: <T>(
    data: T[],
    pagination: PaginatedResponse<T>['pagination'],
    message: string = 'Data retrieved successfully'
  ) => {
    return NextResponse.json({
      success: true,
      data,
      pagination,
      message,
      timestamp: new Date().toISOString()
    });
  }
};
