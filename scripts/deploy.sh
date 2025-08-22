#!/bin/bash

# Next.js Ecommerce Demo - Deployment Script
# This script helps prepare and deploy the application to Vercel

echo "🚀 Next.js Ecommerce Demo - Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Creating template..."
    cat > .env.local << EOF
# Clerk Authentication Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Custom URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Development settings
NODE_ENV=development
EOF
    print_warning "Please update .env.local with your actual Clerk API keys before deploying."
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

# Run linting
print_status "Running linting..."
npm run lint

if [ $? -ne 0 ]; then
    print_warning "Linting found issues. Please fix them before deploying."
    read -p "Continue with deployment anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build the project
print_status "Building the project..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed. Please fix the errors before deploying."
    exit 1
fi

print_success "Build completed successfully"

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_status "Initializing git repository..."
    git init
    print_success "Git repository initialized"
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_status "Committing changes..."
    git add .
    git commit -m "Prepare for deployment - $(date)"
    print_success "Changes committed"
else
    print_status "No changes to commit"
fi

# Check if remote is configured
if ! git remote get-url origin > /dev/null 2>&1; then
    print_warning "No remote repository configured."
    echo "Please add your GitHub repository as remote:"
    echo "git remote add origin https://github.com/yourusername/nextjs-ecommerce-demo.git"
    echo "Then push your code: git push -u origin main"
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
print_status "Deploying to Vercel..."
echo
echo "Follow the prompts to complete deployment:"
echo "1. Login to Vercel (if not already logged in)"
echo "2. Link to existing project or create new"
echo "3. Configure project settings"
echo "4. Add environment variables"
echo

vercel --prod

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    echo
    echo "🎉 Your Next.js ecommerce demo is now live!"
    echo
    echo "Next steps:"
    echo "1. Update Clerk domain settings with your Vercel URL"
    echo "2. Test authentication flow"
    echo "3. Configure custom domain (optional)"
    echo "4. Set up monitoring and analytics"
    echo
    echo "For more information, see DEPLOYMENT_GUIDE.md"
else
    print_error "Deployment failed. Please check the error messages above."
    exit 1
fi
