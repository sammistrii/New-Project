'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  VideoCameraIcon,
  WalletIcon,
  ChartBarIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Wallet {
  points_balance: number;
  cash_balance: number;
  locked_amount: number;
}

interface Submission {
  id: string;
  status: string;
  created_at: string;
  auto_score?: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    approvedSubmissions: 0,
    pendingSubmissions: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch user data and wallet
    fetchUserData();
    fetchRecentSubmissions();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/users/me/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const walletData = await response.json();
        setWallet(walletData);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  const fetchRecentSubmissions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/submissions?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecentSubmissions(data.submissions || []);
        
        // Calculate stats
        const total = data.submissions?.length || 0;
        const approved = data.submissions?.filter((s: Submission) => s.status === 'approved').length || 0;
        const pending = data.submissions?.filter((s: Submission) => ['queued', 'needs_review'].includes(s.status)).length || 0;
        
        setStats({
          totalSubmissions: total,
          approvedSubmissions: approved,
          pendingSubmissions: pending,
          totalPoints: wallet?.points_balance || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-error-500" />;
      case 'queued':
      case 'needs_review':
        return <ClockIcon className="h-5 w-5 text-warning-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success-100 text-success-800';
      case 'rejected':
        return 'bg-error-100 text-error-800';
      case 'queued':
      case 'needs_review':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Ready to make a difference? Upload a new video and earn eco-points.
            </p>
          </div>
          <Link
            href="/dashboard/submissions/new"
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Upload Video
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <VideoCameraIcon className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-eco-100 rounded-lg flex items-center justify-center">
                <WalletIcon className="h-5 w-5 text-eco-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{wallet?.points_balance || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Overview */}
      {wallet && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Wallet Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{wallet.points_balance}</div>
              <div className="text-sm text-gray-500">Eco Points</div>
              <div className="text-xs text-gray-400 mt-1">Available for cash-out</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600">${wallet.cash_balance.toFixed(2)}</div>
              <div className="text-sm text-gray-500">Cash Balance</div>
              <div className="text-xs text-gray-400 mt-1">Total earned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600">${wallet.locked_amount.toFixed(2)}</div>
              <div className="text-sm text-gray-500">Locked Amount</div>
              <div className="text-xs text-gray-400 mt-1">Pending transactions</div>
            </div>
          </div>
          <div className="mt-6 flex justify-center space-x-4">
            <Link href="/dashboard/cashout" className="btn btn-primary">
              Cash Out Points
            </Link>
            <Link href="/dashboard/wallet" className="btn btn-secondary">
              View Details
            </Link>
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
            <Link
              href="/dashboard/submissions"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentSubmissions.length > 0 ? (
            recentSubmissions.map((submission) => (
              <div key={submission.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(submission.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Video Submission
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(submission.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {submission.status.replace('_', ' ')}
                    </span>
                    {submission.auto_score && (
                      <span className="text-sm text-gray-500">
                        Score: {submission.auto_score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first eco-friendly action video.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/submissions/new" className="btn btn-primary">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Upload Video
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/dashboard/submissions/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
              <PlusIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Upload Video</div>
              <div className="text-sm text-gray-500">Submit new eco-action</div>
            </div>
          </Link>

          <Link
            href="/dashboard/wallet"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center mr-3">
              <WalletIcon className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">View Wallet</div>
              <div className="text-sm text-gray-500">Check balance & history</div>
            </div>
          </Link>

          <Link
            href="/dashboard/cashout"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="w-10 h-10 bg-eco-100 rounded-lg flex items-center justify-center mr-3">
              <ChartBarIcon className="h-6 w-6 text-eco-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Cash Out</div>
              <div className="text-sm text-gray-500">Convert points to cash</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}