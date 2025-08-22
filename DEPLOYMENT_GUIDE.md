# Vercel Deployment Guide

This guide will help you deploy your Next.js ecommerce demo with Clerk authentication to Vercel.

## 🚀 Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [GitHub Account](https://github.com)
- Your project code pushed to GitHub
- Clerk API keys ready

## 📋 Pre-Deployment Checklist

### ✅ Code Preparation
- [x] All build errors fixed
- [x] Environment variables configured
- [x] Vercel configuration file created
- [x] Clerk integration tested locally

### ✅ Environment Variables
Make sure you have these environment variables ready for Vercel:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dG9sZXJhbnQtb3lzdGVyLTE2LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_wpB9j6zzsMeunw7Z1bP7fMN8akokTDxIge6sGn5U7A

# Custom URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Production settings
NODE_ENV=production
```

## 🎯 Deployment Steps

### 1. Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Prepare for Vercel deployment with Clerk authentication"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/nextjs-ecommerce-demo.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure project settings:**
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

5. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add each environment variable from the checklist above
   - Make sure to add them to all environments (Production, Preview, Development)

6. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: nextjs-ecommerce-demo
# - Directory: ./
# - Override settings? No
```

### 3. Configure Custom Domain (Optional)

1. **Go to Project Settings → Domains**
2. **Add your custom domain**
3. **Update DNS records as instructed**
4. **Update Clerk settings with your domain**

## 🔧 Post-Deployment Configuration

### 1. Update Clerk Settings

1. **Go to [Clerk Dashboard](https://dashboard.clerk.com/)**
2. **Select your application**
3. **Go to "Domains" in the sidebar**
4. **Add your Vercel domain:**
   - Production: `https://your-app.vercel.app`
   - Development: `http://localhost:3000`

### 2. Configure Webhooks (Optional)

1. **In Clerk Dashboard, go to "Webhooks"**
2. **Add webhook endpoint:**
   - URL: `https://your-app.vercel.app/api/webhook/clerk`
   - Events: Select the events you want to listen to

### 3. Test Authentication

1. **Visit your deployed app**
2. **Test sign up/sign in flow**
3. **Verify protected routes work**
4. **Test API endpoints**

## 🛠️ Vercel Configuration

The `vercel.json` file includes:

### Security Headers
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

### CORS Configuration
- Access-Control-Allow-Origin
- Access-Control-Allow-Methods
- Access-Control-Allow-Headers

### Function Configuration
- API routes timeout: 30 seconds
- Optimized for Next.js

## 📊 Monitoring & Analytics

### 1. Vercel Analytics
- Built-in performance monitoring
- Real-time metrics
- Error tracking

### 2. Clerk Analytics
- User authentication metrics
- Sign-up/sign-in analytics
- Security events

### 3. Custom Monitoring
- API response times
- Error rates
- User engagement

## 🔄 Continuous Deployment

### Automatic Deployments
- Every push to `main` branch triggers deployment
- Preview deployments for pull requests
- Automatic rollback on failures

### Environment Management
- Production: `main` branch
- Preview: Pull requests
- Development: Local development

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs in Vercel dashboard
   # Fix any TypeScript errors
   # Ensure all dependencies are installed
   ```

2. **Environment Variables**
   - Verify all variables are set in Vercel
   - Check variable names match exactly
   - Ensure sensitive variables are not exposed

3. **Authentication Issues**
   - Verify Clerk domain settings
   - Check API keys are correct
   - Test locally first

4. **API Route Issues**
   - Check function timeout settings
   - Verify route handlers
   - Test endpoints locally

### Debug Commands

```bash
# Check build locally
npm run build

# Test production build
npm run start

# Check environment variables
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Verify TypeScript
npx tsc --noEmit
```

## 📈 Performance Optimization

### 1. Vercel Edge Functions
- API routes run on edge network
- Global CDN for static assets
- Automatic image optimization

### 2. Next.js Optimizations
- Automatic code splitting
- Static generation where possible
- Image optimization
- Font optimization

### 3. Clerk Optimizations
- Edge-based authentication
- Optimized bundle size
- Cached user sessions

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit sensitive data
- Use Vercel's environment variable system
- Rotate keys regularly

### 2. Authentication
- Use Clerk's security features
- Enable MFA for admin accounts
- Monitor authentication events

### 3. API Security
- Validate all inputs
- Use proper error handling
- Implement rate limiting

## 📞 Support

### Vercel Support
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Vercel Status](https://vercel-status.com/)

### Clerk Support
- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Community](https://clerk.com/community)
- [Clerk Support](https://clerk.com/support)

---

**Your Next.js ecommerce demo with Clerk authentication is now ready for production deployment! 🎉**
