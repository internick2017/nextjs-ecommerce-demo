'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Order interface
interface Order {
  id: number;
  customer: string;
  email: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'processing';
  date: string;
  items: number;
}

// Helper function to get status styling
const getStatusStyle = (status: Order['status']): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function OrdersSlot() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchOrders = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setOrders([
        {
          id: 1001,
          customer: 'John Doe',
          email: 'john@example.com',
          amount: 299.99,
          status: 'completed',
          date: '2024-01-15',
          items: 2
        },
        {
          id: 1002,
          customer: 'Jane Smith',
          email: 'jane@example.com',
          amount: 149.50,
          status: 'processing',
          date: '2024-01-14',
          items: 1
        },
        {
          id: 1003,
          customer: 'Bob Johnson',
          email: 'bob@example.com',
          amount: 89.99,
          status: 'pending',
          date: '2024-01-14',
          items: 3
        },
        {
          id: 1004,
          customer: 'Alice Brown',
          email: 'alice@example.com',
          amount: 199.99,
          status: 'completed',
          date: '2024-01-13',
          items: 1
        },
        {
          id: 1005,
          customer: 'Charlie Wilson',
          email: 'charlie@example.com',
          amount: 75.00,
          status: 'cancelled',
          date: '2024-01-13',
          items: 2
        }
      ]);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          <Link 
            href="/dashboard/orders" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Order ID</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Customer</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Amount</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Status</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 text-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <span className="font-medium text-gray-900">#{order.id}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div>
                      <div className="font-medium text-gray-900">{order.customer}</div>
                      <div className="text-sm text-gray-500">{order.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="font-medium text-gray-900">${order.amount}</span>
                    <div className="text-sm text-gray-500">{order.items} items</div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-gray-600">{new Date(order.date).toLocaleDateString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}