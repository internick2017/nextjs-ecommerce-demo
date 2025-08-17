'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// User interface
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  avatar: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  lastLogin: string;
}

// Helper function to get role styling
const getRoleStyle = (role: User['role']): string => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'moderator':
      return 'bg-blue-100 text-blue-800';
    case 'user':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to get status styling
const getStatusStyle = (status: User['status']): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function UsersSlot() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    // Simulate API call
    const fetchUsers = async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const userData = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin' as const,
          avatar: '👨‍💼',
          status: 'active' as const,
          joinDate: '2023-12-01',
          lastLogin: '2024-01-15'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'moderator' as const,
          avatar: '👩‍💻',
          status: 'active' as const,
          joinDate: '2023-11-15',
          lastLogin: '2024-01-14'
        },
        {
          id: 3,
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'user' as const,
          avatar: '👨',
          status: 'active' as const,
          joinDate: '2024-01-10',
          lastLogin: '2024-01-13'
        },
        {
          id: 4,
          name: 'Alice Brown',
          email: 'alice@example.com',
          role: 'user' as const,
          avatar: '👩',
          status: 'pending' as const,
          joinDate: '2024-01-12',
          lastLogin: 'Never'
        },
        {
          id: 5,
          name: 'Charlie Wilson',
          email: 'charlie@example.com',
          role: 'user' as const,
          avatar: '👨‍🎓',
          status: 'inactive' as const,
          joinDate: '2023-10-20',
          lastLogin: '2023-12-01'
        }
      ];
      
      setUsers(userData);
      setStats({
        total: userData.length,
        active: userData.filter(u => u.status === 'active').length,
        newThisMonth: userData.filter(u => new Date(u.joinDate) > new Date('2024-01-01')).length
      });
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
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
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <Link 
            href="/dashboard/users" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Manage All →
          </Link>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Users</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-green-600">Active</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.newThisMonth}</div>
            <div className="text-sm text-purple-600">New This Month</div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Recent Users</h4>
          {users.slice(0, 4).map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{user.avatar}</div>
                <div>
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleStyle(user.role)}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(user.status)}`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Add User
            </button>
            <button className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
              Export Users
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}