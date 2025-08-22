import { SignIn } from '@clerk/nextjs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - E-commerce Demo',
  description: 'Sign in to your account to access your dashboard and manage your orders.',
  robots: 'noindex, nofollow', // Prevent indexing of auth pages
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back! Please sign in to continue to your dashboard.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-2xl font-bold text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                formFieldInput: 'border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200',
                footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded',
                dividerLine: 'bg-gray-300',
                dividerText: 'text-gray-500 bg-white px-2',
                formFieldLabel: 'text-sm font-medium text-gray-700',
                formFieldLabelRow: 'mb-1',
                formFieldInputShowPasswordButton: 'text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded',
                formResendCodeLink: 'text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded',
                identityPreviewText: 'text-gray-600',
                identityPreviewEditButton: 'text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded',
                formFieldErrorText: 'text-red-600 text-sm mt-1',
                alertText: 'text-red-600 text-sm',
                alert: 'bg-red-50 border border-red-200 rounded-md p-3 mb-4',
                loading: 'text-gray-600',
                spinner: 'text-blue-600',
              },
              layout: {
                socialButtonsPlacement: 'bottom',
                showOptionalFields: false,
                privacyPageUrl: '/privacy',
                termsPageUrl: '/terms',
              },
              variables: {
                colorPrimary: '#2563eb', // blue-600
                colorText: '#374151', // gray-700
                colorTextSecondary: '#6b7280', // gray-500
                colorBackground: '#ffffff',
                colorInputBackground: '#ffffff',
                colorInputText: '#374151',
                borderRadius: '0.375rem', // rounded-md
              },
            }}
            signUpUrl="/sign-up"
            routing="path"
            path="/sign-in"
          />
        </div>
      </div>
    </div>
  );
}
