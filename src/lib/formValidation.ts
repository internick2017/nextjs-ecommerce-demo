import { z } from 'zod';
import { useForm, UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Common validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .min(2, 'Product name must be at least 2 characters')
    .max(100, 'Product name must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(999999.99, 'Price must be less than 1,000,000'),
  category: z
    .string()
    .min(1, 'Category is required'),
  stock: z
    .number()
    .int()
    .min(0, 'Stock must be 0 or greater'),
  image: z
    .string()
    .url('Invalid image URL')
    .optional(),
  tags: z
    .array(z.string())
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed'),
});

export const userSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  role: z
    .enum(['user', 'admin'], {
      errorMap: () => ({ message: 'Role must be either user or admin' }),
    }),
  avatar: z
    .string()
    .url('Invalid avatar URL')
    .optional(),
});

export const orderSchema = z.object({
  items: z
    .array(z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    }))
    .min(1, 'At least one item is required'),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  paymentMethod: z
    .enum(['credit_card', 'paypal', 'bank_transfer'], {
      errorMap: () => ({ message: 'Invalid payment method' }),
    }),
});

export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Rating is required')
    .max(5, 'Rating must be between 1 and 5'),
  title: z
    .string()
    .min(1, 'Review title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  comment: z
    .string()
    .min(1, 'Review comment is required')
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment must be less than 1000 characters'),
});

export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .min(2, 'Search query must be at least 2 characters'),
  category: z
    .string()
    .optional(),
  minPrice: z
    .number()
    .min(0, 'Minimum price must be 0 or greater')
    .optional(),
  maxPrice: z
    .number()
    .min(0, 'Maximum price must be 0 or greater')
    .optional(),
  sortBy: z
    .enum(['name', 'price', 'rating', 'date'], {
      errorMap: () => ({ message: 'Invalid sort option' }),
    })
    .optional(),
  sortOrder: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'Sort order must be asc or desc' }),
    })
    .optional(),
});

export const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
});

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .optional(),
  bio: z
    .string()
    .max(200, 'Bio must be less than 200 characters')
    .optional(),
  avatar: z
    .string()
    .url('Invalid avatar URL')
    .optional(),
});

// Custom validation schemas
export const createCustomSchema = <T extends z.ZodRawShape>(schema: T) => z.object(schema);

// Form hook with validation
export function useValidatedForm<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  options?: {
    defaultValues?: Partial<T>;
    mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
  }
): UseFormReturn<T> {
  return useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: options?.defaultValues,
    mode: options?.mode || 'onBlur',
  });
}

// Form submission handler
export function createFormHandler<T extends FieldValues>(
  onSubmit: SubmitHandler<T>,
  onError?: (errors: any) => void
) {
  return (data: T) => {
    try {
      onSubmit(data);
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };
}

// Field error helper
export function getFieldError(errors: any, fieldName: string): string | undefined {
  const fieldError = errors[fieldName];
  return fieldError?.message;
}

// Form validation utilities
export const formUtils = {
  // Check if form is valid
  isFormValid: (errors: any): boolean => {
    return Object.keys(errors).length === 0;
  },

  // Get all error messages
  getAllErrors: (errors: any): string[] => {
    return Object.values(errors).map((error: any) => error.message);
  },

  // Validate single field
  validateField: (schema: z.ZodSchema, fieldName: string, value: any) => {
    try {
      schema.parse({ [fieldName]: value });
      return { isValid: true, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path.includes(fieldName));
        return { isValid: false, error: fieldError?.message || 'Invalid field' };
      }
      return { isValid: false, error: 'Validation error' };
    }
  },

  // Sanitize form data
  sanitizeData: <T extends Record<string, any>>(data: T): T => {
    const sanitized: any = {};

    Object.keys(data).forEach(key => {
      const value = data[key];
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized as T;
  },

  // Format validation errors
  formatErrors: (errors: z.ZodError): Record<string, string> => {
    const formatted: Record<string, string> = {};

    errors.errors.forEach(error => {
      const fieldName = error.path.join('.');
      formatted[fieldName] = error.message;
    });

    return formatted;
  },
};

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  url: /^https?:\/\/.+/,
  slug: /^[a-z0-9-]+$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
};

// Custom validation functions
export const customValidators = {
  // Check if password is strong
  isStrongPassword: (password: string): boolean => {
    return validationPatterns.password.test(password) && password.length >= 8;
  },

  // Check if URL is valid
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Check if file size is within limit
  isFileSizeValid: (file: File, maxSizeMB: number): boolean => {
    return file.size <= maxSizeMB * 1024 * 1024;
  },

  // Check if file type is allowed
  isFileTypeValid: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  // Check if date is in the future
  isFutureDate: (date: Date): boolean => {
    return date > new Date();
  },

  // Check if date is in the past
  isPastDate: (date: Date): boolean => {
    return date < new Date();
  },

  // Check if age is within range
  isAgeValid: (birthDate: Date, minAge: number, maxAge: number): boolean => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= minAge && age - 1 <= maxAge;
    }

    return age >= minAge && age <= maxAge;
  },
};

// Export all schemas
export const schemas = {
  login: loginSchema,
  register: registerSchema,
  product: productSchema,
  user: userSchema,
  order: orderSchema,
  review: reviewSchema,
  search: searchSchema,
  contact: contactSchema,
  profile: profileSchema,
};

// Export types
export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ProductForm = z.infer<typeof productSchema>;
export type UserForm = z.infer<typeof userSchema>;
export type OrderForm = z.infer<typeof orderSchema>;
export type ReviewForm = z.infer<typeof reviewSchema>;
export type SearchForm = z.infer<typeof searchSchema>;
export type ContactForm = z.infer<typeof contactSchema>;
export type ProfileForm = z.infer<typeof profileSchema>;
