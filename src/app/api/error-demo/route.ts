import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandler,
  withLogging,
  withRateLimit,
  withValidation,
  compose
} from '../../../lib/apiErrorHandler';
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  NetworkError,
  DatabaseError,
  ConflictError,
  validateRequired,
  validateEmail,
  validatePositiveNumber,
  validateStringLength
} from '../../../lib/errorHandler';

// Validation schema for user data
interface UserData {
  name: string;
  email: string;
  age: number;
  bio: string;
}

function validateUserData(data: unknown): UserData {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('Request body must be an object');
  }

  const userData = data as Record<string, unknown>;

  // Validate required fields
  validateRequired(userData.name, 'name');
  validateRequired(userData.email, 'email');
  validateRequired(userData.age, 'age');
  validateRequired(userData.bio, 'bio');

  // Validate field types and constraints
  if (typeof userData.name !== 'string') {
    throw new ValidationError('Name must be a string');
  }

  validateStringLength(userData.name, 'name', 2, 50);
  validateEmail(userData.email as string);

  if (typeof userData.age !== 'number') {
    throw new ValidationError('Age must be a number');
  }

  validatePositiveNumber(userData.age, 'age');

  if (userData.age < 13 || userData.age > 120) {
    throw new ValidationError('Age must be between 13 and 120');
  }

  if (typeof userData.bio !== 'string') {
    throw new ValidationError('Bio must be a string');
  }

  validateStringLength(userData.bio, 'bio', 10, 500);

  return userData as UserData;
}

// GET /api/error-demo - Demonstrate different error types
const getHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const errorType = searchParams.get('type');

  // Simulate different error types based on query parameter
  switch (errorType) {
    case 'validation':
      throw new ValidationError('Invalid input data', {
        field: 'email',
        value: 'invalid-email',
        type: 'email_format'
      });

    case 'not-found':
      throw new NotFoundError('User profile');

    case 'unauthorized':
      throw new UnauthorizedError('Please log in to access this resource');

    case 'forbidden':
      throw new ForbiddenError('You do not have permission to access this resource');

    case 'conflict':
      throw new ConflictError('User with this email already exists', {
        email: 'user@example.com',
        existingUserId: 123
      });

    case 'rate-limit':
      throw new RateLimitError('Too many requests', 30);

    case 'network':
      throw new NetworkError('Failed to connect to external service');

    case 'database':
      throw new DatabaseError('Database connection timeout');

    case 'system':
      throw new Error('Unexpected system error');

    case 'timeout':
      // Simulate a timeout
      await new Promise(resolve => setTimeout(resolve, 10000));
      return NextResponse.json({ message: 'This should timeout' });

    default:
      return NextResponse.json({
        success: true,
        message: 'Error demo endpoint',
        availableErrors: [
          'validation',
          'not-found',
          'unauthorized',
          'forbidden',
          'conflict',
          'rate-limit',
          'network',
          'database',
          'system',
          'timeout'
        ],
        usage: 'Add ?type=<error-type> to trigger specific errors'
      });
  }
};

export const GET = compose(
  withLogging,
  withRateLimit(20, 15 * 60 * 1000), // 20 requests per 15 minutes
  withErrorHandler
)(getHandler);

// POST /api/error-demo - Demonstrate validation errors
const postHandler = async (request: NextRequest, validatedData: UserData) => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simulate some business logic that might fail
  if (validatedData.email.includes('blocked')) {
    throw new ForbiddenError('This email domain is blocked');
  }

  if (validatedData.age < 18) {
    throw new ValidationError('User must be at least 18 years old', {
      field: 'age',
      value: validatedData.age,
      minimumAge: 18
    });
  }

  // Simulate database conflict
  if (validatedData.email === 'existing@example.com') {
    throw new ConflictError('User with this email already exists', {
      email: validatedData.email,
      existingUserId: 456
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: Math.floor(Math.random() * 1000),
      ...validatedData,
      createdAt: new Date().toISOString()
    },
    message: 'User created successfully'
  });
};

export const POST = compose(
  withLogging,
  withRateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
  withValidation(validateUserData),
  withErrorHandler
)(postHandler);

// PUT /api/error-demo - Demonstrate update errors
const putHandler = async (request: NextRequest) => {
  const body = await request.json();
  const { userId, action } = body;

  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Simulate different update scenarios
  switch (action) {
    case 'delete':
      if (userId === '999') {
        throw new NotFoundError(`User with ID ${userId}`);
      }
      if (userId === 'admin') {
        throw new ForbiddenError('Cannot delete admin user');
      }
      break;

    case 'update':
      if (userId === 'locked') {
        throw new ForbiddenError('User account is locked');
      }
      break;

    case 'promote':
      if (userId === 'guest') {
        throw new UnauthorizedError('Guest users cannot be promoted');
      }
      break;

    default:
      throw new ValidationError('Invalid action specified', {
        action,
        validActions: ['delete', 'update', 'promote']
      });
  }

  return NextResponse.json({
    success: true,
    message: `Action '${action}' completed successfully for user ${userId}`
  });
};

export const PUT = compose(
  withLogging,
  withRateLimit(15, 15 * 60 * 1000), // 15 requests per 15 minutes
  withErrorHandler
)(putHandler);

// DELETE /api/error-demo - Demonstrate deletion errors
const deleteHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get('id');

  if (!resourceId) {
    throw new ValidationError('Resource ID is required');
  }

  // Simulate different deletion scenarios
  if (resourceId === 'protected') {
    throw new ForbiddenError('This resource is protected and cannot be deleted');
  }

  if (resourceId === 'not-found') {
    throw new NotFoundError(`Resource with ID ${resourceId}`);
  }

  if (resourceId === 'in-use') {
    throw new ConflictError('Cannot delete resource that is currently in use', {
      resourceId,
      dependentResources: ['order-123', 'order-456']
    });
  }

  if (resourceId === 'system') {
    throw new DatabaseError('Failed to delete resource due to database constraint');
  }

  return NextResponse.json({
    success: true,
    message: `Resource ${resourceId} deleted successfully`
  });
};

export const DELETE = compose(
  withLogging,
  withRateLimit(5, 15 * 60 * 1000), // 5 requests per 15 minutes (deletions are more restricted)
  withErrorHandler
)(deleteHandler);
