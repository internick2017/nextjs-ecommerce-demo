import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join us and start exploring our amazing features!
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200',
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-2xl font-bold text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-md transition-colors duration-200',
                formFieldInput: 'border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium',
                dividerLine: 'bg-gray-300',
                dividerText: 'text-gray-500 bg-white px-2',
                formFieldLabel: 'text-sm font-medium text-gray-700',
                formFieldLabelRow: 'mb-1',
                formFieldInputShowPasswordButton: 'text-gray-500 hover:text-gray-700',
                formResendCodeLink: 'text-blue-600 hover:text-blue-700',
                identityPreviewText: 'text-gray-600',
                identityPreviewEditButton: 'text-blue-600 hover:text-blue-700',
                formFieldErrorText: 'text-red-600 text-sm mt-1',
                alertText: 'text-red-600 text-sm',
                alert: 'bg-red-50 border border-red-200 rounded-md p-3 mb-4',
              },
              layout: {
                socialButtonsPlacement: 'bottom',
                showOptionalFields: false,
                privacyPageUrl: '/privacy',
                termsPageUrl: '/terms',
              },
            }}
            redirectUrl="/dashboard"
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
