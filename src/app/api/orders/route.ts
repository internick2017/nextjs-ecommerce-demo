import { createCrudRoutes, validationRules } from '../../../lib/routeHandler';
import { orderOperations, Order } from '../../../lib/dataLayer';

// Order validation configuration
const orderValidationConfig = {
  required: ['userId', 'items', 'total', 'shippingAddress', 'paymentMethod'],
  rules: {
    total: validationRules.positiveNumber,
    status: validationRules.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    paymentStatus: validationRules.enum(['pending', 'paid', 'failed'])
  }
};

// Create CRUD routes for orders
export const { GET, POST, PUT, PATCH, DELETE } = createCrudRoutes<Order>(
  orderOperations,
  'Order',
  ['status', 'paymentStatus', 'userId'], // Search fields
  {
    enableAuth: true, // Orders require authentication
    enableCors: true,
    rateLimit: {
      maxRequests: 30,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    validation: orderValidationConfig
  }
);
