import { createCrudRoutes, validationRules } from '../../../lib/routeHandler';
import { categoryOperations, Category } from '../../../lib/dataLayer';

// Category validation configuration
const categoryValidationConfig = {
  required: ['name', 'description'],
  rules: {
    name: validationRules.minLength(2),
    description: validationRules.minLength(5),
    isActive: validationRules.boolean
  }
};

// Create CRUD routes for categories
export const { GET, POST, PUT, PATCH, DELETE } = createCrudRoutes<Category>(
  categoryOperations,
  'Category',
  ['name', 'description'], // Search fields
  {
    enableAuth: false, // Categories can be read without auth
    enableCors: true,
    rateLimit: {
      maxRequests: 80,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    validation: categoryValidationConfig
  }
);
