import { notFound } from 'next/navigation';
import { cache } from 'react';

// Parameter types
export interface StaticParams {
  [key: string]: string | string[];
}

export interface DynamicParams {
  [key: string]: string | string[] | undefined;
}

export interface ParamsConfig {
  required?: string[];
  optional?: string[];
  validate?: (params: DynamicParams) => boolean;
  transform?: (params: DynamicParams) => any;
  fallback?: boolean;
  generateStaticParams?: () => Promise<StaticParams[]>;
}

// Parameter validation utilities
export const paramUtils = {
  // Validate required parameters
  validateRequired: (params: DynamicParams, required: string[]): boolean => {
    return required.every(param => {
      const value = params[param];
      return value !== undefined && value !== null && value !== '';
    });
  },

  // Validate parameter types
  validateType: (value: any, type: 'string' | 'number' | 'boolean' | 'array'): boolean => {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return !isNaN(Number(value));
      case 'boolean':
        return value === 'true' || value === 'false';
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  },

  // Validate parameter patterns
  validatePattern: (value: string, pattern: RegExp): boolean => {
    return pattern.test(value);
  },

  // Validate parameter ranges
  validateRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  // Validate parameter length
  validateLength: (value: string, min: number, max: number): boolean => {
    return value.length >= min && value.length <= max;
  },

  // Transform parameter values
  transformValue: (value: any, transform: 'toNumber' | 'toBoolean' | 'toArray' | 'toLowerCase' | 'toUpperCase'): any => {
    switch (transform) {
      case 'toNumber':
        return Number(value);
      case 'toBoolean':
        return value === 'true';
      case 'toArray':
        return Array.isArray(value) ? value : [value];
      case 'toLowerCase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'toUpperCase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      default:
        return value;
    }
  },

  // Sanitize parameter values
  sanitize: (value: string): string => {
    return value
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[&]/g, '&amp;') // Escape ampersands
      .trim();
  },

  // Generate parameter combinations
  generateCombinations: (params: Record<string, string[]>): StaticParams[] => {
    const keys = Object.keys(params);
    const combinations: StaticParams[] = [];

    const generate = (current: StaticParams, index: number) => {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }

      const key = keys[index];
      const values = params[key];

      for (const value of values) {
        current[key] = value;
        generate(current, index + 1);
      }
    };

    generate({}, 0);
    return combinations;
  }
};

// Parameter handler class
export class ParamsHandler {
  private config: ParamsConfig;

  constructor(config: ParamsConfig = {}) {
    this.config = config;
  }

  // Validate parameters
  validate(params: DynamicParams): boolean {
    // Check required parameters
    if (this.config.required && !paramUtils.validateRequired(params, this.config.required)) {
      return false;
    }

    // Run custom validation
    if (this.config.validate && !this.config.validate(params)) {
      return false;
    }

    return true;
  }

  // Transform parameters
  transform(params: DynamicParams): any {
    let transformed = { ...params };

    // Apply transformations
    if (this.config.transform) {
      transformed = this.config.transform(transformed);
    }

    return transformed;
  }

  // Process parameters
  process(params: DynamicParams): { isValid: boolean; data: any; error?: string } {
    try {
      // Validate parameters
      if (!this.validate(params)) {
        return {
          isValid: false,
          data: null,
          error: 'Invalid parameters'
        };
      }

      // Transform parameters
      const data = this.transform(params);

      return {
        isValid: true,
        data
      };
    } catch (error) {
      return {
        isValid: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Generate static parameters
  async generateStaticParams(): Promise<StaticParams[]> {
    if (this.config.generateStaticParams) {
      return await this.config.generateStaticParams();
    }
    return [];
  }
}

// Cached parameter processing
export const processParams = cache(async (
  params: DynamicParams,
  config: ParamsConfig = {}
): Promise<{ isValid: boolean; data: any; error?: string }> => {
  const handler = new ParamsHandler(config);
  return handler.process(params);
});

// Static parameter generation utilities
export const staticParamsUtils = {
  // Generate product parameters
  generateProductParams: cache(async (): Promise<StaticParams[]> => {
    // Simulate fetching product data
    const products = [
      { id: '1', category: 'electronics', slug: 'laptop' },
      { id: '2', category: 'electronics', slug: 'phone' },
      { id: '3', category: 'clothing', slug: 'shirt' },
      { id: '4', category: 'clothing', slug: 'pants' }
    ];

    return products.map(product => ({
      id: product.id,
      category: product.category,
      slug: product.slug
    }));
  }),

  // Generate user parameters
  generateUserParams: cache(async (): Promise<StaticParams[]> => {
    const users = [
      { id: '1', username: 'john' },
      { id: '2', username: 'jane' },
      { id: '3', username: 'bob' }
    ];

    return users.map(user => ({
      id: user.id,
      username: user.username
    }));
  }),

  // Generate blog post parameters
  generateBlogParams: cache(async (): Promise<StaticParams[]> => {
    const posts = [
      { id: '1', year: '2024', month: '01', slug: 'hello-world' },
      { id: '2', year: '2024', month: '01', slug: 'getting-started' },
      { id: '3', year: '2024', month: '02', slug: 'advanced-topics' }
    ];

    return posts.map(post => ({
      id: post.id,
      year: post.year,
      month: post.month,
      slug: post.slug
    }));
  }),

  // Generate category parameters
  generateCategoryParams: cache(async (): Promise<StaticParams[]> => {
    const categories = ['electronics', 'clothing', 'books', 'home', 'sports'];

    return categories.map(category => ({
      category
    }));
  })
};

// Dynamic parameter validation schemas
export const paramSchemas = {
  // Product schema
  product: {
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
  },

  // User schema
  user: {
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
  },

  // Blog post schema
  blog: {
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
  },

  // Search schema
  search: {
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
  }
};

// Parameter middleware
export function withParams<T extends React.ComponentType<any>>(
  Component: T,
  schema: keyof typeof paramSchemas | ParamsConfig
): React.ComponentType<React.ComponentProps<T> & { params: DynamicParams }> {
  const config = typeof schema === 'string' ? paramSchemas[schema] : schema;

  const ParamsComponent = async (props: React.ComponentProps<T> & { params: DynamicParams }) => {
    const { params, ...restProps } = props;

    // Process parameters
    const result = await processParams(params, config);

    if (!result.isValid) {
      notFound();
    }

    return <Component {...restProps} params={result.data} />;
  };

  return ParamsComponent as any;
}

// Parameter hook for client components
export function useParams<T = DynamicParams>(): T {
  // This would be used in client components
  // In a real implementation, this would use Next.js useParams hook
  return {} as T;
}

// Parameter validation hook
export function useParamsValidation<T = any>(
  params: DynamicParams,
  schema: keyof typeof paramSchemas | ParamsConfig
): { isValid: boolean; data: T | null; error?: string } {
  const config = typeof schema === 'string' ? paramSchemas[schema] : schema;
  const handler = new ParamsHandler(config);
  const result = handler.process(params);

  return {
    isValid: result.isValid,
    data: result.isValid ? result.data : null,
    error: result.error
  };
}

// Export utilities
export {
  paramUtils,
  processParams,
  staticParamsUtils,
  paramSchemas,
  withParams,
  useParams,
  useParamsValidation
};
