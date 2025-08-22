import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { AppContextProvider } from '../contexts/AppContext';
import Navigation from '../components/Navigation';
import GlobalErrorMonitor from '../components/GlobalErrorMonitor';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next.js Ecommerce Demo',
  description: 'Advanced Next.js features demonstration with authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
          card: 'bg-white shadow-lg rounded-lg',
          headerTitle: 'text-2xl font-bold text-gray-900',
          headerSubtitle: 'text-gray-600',
          socialButtonsBlockButton: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
          formFieldInput: 'border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
          footerActionLink: 'text-blue-600 hover:text-blue-700',
        },
        layout: {
          socialButtonsPlacement: 'bottom',
          showOptionalFields: false,
        },
      }}
    >
      <html lang="en">
        <body className={inter.className}>
          <AppContextProvider>
            <GlobalErrorMonitor />
            <Navigation />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
          </AppContextProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
