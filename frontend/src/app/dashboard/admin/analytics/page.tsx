'use client';

import { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  VideoCameraIcon, 
  CurrencyDollarIcon, 
  MapPinIcon,
  CalendarIcon,
  TrendingUpIcon,
  ChartBarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalSubmissions: number;
    totalPointsAwarded: number;
    totalPayouts: number;
    activeUsersThisMonth: number;
    submissionsThisMonth: number;
  };
  submissionsByDay: Array<{
    date: string;
    submissions: number;
    approved: number;
    rejected: number;
  }>;
  submissionsByLocation: Array<{
    location: string;
    count: number;
    points: number;
  }>;
  userParticipation: Array<{
    userId: string;
    userName: string;
    submissions: number;
    points: number;
    lastActive: string;
  }>;
  payoutStats: {
    totalAmount: number;
    averageAmount: number;
    methodBreakdown: Array<{
      method: string;
      count: number;
      amount: number;
    }>;
  };
  impactMetrics: {
    totalWasteCollected: number;
    estimatedCO2Reduced: number;
    costPerSubmission: number;
    roi: number;
  };
}

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        toast.error('Failed to fetch analytics data');
      }
    } catch (error) {
      toast.error('Error fetching analytics data');
      // Use mock data for development
      setAnalyticsData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (): AnalyticsData => ({
    overview: {
      totalUsers: 1247,
      totalSubmissions: 8934,
      totalPointsAwarded: 456789,
      totalPayouts: 23456.78,
      activeUsersThisMonth: 342,
      submissionsThisMonth: 1234
    },
    submissionsByDay: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      submissions: Math.floor(Math.random() * 50) + 20,
      approved: Math.floor(Math.random() * 40) + 15,
      rejected: Math.floor(Math.random() * 10) + 5
    })),
    submissionsByLocation: [
      { location: 'Downtown', count: 2345, points: 123456 },
      { location: 'Westside', count: 1890, points: 98765 },
      { location: 'Eastside', count: 1567, points: 78901 },
      { location: 'Northside', count: 2132, points: 112345 },
      { location: 'Southside', count: 1000, points: 54322 }
    ],
    userParticipation: [
      { userId: '1', userName: 'John Doe', submissions: 45, points: 2340, lastActive: '2024-01-15' },
      { userId: '2', userName: 'Jane Smith', submissions: 38, points: 1980, lastActive: '2024-01-14' },
      { userId: '3', userName: 'Mike Johnson', submissions: 32, points: 1650, lastActive: '2024-01-13' },
      { userId: '4', userName: 'Sarah Wilson', submissions: 29, points: 1480, lastActive: '2024-01-12' },
      { userId: '5', userName: 'David Brown', submissions: 26, points: 1320, lastActive: '2024-01-11' }
    ],
    payoutStats: {
      totalAmount: 23456.78,
      averageAmount: 45.67,
      methodBreakdown: [
        { method: 'PayPal', count: 234, amount: 12345.67 },
        { method: 'Stripe', count: 156, amount: 7890.12 },
        { method: 'Bank Transfer', count: 89, amount: 2345.67 },
        { method: 'Crypto', count: 45, amount: 875.32 }
      ]
    },
    impactMetrics: {
      totalWasteCollected: 456.7, // tons
      estimatedCO2Reduced: 234.5, // kg
      costPerSubmission: 2.34, // dollars
      roi: 3.2 // return on investment multiplier
    }
  });

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      const response = await fetch(`/api/admin/analytics/export?format=${format}&range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eco-points-analytics-${dateRange}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`${format.toUpperCase()} export successful`);
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      toast.error('Export error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No data available</h2>
          <p className="text-gray-600">Analytics data could not be loaded.</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-gray-600">Comprehensive insights into the Eco-Points System</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.overview.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{analyticsData.overview.activeUsersThisMonth} this month</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <VideoCameraIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.overview.totalSubmissions.toLocaleString()}</p>
                <p className="text-sm text-green-600">+{analyticsData.overview.submissionsThisMonth} this month</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUpIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Points Awarded</p>
                <p className="text-2xl font-semibold text-gray-900">{analyticsData.overview.totalPointsAwarded.toLocaleString()}</p>
                <p className="text-sm text-green-600">+12.5% vs last month</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <p className="text-2xl font-semibold text-gray-900">${analyticsData.overview.totalPayouts.toLocaleString()}</p>
                <p className="text-sm text-green-600">+8.3% vs last month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Submissions Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submissions Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.submissionsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="submissions" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="approved" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Location Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submissions by Location</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.submissionsByLocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ location, percent }) => `${location} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.submissionsByLocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Payout Methods */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payout Methods Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.payoutStats.methodBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Impact Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Environmental Impact</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ChartBarIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Waste Collected</span>
                </div>
                <span className="text-lg font-semibold text-green-600">{analyticsData.impactMetrics.totalWasteCollected} tons</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUpIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">CO₂ Reduced</span>
                </div>
                <span className="text-lg font-semibold text-blue-600">{analyticsData.impactMetrics.estimatedCO2Reduced} kg</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Cost per Submission</span>
                </div>
                <span className="text-lg font-semibold text-purple-600">${analyticsData.impactMetrics.costPerSubmission}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrendingUpIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">ROI</span>
                </div>
                <span className="text-lg font-semibold text-yellow-600">{analyticsData.impactMetrics.roi}x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Participating Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Earned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.userParticipation.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.submissions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.points.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{new Date(user.lastActive).toLocaleDateString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}