import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  withParams,
  paramSchemas,
  processParams,
  staticParamsUtils,
  paramUtils
} from '../../../../../lib/paramsHandler';

// Blog post interface
interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  year: string;
  month: string;
  slug: string;
  tags: string[];
  readTime: number;
  views: number;
  featured: boolean;
}

// Mock blog posts data
const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Getting Started with Next.js App Router',
    content: `
      <h2>Introduction</h2>
      <p>Next.js App Router is the latest routing system that provides a more intuitive and powerful way to build React applications. It introduces several new concepts and features that make development more efficient.</p>

      <h2>Key Features</h2>
      <ul>
        <li>Server Components by default</li>
        <li>Nested layouts</li>
        <li>Streaming and Suspense</li>
        <li>Dynamic routing with validation</li>
        <li>Static and dynamic parameters</li>
      </ul>

      <h2>Server Components</h2>
      <p>Server Components are the default in App Router. They run on the server and can directly access databases, file systems, and other server-side resources without sending JavaScript to the client.</p>

      <h2>Dynamic Routing</h2>
      <p>Dynamic routes allow you to create pages that adapt based on the URL parameters. You can validate and transform these parameters to ensure they meet your requirements.</p>

      <h2>Conclusion</h2>
      <p>The App Router represents a significant evolution in Next.js, providing developers with more powerful tools to build modern web applications.</p>
    `,
    excerpt: 'Learn how to use Next.js App Router with server components, dynamic routing, and advanced features.',
    author: 'John Doe',
    publishedAt: '2024-01-15T10:00:00Z',
    year: '2024',
    month: '01',
    slug: 'getting-started-nextjs-app-router',
    tags: ['nextjs', 'react', 'tutorial', 'app-router'],
    readTime: 8,
    views: 1250,
    featured: true
  },
  {
    id: '2',
    title: 'Advanced TypeScript Patterns for React',
    content: `
      <h2>TypeScript and React</h2>
      <p>TypeScript provides powerful type safety for React applications. When combined with modern React patterns, it can significantly improve developer experience and code quality.</p>

      <h2>Generic Components</h2>
      <p>Generic components allow you to create reusable components that maintain type safety across different data types.</p>

      <h2>Advanced Hooks</h2>
      <p>Custom hooks with TypeScript can provide excellent type inference and help prevent common runtime errors.</p>

      <h2>Best Practices</h2>
      <p>Following TypeScript best practices in React applications leads to more maintainable and scalable code.</p>
    `,
    excerpt: 'Explore advanced TypeScript patterns and best practices for building robust React applications.',
    author: 'Jane Smith',
    publishedAt: '2024-01-20T14:30:00Z',
    year: '2024',
    month: '01',
    slug: 'advanced-typescript-patterns-react',
    tags: ['typescript', 'react', 'patterns', 'advanced'],
    readTime: 12,
    views: 890,
    featured: false
  },
  {
    id: '3',
    title: 'Building Scalable APIs with Next.js',
    content: `
      <h2>API Routes in Next.js</h2>
      <p>Next.js provides a powerful way to build APIs using the same framework as your frontend. This approach offers several advantages for full-stack development.</p>

      <h2>Route Handlers</h2>
      <p>Route handlers in App Router provide a more flexible and powerful way to handle HTTP requests compared to the Pages Router API routes.</p>

      <h2>Middleware Integration</h2>
      <p>Middleware can be used to add authentication, logging, and other cross-cutting concerns to your API routes.</p>

      <h2>Error Handling</h2>
      <p>Proper error handling is crucial for building reliable APIs. Next.js provides several tools to help with this.</p>
    `,
    excerpt: 'Learn how to build scalable and maintainable APIs using Next.js App Router and modern development practices.',
    author: 'Bob Johnson',
    publishedAt: '2024-02-05T09:15:00Z',
    year: '2024',
    month: '02',
    slug: 'building-scalable-apis-nextjs',
    tags: ['nextjs', 'api', 'backend', 'scalable'],
    readTime: 10,
    views: 756,
    featured: true
  }
];

// Blog post component with parameter validation
const BlogPostPage = async ({
  params
}: {
  params: { year: string; month: string; slug: string }
}) => {
  // Process and validate parameters
  const result = await processParams(params, paramSchemas.blog);

  if (!result.isValid) {
    notFound();
  }

  const { year, month, slug } = result.data;

  // Find blog post
  const post = mockBlogPosts.find(p =>
    p.year === year.toString() &&
    p.month === month.toString().padStart(2, '0') &&
    p.slug === slug
  );

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/" className="text-gray-700 hover:text-blue-600">
                Home
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <a href="/blog" className="text-gray-700 hover:text-blue-600">
                  Blog
                </a>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <a href={`/blog/${year}`} className="text-gray-700 hover:text-blue-600">
                  {year}
                </a>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <a href={`/blog/${year}/${month}`} className="text-gray-700 hover:text-blue-600">
                  {new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long' })}
                </a>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">{post.title}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Blog Post Header */}
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            {/* Post Meta */}
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
              <span>•</span>
              <span>{post.readTime} min read</span>
              <span>•</span>
              <span>{post.views.toLocaleString()} views</span>
              {post.featured && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 font-medium">Featured</span>
                </>
              )}
            </div>

            {/* Post Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

            {/* Post Excerpt */}
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">{post.excerpt}</p>

            {/* Author Info */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {post.author.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{post.author}</p>
                <p className="text-sm text-gray-500">Author</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Post Content */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        {/* Related Posts */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockBlogPosts
              .filter(p => p.id !== post.id)
              .slice(0, 3)
              .map(relatedPost => (
                <div key={relatedPost.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <span>{new Date(relatedPost.publishedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{relatedPost.readTime} min read</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {relatedPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{relatedPost.author}</span>
                      <span className="text-sm text-gray-500">{relatedPost.views} views</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Parameter Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="font-medium text-gray-900 mb-4">Parameter Debug Info:</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Original Parameters:</h4>
                <pre className="text-sm text-gray-600 bg-gray-100 p-3 rounded">
                  {JSON.stringify(params, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Processed Parameters:</h4>
                <pre className="text-sm text-gray-600 bg-gray-100 p-3 rounded">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Validation Result:</h4>
                <pre className="text-sm text-gray-600 bg-gray-100 p-3 rounded">
                  {JSON.stringify({ isValid: result.isValid, error: result.error }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Generate static parameters
export async function generateStaticParams() {
  return await staticParamsUtils.generateBlogParams();
}

// Generate metadata
export async function generateMetadata({
  params
}: {
  params: { year: string; month: string; slug: string }
}): Promise<Metadata> {
  const result = await processParams(params, paramSchemas.blog);

  if (!result.isValid) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.'
    };
  }

  const { year, month, slug } = result.data;
  const post = mockBlogPosts.find(p =>
    p.year === year.toString() &&
    p.month === month.toString().padStart(2, '0') &&
    p.slug === slug
  );

  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.'
    };
  }

  return {
    title: `${post.title} - Blog`,
    description: post.excerpt,
    keywords: post.tags.join(', '),
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt
    }
  };
}

// Export with parameter validation
export default withParams(BlogPostPage, paramSchemas.blog);
