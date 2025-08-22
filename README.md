# Next.js Ecommerce Demo with Clerk Authentication

A comprehensive Next.js ecommerce application showcasing advanced features, modern authentication with Clerk, and best practices for building production-ready web applications.

## 🚀 Features

### 🔐 Authentication & Security
- **Clerk Authentication**: Complete authentication system with sign-in/sign-up
- **Protected Routes**: Middleware-based route protection
- **User Management**: Profile management and user settings
- **API Security**: Server-side authentication for API endpoints
- **Session Management**: Secure session handling

### 🛍️ Ecommerce Features
- **Product Catalog**: Dynamic product listings with search and filtering
- **Shopping Cart**: Persistent cart functionality
- **User Dashboard**: Personalized user experience
- **Order Management**: Complete order lifecycle

### ⚡ Next.js Advanced Features
- **App Router**: Latest Next.js 15 App Router implementation
- **Server Components**: Optimized server-side rendering
- **API Routes**: RESTful API endpoints with authentication
- **Middleware**: Custom middleware for authentication and security
- **Error Handling**: Comprehensive error boundaries and handling
- **Data Fetching**: Advanced data fetching patterns
- **Caching**: Optimized caching strategies
- **Performance**: Optimized for speed and SEO

### 🎨 UI/UX
- **Responsive Design**: Mobile-first responsive design
- **Tailwind CSS**: Modern styling with Tailwind CSS
- **Custom Components**: Reusable component library
- **Loading States**: Smooth loading experiences
- **Error States**: User-friendly error handling

## 📋 Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nextjs-ecommerce-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Clerk Authentication**

   Create a `.env.local` file in your project root:
   ```env
   # Get these from https://dashboard.clerk.com/
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   CLERK_SECRET_KEY=sk_test_your_secret_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/             # Sign in page
│   │   └── sign-up/             # Sign up page
│   ├── (shop)/                  # Ecommerce routes
│   │   ├── products/            # Product pages
│   │   └── cart/                # Shopping cart
│   ├── dashboard/               # User dashboard
│   ├── api/                     # API routes
│   └── layout.tsx               # Root layout
├── components/                   # Reusable components
├── contexts/                     # React contexts
├── lib/                         # Utility functions
└── middleware.ts                # Authentication middleware
```

## 🔐 Authentication Setup

This project uses [Clerk](https://clerk.com/) for authentication. See the [Clerk Integration Guide](./CLERK_INTEGRATION_GUIDE.md) for detailed setup instructions.

### Key Authentication Features:
- **Sign In/Sign Up**: Custom styled authentication pages
- **User Profile**: Complete profile management
- **Protected Routes**: Automatic route protection
- **API Security**: Server-side authentication
- **Social Login**: Support for multiple providers

## 🧪 Demo Pages

Explore the various features through these demo pages:

- **Home** (`/`) - Main landing page
- **Clerk Auth Demo** (`/clerk-demo`) - Authentication showcase
- **Products** (`/products`) - Product catalog
- **Dashboard** (`/dashboard`) - User dashboard (protected)
- **API Demo** (`/api-demo`) - API features demonstration
- **Data Fetching Demo** (`/data-fetching-demo`) - Data fetching patterns
- **Server Actions Demo** (`/server-actions-demo`) - Server actions
- **Error Handling Demo** (`/error-handling-demo`) - Error handling
- **And many more...**

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Environment Variables

Required environment variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Custom URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## 📚 Documentation

- [Clerk Integration Guide](./CLERK_INTEGRATION_GUIDE.md) - Complete Clerk setup guide
- [Advanced Data Fetching Guide](./ADVANCED_DATA_FETCHING_GUIDE.md) - Data fetching patterns
- [Server Actions Guide](./SERVER_ACTIONS_GUIDE.md) - Server actions implementation
- [Error Handling Guide](./GLOBAL_ERROR_HANDLING.md) - Error handling strategies
- [Middleware Guide](./MIDDLEWARE_GUIDE.md) - Custom middleware implementation

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

This project can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the documentation guides
2. Review the demo pages
3. Check the troubleshooting section in the Clerk guide
4. Open an issue on GitHub

---

**Built with ❤️ using Next.js 15, Clerk, and Tailwind CSS**
