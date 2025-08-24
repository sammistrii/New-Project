'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Wallet {
  points_balance: number;
  cash_balance: number;
  locked_amount: number;
}

interface Transaction {
  id: string;
  type: 'points_earned' | 'points_spent' | 'cash_earned' | 'cash_spent';
  amount: number;
  description: string;
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

interface CashoutRequest {
  id: string;
  points_used: number;
  cash_amount: number;
  method: string;
  status: string;
  created_at: string;
  destination_ref: string;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashoutRequests, setCashoutRequests] = useState<CashoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch wallet
      const walletResponse = await fetch('/api/users/me/wallet', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWallet(walletData);
      }

      // Fetch cash-out requests
      const cashoutResponse = await fetch('/api/cashout', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (cashoutResponse.ok) {
        const cashoutData = await cashoutResponse.json();
        setCashoutRequests(cashoutData.cashoutRequests || cashoutData);
      }

      // Generate mock transactions (in production, fetch from API)
      generateMockTransactions();
      
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockTransactions = () => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'points_earned',
        amount: 100,
        description: 'Video submission approved - Recycling action',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
      },
      {
        id: '2',
        type: 'points_earned',
        amount: 150,
        description: 'Video submission approved - Tree planting',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
      },
      {
        id: '3',
        type: 'cash_earned',
        amount: 2.50,
        description: 'Cash-out completed - PayPal transfer',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        reference: 'CR-001',
      },
      {
        id: '4',
        type: 'points_spent',
        amount: 250,
        description: 'Cash-out request - Bank transfer',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        reference: 'CR-002',
      },
    ];
    setTransactions(mockTransactions);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'points_earned':
        return <ArrowUpIcon className="h-5 w-5 text-success-500" />;
      case 'points_spent':
        return <ArrowDownIcon className="h-5 w-5 text-warning-500" />;
      case 'cash_earned':
        return <ArrowUpIcon className="h-5 w-5 text-success-500" />;
      case 'cash_spent':
        return <ArrowDownIcon className="h-5 w-5 text-warning-500" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'points_earned':
      case 'cash_earned':
        return 'text-success-600';
      case 'points_spent':
      case 'cash_spent':
        return 'text-warning-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return <CheckCircleIcon className="h-4 w-4 text-success-500" />;
      case 'pending':
      case 'initiated':
        return <ClockIcon className="h-4 w-4 text-warning-500" />;
      case 'failed':
      case 'rejected':
        return <XCircleIcon className="h-4 w-4 text-error-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return 'bg-success-100 text-success-800';
      case 'pending':
      case 'initiated':
        return 'bg-warning-100 text-warning-800';
      case 'failed':
      case 'rejected':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, type: string) => {
    if (type.includes('points')) {
      return `${amount} points`;
    } else {
      return `$${amount.toFixed(2)}`;
    }
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.type === 'points_spent' && transaction.reference) {
      return `Cash-out request ${transaction.reference}`;
    }
    return transaction.description;
  };

  // Chart data for points history
  const chartData = [
    { date: 'Jan', points: 0 },
    { date: 'Feb', points: 50 },
    { date: 'Mar', points: 120 },
    { date: 'Apr', points: 200 },
    { date: 'May', points: 350 },
    { date: 'Jun', points: wallet?.points_balance || 0 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center py-12">
        <WalletIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Wallet not found</h3>
        <p className="text-gray-500">Unable to load wallet information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
            <p className="text-gray-600 mt-1">
              Track your eco-points, cash balance, and transaction history
            </p>
          </div>
          <Link href="/dashboard/cashout" className="btn btn-primary">
            <CurrencyDollarIcon className="h-5 w-5 mr-2" />
            Cash Out Points
          </Link>
        </div>
      </div>

      {/* Wallet Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Balance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-3xl font-bold text-primary-600">{wallet.points_balance}</div>
            <div className="text-sm text-gray-500">Eco Points</div>
            <div className="text-xs text-gray-400 mt-1">Available for cash-out</div>
          </div>
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-3xl font-bold text-success-600">${wallet.cash_balance.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Cash Balance</div>
            <div className="text-xs text-gray-400 mt-1">Total earned</div>
          </div>
          <div className="text-center p-4 bg-warning-50 rounded-lg">
            <div className="text-3xl font-bold text-warning-600">${wallet.locked_amount.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Locked Amount</div>
            <div className="text-xs text-gray-400 mt-1">Pending transactions</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'transactions', name: 'Transactions', icon: WalletIcon },
              { id: 'cashouts', name: 'Cash-out Requests', icon: CurrencyDollarIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Points History</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="points" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Quick Actions</h4>
                  <div className="space-y-3">
                    <Link href="/dashboard/submissions/new" className="btn btn-secondary w-full justify-center">
                      <ArrowUpIcon className="h-5 w-5 mr-2" />
                      Upload New Video
                    </Link>
                    <Link href="/dashboard/cashout" className="btn btn-primary w-full justify-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                      Cash Out Points
                    </Link>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Recent Activity</h4>
                  <div className="space-y-2">
                    {transactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center space-x-3 text-sm">
                        {getTransactionIcon(transaction.type)}
                        <span className="flex-1 text-gray-600 truncate">
                          {getTransactionDescription(transaction)}
                        </span>
                        <span className={`font-medium ${getTransactionColor(transaction.type)}`}>
                          {transaction.type.includes('earned') ? '+' : '-'}{formatAmount(transaction.amount, transaction.type)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <WalletIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {getTransactionDescription(transaction)}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getTransactionColor(transaction.type)}`}>
                          {transaction.type.includes('earned') ? '+' : '-'}{formatAmount(transaction.amount, transaction.type)}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(transaction.status)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cash-out Requests Tab */}
          {activeTab === 'cashouts' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cash-out Requests</h3>
              {cashoutRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No cash-out requests yet</p>
                  <Link href="/dashboard/cashout" className="btn btn-primary mt-4">
                    Request Cash-out
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {cashoutRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.points_used} points → ${request.cash_amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.method.replace('_', ' ')} • {request.destination_ref}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(request.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">ID: {request.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}