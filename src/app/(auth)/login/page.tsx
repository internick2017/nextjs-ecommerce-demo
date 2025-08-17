'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginForm } from '../../../lib/formValidation';
import { TextInput, EmailInput, PasswordInput, SubmitButton } from '../../../components/forms/FormComponents';
import { useAuth } from '../../../contexts/AppContext';

interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    session: {
      token: string;
      expiresAt: string;
    };
  };
  message?: string;
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const methods = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth?action=verify', {
          credentials: 'include'
        });

        if (response.ok) {
          // User is already authenticated, redirect to dashboard
          router.push('/dashboard');
        }
      } catch (err) {
        // User is not authenticated, stay on login page
        console.log('User not authenticated');
      }
    };

    checkAuth();
  }, [router]);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const responseData: LoginResponse = await response.json();

      if (response.ok && responseData.success) {
        setSuccess('Login successful! Redirecting...');

        // Use context to login user
        if (responseData.data?.user) {
          login({
            id: responseData.data.user.id,
            name: responseData.data.user.name,
            email: responseData.data.user.email,
            role: responseData.data.user.role as 'user' | 'admin',
          });
        }

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setError(responseData.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
    }
  };

  const handleDemoLogin = async (type: 'user' | 'admin') => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const demoCredentials = {
      user: { email: 'user@example.com', password: 'user123' },
      admin: { email: 'admin@example.com', password: 'admin123' }
    };

    try {
      const response = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(demoCredentials[type])
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Demo ${type} login successful! Redirecting...`);

        if (data.data?.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user));
        }

        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setError(data.message || 'Demo login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </a>
        </p>
      </div>

              <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <FormProvider {...methods}>
              <form className="space-y-6" onSubmit={methods.handleSubmit(onSubmit)}>
                <EmailInput
                  name="email"
                  label="Email address"
                  placeholder="Enter your email"
                  required
                />

                <PasswordInput
                  name="password"
                  label="Password"
                  placeholder="Enter your password"
                  required
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                      Forgot your password?
                    </a>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          {error}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          {success}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                <SubmitButton loading={loading}>
                  Sign in
                </SubmitButton>
              </form>
            </FormProvider>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo accounts</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('user')}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Demo User
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Demo Admin
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs text-gray-500 text-center">
              <p>Demo User: user@example.com / user123</p>
              <p>Demo Admin: admin@example.com / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;