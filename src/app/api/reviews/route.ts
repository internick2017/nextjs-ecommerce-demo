import { createCrudRoutes, validationRules } from '../../../lib/routeHandler';
import { reviewOperations, Review } from '../../../lib/dataLayer';

// Review validation configuration
const reviewValidationConfig = {
  required: ['productId', 'userId', 'rating', 'title', 'comment'],
  rules: {
    rating: validationRules.range(1, 5),
    title: validationRules.minLength(3),
    comment: validationRules.minLength(10),
    isVerified: validationRules.boolean
  }
};

// Create CRUD routes for reviews
export const { GET, POST, PUT, PATCH, DELETE } = createCrudRoutes<Review>(
  reviewOperations,
  'Review',
  ['title', 'comment', 'productId', 'userId'], // Search fields
  {
    enableAuth: true, // Reviews require authentication
    enableCors: true,
    rateLimit: {
      maxRequests: 40,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    validation: reviewValidationConfig
  }
);
