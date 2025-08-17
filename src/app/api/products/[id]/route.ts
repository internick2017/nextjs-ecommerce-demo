import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, withLogging, withRateLimit, compose } from '../../../../lib/apiErrorHandler';
import { ValidationError, NotFoundError, validatePositiveNumber } from '../../../../lib/errorHandler';

// Mock products database (same as in the main products route)
const products = [
  {
    id: 1,
    name: "Premium Headphones",
    price: 299.99,
    image: "/next.svg",
    description: "High-quality wireless headphones with noise cancellation",
    category: "Electronics",
    inStock: true,
    stock: 15,
    features: [
      "Active Noise Cancellation",
      "30-hour battery life",
      "Bluetooth 5.0",
      "Premium leather padding"
    ],
    specifications: {
      "Driver Size": "40mm",
      "Frequency Response": "20Hz - 20kHz",
      "Impedance": "32 ohms",
      "Weight": "250g"
    }
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 199.99,
    image: "/vercel.svg",
    description: "Feature-rich smartwatch with health tracking",
    category: "Electronics",
    inStock: true,
    stock: 8,
    features: [
      "Heart rate monitoring",
      "GPS tracking",
      "Water resistant",
      "7-day battery life"
    ],
    specifications: {
      "Display": "1.4\" AMOLED",
      "Battery": "300mAh",
      "Water Rating": "5ATM",
      "Connectivity": "Bluetooth 5.0, WiFi"
    }
  },
  {
    id: 3,
    name: "Laptop Stand",
    price: 79.99,
    image: "/globe.svg",
    description: "Ergonomic aluminum laptop stand for better posture",
    category: "Accessories",
    inStock: true,
    stock: 25,
    features: [
      "Adjustable height",
      "Aluminum construction",
      "Heat dissipation",
      "Portable design"
    ],
    specifications: {
      "Material": "Aluminum alloy",
      "Weight": "1.2kg",
      "Compatibility": "11-17 inch laptops",
      "Adjustability": "6 height levels"
    }
  }
];

// GET /api/products/[id] - Get a specific product by ID
const getHandler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id } = await params;
  const productId = parseInt(id);

  // Validate ID
  if (isNaN(productId)) {
    throw new ValidationError('Product ID must be a valid number');
  }

  // Find product
  const product = products.find(p => p.id === productId);

  if (!product) {
    throw new NotFoundError(`Product with ID ${productId} does not exist`);
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return NextResponse.json({
    success: true,
    data: product,
    message: 'Product retrieved successfully'
  });
};

export const GET = compose(
  withLogging,
  withRateLimit(100, 15 * 60 * 1000), // 100 requests per 15 minutes
  withErrorHandler
)((request: NextRequest, ...args: unknown[]) => {
  const params = args[0] as { params: { id: string } };
  return getHandler(request, params);
});

// PUT /api/products/[id] - Update a specific product
const putHandler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id } = await params;
  const productId = parseInt(id);
  const body = await request.json();

  // Validate ID
  if (isNaN(productId)) {
    throw new ValidationError('Product ID must be a valid number');
  }

  // Find product index
  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex === -1) {
    throw new NotFoundError(`Product with ID ${productId} does not exist`);
  }

  // Validate price if provided
  if (body.price !== undefined) {
    const price = parseFloat(body.price);
    validatePositiveNumber(price, 'price');
    body.price = price;
  }

  // Update product (merge with existing data)
  const updatedProduct = {
    ...products[productIndex],
    ...body,
    id: productId // Ensure ID cannot be changed
  };

  // Update in array
  products[productIndex] = updatedProduct;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));

  return NextResponse.json({
    success: true,
    data: updatedProduct,
    message: 'Product updated successfully'
  });
};

export const PUT = compose(
  withLogging,
  withRateLimit(30, 15 * 60 * 1000), // 30 requests per 15 minutes
  withErrorHandler
)((request: NextRequest, ...args: unknown[]) => {
  const params = args[0] as { params: { id: string } };
  return putHandler(request, params);
});

// DELETE /api/products/[id] - Delete a specific product
const deleteHandler = async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id } = params;
  const productId = parseInt(id);

  // Validate ID
  if (isNaN(productId)) {
    throw new ValidationError('Product ID must be a valid number');
  }

  // Find product index
  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex === -1) {
    throw new NotFoundError(`Product with ID ${productId} does not exist`);
  }

  // Store deleted product for response
  const deletedProduct = products[productIndex];

  // Remove from array
  products.splice(productIndex, 1);

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return NextResponse.json({
    success: true,
    data: deletedProduct,
    message: 'Product deleted successfully'
  });
};

export const DELETE = compose(
  withLogging,
  withRateLimit(20, 15 * 60 * 1000), // 20 requests per 15 minutes
  withErrorHandler
)((request: NextRequest, ...args: unknown[]) => {
  const params = args[0] as { params: { id: string } };
  return deleteHandler(request, params);
});

// PATCH /api/products/[id] - Partially update a product (e.g., just stock)
const patchHandler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id } = params;
  const productId = parseInt(id);
  const body = await request.json();

  // Validate ID
  if (isNaN(productId)) {
    throw new ValidationError('Product ID must be a valid number');
  }

  // Find product index
  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex === -1) {
    throw new NotFoundError(`Product with ID ${productId} does not exist`);
  }

  // Common patch operations
  if (body.action === 'updateStock') {
    const { quantity } = body;
    if (typeof quantity !== 'number' || quantity < 0) {
      throw new ValidationError('Quantity must be a non-negative number');
    }

    products[productIndex].stock = quantity;
    products[productIndex].inStock = quantity > 0;
  } else if (body.action === 'toggleAvailability') {
    products[productIndex].inStock = !products[productIndex].inStock;
  } else {
    // General patch - only update provided fields
    Object.keys(body).forEach(key => {
      if (key !== 'id' && body[key] !== undefined) {
        (products[productIndex] as Record<string, unknown>)[key] = body[key];
      }
    });
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  return NextResponse.json({
    success: true,
    data: products[productIndex],
    message: 'Product updated successfully'
  });
};

export const PATCH = compose(
  withLogging,
  withRateLimit(30, 15 * 60 * 1000), // 30 requests per 15 minutes
  withErrorHandler
)((request: NextRequest, ...args: unknown[]) => {
  const params = args[0] as { params: { id: string } };
  return patchHandler(request, params);
});
