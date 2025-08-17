'use client';

import { useState, useEffect } from 'react';

// Analytics data interface
interface AnalyticsData {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  growthRate: number;
  conversionRate: number;
}

export default function AnalyticsSlot() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchAnalytics = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalytics({
        totalProducts: 156,
        totalOrders: 1247,
        totalRevenue: 89650.75,
        totalUsers: 3421,
        growthRate: 12.5,
        conversionRate: 3.2
      });
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const stats = [
    {
      title: 'Total Products',
      value: analytics.totalProducts.toLocaleString(),
      icon: '📦',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Orders',
      value: analytics.totalOrders.toLocaleString(),
      icon: '🛒',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Revenue',
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      icon: '💰',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Total Users',
      value: analytics.totalUsers.toLocaleString(),
      icon: '👥',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`text-2xl p-3 rounded-lg ${stat.bgColor}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Rate</h3>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-green-600">+{analytics.growthRate}%</span>
            <span className="ml-2 text-sm text-gray-600">vs last month</span>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(analytics.growthRate * 4, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Rate</h3>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-blue-600">{analytics.conversionRate}%</span>
            <span className="ml-2 text-sm text-gray-600">of visitors</span>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${analytics.conversionRate * 10}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}