# Static & Dynamic Parameters Guide

This document provides a comprehensive guide to handling static and dynamic parameters in Next.js App Router with advanced validation, transformation, and generation capabilities.

## Overview

The static and dynamic parameters system provides robust parameter handling for Next.js applications, including validation, transformation, static generation, and comprehensive error handling.

## Architecture

### Core Components

1. **ParamsHandler** (`src/lib/paramsHandler.ts`)
   - Parameter validation utilities
   - Type transformation functions
   - Static parameter generation
   - Schema-based validation

2. **Product Pages** (`src/app/(shop)/products/[id]/page.tsx`)
   - Dynamic product pages with validation
   - Static parameter generation
   - SEO-optimized metadata

3. **Blog Posts** (`src/app/blog/[year]/[month]/[slug]/page.tsx`)
   - Nested dynamic parameters
   - Complex validation schemas
   - Multi-level routing

4. **Params Demo** (`src/app/params-demo/page.tsx`)
   - Interactive parameter testing
   - Validation demonstration
   - Utility showcase

## Static Parameters

### Basic Static Parameter Generation
```typescript
// Generate static parameters for products
export async function generateStaticParams() {
  return await staticParamsUtils.generateProductParams();
}

// Generated parameters
[
  { id: '1', category: 'electronics', slug: 'laptop' },
  { id: '2', category: 'electronics', slug: 'phone' },
  { id: '3', category: 'clothing', slug: 'shirt' },
  { id: '4', category: 'clothing', slug: 'pants' }
]
```

### Static Parameter Utilities
```typescript
import { staticParamsUtils } from '../../../lib/paramsHandler';

// Generate different types of static parameters
const productParams = await staticParamsUtils.generateProductParams();
const userParams = await staticParamsUtils.generateUserParams();
const blogParams = await staticParamsUtils.generateBlogParams();
const categoryParams = await staticParamsUtils.generateCategoryParams();
```

### Custom Static Parameter Generation
```typescript
// Custom static parameter generator
const customParams = {
  generateStaticParams: async () => {
    const data = await fetchData();
    return data.map(item => ({
      id: item.id.toString(),
      category: item.category,
      slug: item.slug
    }));
  }
};
```

## Dynamic Parameters

### Basic Dynamic Parameter Handling
```typescript
// Dynamic product page
const ProductPage = async ({ params }: { params: { id: string } }) => {
  // Process and validate parameters
  const result = await processParams(params, paramSchemas.product);

  if (!result.isValid) {
    notFound();
  }

  const { id } = result.data;
  // Use validated and transformed parameters
};
```

### Parameter Validation
```typescript
// Validate required parameters
const isValid = paramUtils.validateRequired(params, ['id', 'category']);

// Validate parameter types
const isNumber = paramUtils.validateType(params.id, 'number');
const isString = paramUtils.validateType(params.name, 'string');
const isBoolean = paramUtils.validateType(params.active, 'boolean');

// Validate patterns
const isValidEmail = paramUtils.validatePattern(params.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
const isValidSlug = paramUtils.validatePattern(params.slug, /^[a-z0-9-]+$/);

// Validate ranges
const isValidAge = paramUtils.validateRange(Number(params.age), 0, 120);

// Validate length
const isValidName = paramUtils.validateLength(params.name, 2, 50);
```

### Parameter Transformation
```typescript
// Transform parameter values
const numberId = paramUtils.transformValue(params.id, 'toNumber');
const booleanActive = paramUtils.transformValue(params.active, 'toBoolean');
const arrayTags = paramUtils.transformValue(params.tags, 'toArray');
const lowercaseName = paramUtils.transformValue(params.name, 'toLowerCase');
const uppercaseCode = paramUtils.transformValue(params.code, 'toUpperCase');

// Sanitize parameter values
const sanitizedInput = paramUtils.sanitize(params.userInput);
```

## Parameter Schemas

### Product Schema
```typescript
const productSchema = {
  required: ['id'],
  optional: ['category', 'slug'],
  validate: (params: DynamicParams) => {
    const id = params.id;
    return typeof id === 'string' && /^\d+$/.test(id);
  },
  transform: (params: DynamicParams) => ({
    ...params,
    id: Number(params.id),
    category: params.category || 'general'
  })
};
```

### User Schema
```typescript
const userSchema = {
  required: ['id', 'username'],
  validate: (params: DynamicParams) => {
    const id = params.id;
    const username = params.username;
    return typeof id === 'string' && typeof username === 'string' && username.length >= 3;
  },
  transform: (params: DynamicParams) => ({
    ...params,
    id: Number(params.id),
    username: paramUtils.sanitize(params.username as string)
  })
};
```

### Blog Schema
```typescript
const blogSchema = {
  required: ['year', 'month', 'slug'],
  validate: (params: DynamicParams) => {
    const year = params.year;
    const month = params.month;
    const slug = params.slug;

    return (
      typeof year === 'string' && /^\d{4}$/.test(year) &&
      typeof month === 'string' && /^\d{2}$/.test(month) &&
      typeof slug === 'string' && slug.length > 0
    );
  },
  transform: (params: DynamicParams) => ({
    ...params,
    year: Number(params.year),
    month: Number(params.month),
    slug: paramUtils.sanitize(params.slug as string)
  })
};
```

### Search Schema
```typescript
const searchSchema = {
  optional: ['query', 'category', 'page'],
  validate: (params: DynamicParams) => {
    const page = params.page;
    if (page) {
      const pageNum = Number(page);
      return !isNaN(pageNum) && pageNum > 0;
    }
    return true;
  },
  transform: (params: DynamicParams) => ({
    ...params,
    query: params.query ? paramUtils.sanitize(params.query as string) : '',
    category: params.category || 'all',
    page: params.page ? Number(params.page) : 1
  })
};
```

## Parameter Middleware

### withParams HOC
```typescript
import { withParams } from '../../../lib/paramsHandler';

const MyComponent = ({ params }: { params: any }) => {
  return <div>Validated params: {JSON.stringify(params)}</div>;
};

// Wrap component with parameter validation
export default withParams(MyComponent, paramSchemas.product);
```

### Custom Parameter Handler
```typescript
import { ParamsHandler } from '../../../lib/paramsHandler';

const customConfig = {
  required: ['id'],
  validate: (params: DynamicParams) => {
    // Custom validation logic
    return true;
  },
  transform: (params: DynamicParams) => {
    // Custom transformation logic
    return params;
  }
};

const handler = new ParamsHandler(customConfig);
const result = handler.process(params);
```

## Advanced Features

### Parameter Combinations
```typescript
// Generate parameter combinations
const combinations = paramUtils.generateCombinations({
  category: ['electronics', 'clothing'],
  brand: ['apple', 'samsung', 'nike'],
  price: ['low', 'high']
});

// Result:
[
  { category: 'electronics', brand: 'apple', price: 'low' },
  { category: 'electronics', brand: 'apple', price: 'high' },
  { category: 'electronics', brand: 'samsung', price: 'low' },
  // ... more combinations
]
```

### Cached Parameter Processing
```typescript
import { processParams } from '../../../lib/paramsHandler';

// Cached parameter processing
const result = await processParams(params, paramSchemas.product);
```

### Parameter Hooks (Client Components)
```typescript
'use client';

import { useParams, useParamsValidation } from '../../../lib/paramsHandler';

const ClientComponent = () => {
  const params = useParams();
  const validation = useParamsValidation(params, paramSchemas.product);

  if (!validation.isValid) {
    return <div>Invalid parameters</div>;
  }

  return <div>Valid parameters: {JSON.stringify(validation.data)}</div>;
};
```

## Error Handling

### Parameter Validation Errors
```typescript
const result = await processParams(params, paramSchemas.product);

if (!result.isValid) {
  // Handle validation error
  console.error('Parameter validation failed:', result.error);
  notFound(); // Show 404 page
}
```

### Custom Error Handling
```typescript
const customErrorHandler = (error: string) => {
  // Log error
  console.error('Parameter error:', error);

  // Redirect to error page
  redirect('/error?message=' + encodeURIComponent(error));
};
```

## SEO and Metadata

### Dynamic Metadata Generation
```typescript
export async function generateMetadata({
  params
}: {
  params: { id: string }
}): Promise<Metadata> {
  const result = await processParams(params, paramSchemas.product);

  if (!result.isValid) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    };
  }

  const { id } = result.data;
  const product = await getProduct(id);

  return {
    title: `${product.name} - Store`,
    description: product.description,
    keywords: product.tags.join(', '),
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image]
    }
  };
}
```

## Performance Optimization

### Static Generation
```typescript
// Generate static pages for all products
export async function generateStaticParams() {
  const products = await getAllProducts();

  return products.map(product => ({
    id: product.id.toString(),
    category: product.category,
    slug: product.slug
  }));
}
```

### Incremental Static Regeneration
```typescript
// Revalidate pages periodically
export const revalidate = 3600; // Revalidate every hour

// Or use dynamic revalidation
export async function generateStaticParams() {
  const products = await getProductsWithCache();
  return products.map(p => ({ id: p.id.toString() }));
}
```

## Testing

### Parameter Testing
```typescript
// Test parameter validation
const testParams = { id: '1', category: 'electronics' };
const handler = new ParamsHandler(paramSchemas.product);
const result = handler.process(testParams);

console.log('Validation result:', result.isValid);
console.log('Processed data:', result.data);
```

### Using the Demo Page
1. Navigate to `/params-demo`
2. Test different parameter combinations
3. Observe validation results
4. Explore parameter utilities
5. View generated static parameters

## Best Practices

### Parameter Validation
1. **Always validate required parameters** - Check for missing required fields
2. **Use type validation** - Ensure parameters are of expected types
3. **Implement pattern validation** - Use regex for format validation
4. **Sanitize user input** - Clean and escape parameter values
5. **Handle edge cases** - Consider boundary conditions and invalid inputs

### Static Generation
1. **Generate for popular content** - Pre-generate frequently accessed pages
2. **Use incremental regeneration** - Update content periodically
3. **Optimize generation time** - Cache data and parallelize generation
4. **Handle large datasets** - Use pagination and chunking for large parameter sets

### Performance
1. **Cache parameter processing** - Use React cache for expensive operations
2. **Lazy load parameters** - Generate parameters on-demand when possible
3. **Optimize bundle size** - Keep parameter utilities lightweight
4. **Monitor performance** - Track parameter processing times

### Security
1. **Validate all inputs** - Never trust user-provided parameters
2. **Sanitize output** - Clean parameters before using in queries
3. **Use parameterized queries** - Prevent injection attacks
4. **Implement rate limiting** - Protect against parameter abuse

## Configuration

### Environment Variables
```env
# Parameter validation
NEXT_PUBLIC_ENABLE_PARAM_VALIDATION=true
NEXT_PUBLIC_PARAM_CACHE_TTL=3600

# Static generation
NEXT_PUBLIC_STATIC_GENERATION_LIMIT=1000
NEXT_PUBLIC_ENABLE_INCREMENTAL_REVALIDATION=true

# Error handling
NEXT_PUBLIC_PARAM_ERROR_REDIRECT=/error
NEXT_PUBLIC_ENABLE_PARAM_LOGGING=true
```

### Next.js Configuration
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    // Enable advanced parameter features
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  async generateStaticParams() {
    // Global static parameter generation
    return [];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Parameter-Validation',
            value: 'enabled',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

## Conclusion

The static and dynamic parameters system provides comprehensive parameter handling for Next.js applications with advanced validation, transformation, and generation capabilities. It enables robust, performant, and secure parameter processing for modern web applications.

For more information, refer to the demo page at `/params-demo` and the individual component documentation.
