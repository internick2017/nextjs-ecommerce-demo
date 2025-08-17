import { createCrudRoutes, validationRules } from '../../../lib/routeHandler';
import { productOperations, Product } from '../../../lib/dataLayer';

// Product validation configuration
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

// Create CRUD routes for products
export const { GET, POST, PUT, PATCH, DELETE } = createCrudRoutes<Product>(
  productOperations,
  'Product',
  ['name', 'description', 'category', 'tags'], // Search fields
  {
    enableAuth: false, // Products can be read without auth
    enableCors: true,
    rateLimit: {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    validation: productValidationConfig
  }
);