import { createCrudRoutes, validationRules } from '../../../lib/routeHandler';
import { userOperations, User } from '../../../lib/dataLayer';

// User validation configuration
const userValidationConfig = {
  required: ['email', 'name', 'role'],
  rules: {
    email: validationRules.email,
    role: validationRules.enum(['admin', 'user', 'guest']),
    phone: validationRules.phone,
    name: validationRules.minLength(2)
  }
};

// Create CRUD routes for users
export const { GET, POST, PUT, PATCH, DELETE } = createCrudRoutes<User>(
  userOperations,
  'User',
  ['email', 'name', 'role'], // Search fields
  {
    enableAuth: true,
    enableCors: true,
    rateLimit: {
      maxRequests: 50,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    validation: userValidationConfig
  }
);
