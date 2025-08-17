import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Dashboard - Next.js E-Commerce Store",
  description: "Admin dashboard with analytics, order management, and user insights. Featuring protected routes and real-time data visualization.",
};

export default function DashboardLayout({
  children,
  analytics,
  orders,
  users,
}: Readonly<{
  children: React.ReactNode;
  analytics: React.ReactNode;
  orders: React.ReactNode;
  users: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to your admin dashboard</p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Analytics Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Overview</h2>
            {analytics}
          </section>

          {/* Orders and Users in parallel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Orders Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
              {orders}
            </section>

            {/* Users Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
              {users}
            </section>
          </div>

          {/* Additional Content */}
          {children}
        </div>
      </div>
    </div>
  );
}