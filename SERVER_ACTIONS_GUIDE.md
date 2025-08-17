# Server Actions Guide

This guide covers Next.js 15 Server Actions with `useFormStatus` and `useFormAction`, providing comprehensive examples and best practices for form handling with server-side processing.

## Table of Contents

1. [Introduction to Server Actions](#introduction-to-server-actions)
2. [useFormStatus Hook](#useformstatus-hook)
3. [useFormAction Hook](#useformaction-hook)
4. [Form Validation](#form-validation)
5. [Error Handling](#error-handling)
6. [Loading States](#loading-states)
7. [Progressive Enhancement](#progressive-enhancement)
8. [Best Practices](#best-practices)
9. [Advanced Patterns](#advanced-patterns)

## Introduction to Server Actions

Server Actions are a new feature in Next.js 15 that allows you to run asynchronous code directly on the server from your React components. They provide a seamless way to handle form submissions and other server-side operations.

### Key Benefits

- **Progressive Enhancement**: Forms work without JavaScript
- **Type Safety**: Full TypeScript support
- **Validation**: Server-side validation with detailed error messages
- **Performance**: No client-side JavaScript bundle for form handling
- **Security**: Server-side processing prevents client-side tampering

### Basic Server Action

```typescript
'use server';

import { revalidatePath } from 'next/cache';

export async function createUserAction(prevState: any, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    // Validate and process data
    if (!name || !email) {
      return {
        success: false,
        message: 'Name and email are required',
      };
    }

    // Save to database
    const user = await saveUser({ name, email });

    // Revalidate cache
    revalidatePath('/users');

    return {
      success: true,
      message: 'User created successfully!',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create user',
    };
  }
}
```

## useFormStatus Hook

The `useFormStatus` hook provides information about the pending state of a form submission.

### Basic Usage

```typescript
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}
```

### Advanced Loading Button

```typescript
function SubmitButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
    >
      {pending ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
```

### Form with Loading States

```typescript
function UserForm() {
  return (
    <form action={createUserAction}>
      <input type="text" name="name" placeholder="Name" required />
      <input type="email" name="email" placeholder="Email" required />

      <SubmitButton>Create User</SubmitButton>

      {/* Disable form during submission */}
      <FormStatus />
    </form>
  );
}

function FormStatus() {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800">Submitting form...</p>
      </div>
    );
  }

  return null;
}
```

## useFormAction Hook

The `useFormAction` hook manages form state and provides a way to handle form submissions with proper state management.

### Basic Usage

```typescript
import { useFormState } from 'react-dom';

function UserForm() {
  const initialState = { message: '', success: false };
  const [state, formAction] = useFormState(createUserAction, initialState);

  return (
    <div>
      {state.message && (
        <div className={`p-3 rounded ${
          state.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {state.message}
        </div>
      )}

      <form action={formAction}>
        <input type="text" name="name" placeholder="Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <SubmitButton>Create User</SubmitButton>
      </form>
    </div>
  );
}
```

### Form with Validation Errors

```typescript
function UserForm() {
  const initialState = { message: '', errors: {}, success: false };
  const [state, formAction] = useFormState(createUserAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            state.errors?.name ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {state.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            state.errors?.email ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {state.errors?.email && (
          <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      <SubmitButton>Create User</SubmitButton>
    </form>
  );
}
```

## Form Validation

### Server-Side Validation with Zod

```typescript
'use server';

import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  role: z.enum(['user', 'admin', 'moderator']),
  bio: z.string().optional(),
  newsletter: z.boolean().default(false),
});

export async function createUserAction(prevState: any, formData: FormData) {
  try {
    // Extract form data
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      age: parseInt(formData.get('age') as string),
      role: formData.get('role') as 'user' | 'admin' | 'moderator',
      bio: formData.get('bio') as string || undefined,
      newsletter: formData.get('newsletter') === 'on',
    };

    // Validate data
    const validatedData = userSchema.parse(rawData);

    // Save to database
    const newUser = await saveUser(validatedData);

    // Revalidate cache
    revalidatePath('/users');
    revalidateTag('users');

    return {
      success: true,
      message: `User ${newUser.name} created successfully!`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
        message: 'Validation failed. Please check your input.',
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}
```

### Utility Functions for Error Handling

```typescript
// Utility functions for form validation
export function getFieldError(errors: Record<string, string[]> | undefined, field: string): string | undefined {
  return errors?.[field]?.[0];
}

export function hasFieldError(errors: Record<string, string[]> | undefined, field: string): boolean {
  return !!errors?.[field]?.length;
}

// Usage in component
function UserForm() {
  const initialState = { message: '', errors: {}, success: false };
  const [state, formAction] = useFormState(createUserAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            hasFieldError(state.errors, 'name') ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {getFieldError(state.errors, 'name') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError(state.errors, 'name')}</p>
        )}
      </div>

      <SubmitButton>Create User</SubmitButton>
    </form>
  );
}
```

## Error Handling

### Comprehensive Error Handling

```typescript
'use server';

export async function createUserAction(prevState: any, formData: FormData) {
  try {
    // Validate form data
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      age: parseInt(formData.get('age') as string),
    };

    // Validation
    if (!rawData.name || !rawData.email) {
      return {
        success: false,
        message: 'Name and email are required',
      };
    }

    if (rawData.age < 18) {
      return {
        success: false,
        message: 'Must be at least 18 years old',
      };
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(rawData.email);
    if (existingUser) {
      return {
        success: false,
        message: 'User with this email already exists',
      };
    }

    // Create user
    const newUser = await createUser(rawData);

    // Revalidate cache
    revalidatePath('/users');
    revalidateTag('users');

    return {
      success: true,
      message: `User ${newUser.name} created successfully!`,
      data: newUser,
    };
  } catch (error) {
    console.error('Failed to create user:', error);

    // Handle specific error types
    if (error instanceof DatabaseError) {
      return {
        success: false,
        message: 'Database error occurred. Please try again.',
      };
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}
```

### Error Display Component

```typescript
function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    </div>
  );
}

function SuccessDisplay({ message }: { message: string }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-green-800">{message}</p>
        </div>
      </div>
    </div>
  );
}
```

## Loading States

### Advanced Loading States

```typescript
function FormWithLoadingStates() {
  const initialState = { message: '', success: false };
  const [state, formAction] = useFormState(createUserAction, initialState);

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <input type="text" name="name" placeholder="Name" required />
        <input type="email" name="email" placeholder="Email" required />

        <SubmitButton>Create User</SubmitButton>

        {/* Loading indicator */}
        <FormLoadingIndicator />
      </form>
    </div>
  );
}

function FormLoadingIndicator() {
  const { pending } = useFormStatus();

  if (!pending) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-gray-700">Processing your request...</p>
        </div>
      </div>
    </div>
  );
}
```

### Skeleton Loading

```typescript
function SkeletonForm() {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return null;
}
```

## Progressive Enhancement

### Form Without JavaScript

```typescript
function ProgressiveForm() {
  return (
    <form action="/api/users" method="POST" className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Create User
      </button>
    </form>
  );
}
```

### Enhanced with Server Actions

```typescript
function EnhancedForm() {
  const initialState = { message: '', success: false };
  const [state, formAction] = useFormState(createUserAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <SubmitButton>Create User</SubmitButton>

      {state.message && (
        <div className={`p-3 rounded ${
          state.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {state.message}
        </div>
      )}
    </form>
  );
}
```

## Best Practices

### 1. Type Safety

```typescript
// Define types for form state
interface FormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
  data?: any;
}

// Use in server action
export async function createUserAction(prevState: FormState, formData: FormData): Promise<FormState> {
  // Implementation
}
```

### 2. Validation Schemas

```typescript
// Define validation schemas
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
  role: z.enum(['user', 'admin', 'moderator']),
  bio: z.string().optional(),
  newsletter: z.boolean().default(false),
});

// Use in server action
const validatedData = userSchema.parse(rawData);
```

### 3. Error Handling

```typescript
// Comprehensive error handling
try {
  // Process form data
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      errors: error.flatten().fieldErrors,
      message: 'Validation failed. Please check your input.',
    };
  }

  return {
    success: false,
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
}
```

### 4. Cache Revalidation

```typescript
// Revalidate relevant paths and tags
revalidatePath('/users');
revalidatePath('/dashboard');
revalidateTag('users');
revalidateTag('user-count');
```

### 5. Security

```typescript
// Validate and sanitize input
const name = formData.get('name') as string;
if (!name || name.length < 2) {
  return {
    success: false,
    message: 'Name must be at least 2 characters',
  };
}

// Use parameterized queries
const user = await db.query(
  'INSERT INTO users (name, email) VALUES (?, ?) RETURNING *',
  [name, email]
);
```

## Advanced Patterns

### 1. Optimistic Updates

```typescript
function OptimisticForm() {
  const [optimisticData, setOptimisticData] = useState(null);
  const initialState = { message: '', success: false };
  const [state, formAction] = useFormState(createUserAction, initialState);

  const handleSubmit = async (formData: FormData) => {
    // Set optimistic data
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    setOptimisticData({ name, email, id: Date.now() });

    // Submit form
    await formAction(formData);
  };

  return (
    <div>
      {optimisticData && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">Creating user: {optimisticData.name}</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <input type="text" name="name" placeholder="Name" required />
        <input type="email" name="email" placeholder="Email" required />
        <SubmitButton>Create User</SubmitButton>
      </form>
    </div>
  );
}
```

### 2. Multi-Step Forms

```typescript
function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const initialState = { message: '', success: false };
  const [state, formAction] = useFormState(createUserAction, initialState);

  const handleStepSubmit = (stepData: any) => {
    setFormData({ ...formData, ...stepData });
    setStep(step + 1);
  };

  const handleFinalSubmit = async (finalData: any) => {
    const completeData = { ...formData, ...finalData };
    const formDataObj = new FormData();

    Object.entries(completeData).forEach(([key, value]) => {
      formDataObj.append(key, value as string);
    });

    await formAction(formDataObj);
  };

  return (
    <div>
      {step === 1 && (
        <Step1Form onSubmit={handleStepSubmit} />
      )}

      {step === 2 && (
        <Step2Form onSubmit={handleStepSubmit} />
      )}

      {step === 3 && (
        <Step3Form onSubmit={handleFinalSubmit} />
      )}
    </div>
  );
}
```

### 3. File Uploads

```typescript
'use server';

export async function uploadFileAction(prevState: any, formData: FormData) {
  try {
    const file = formData.get('file') as File;

    if (!file) {
      return {
        success: false,
        message: 'No file selected',
      };
    }

    // Validate file type and size
    if (file.size > 5 * 1024 * 1024) { // 5MB
      return {
        success: false,
        message: 'File size must be less than 5MB',
      };
    }

    // Upload file
    const uploadedFile = await uploadFile(file);

    return {
      success: true,
      message: 'File uploaded successfully!',
      data: uploadedFile,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to upload file',
    };
  }
}

function FileUploadForm() {
  const initialState = { message: '', success: false };
  const [state, formAction] = useFormState(uploadFileAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">
          Upload File
        </label>
        <input
          type="file"
          id="file"
          name="file"
          accept=".pdf,.doc,.docx,.txt"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <SubmitButton>Upload File</SubmitButton>

      {state.message && (
        <div className={`p-3 rounded ${
          state.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {state.message}
        </div>
      )}
    </form>
  );
}
```

## Summary

Server Actions with `useFormStatus` and `useFormAction` provide a powerful and modern way to handle forms in Next.js 15:

- **Progressive Enhancement**: Forms work without JavaScript
- **Type Safety**: Full TypeScript support
- **Validation**: Server-side validation with detailed error messages
- **Loading States**: Built-in loading state management
- **Error Handling**: Comprehensive error handling and display
- **Performance**: No client-side JavaScript bundle for form handling
- **Security**: Server-side processing prevents client-side tampering

Choose the right pattern based on your application's needs and user experience requirements.
