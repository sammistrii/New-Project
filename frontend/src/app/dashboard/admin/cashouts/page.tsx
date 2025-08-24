'use client';

import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  EyeIcon,
  PlayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface CashoutRequest {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  points_used: number;
  cash_amount: number;
  method: 'paypal' | 'stripe' | 'bank_transfer' | 'crypto';
  destination_ref: string;
  status: 'pending' | 'initiated' | 'succeeded' | 'failed' | 'canceled';
  failure_reason?: string;
  created_at: string;
  updated_at: string;
  payout_transaction?: {
    id: string;
    gateway: string;
    gateway_txn_id?: string;
    status: string;
    gateway_fee?: number;
    processed_at?: string;
  };
}

interface CashoutStats {
  total: number;
  pending: number;
  initiated: number;
  succeeded: number;
  failed: number;
  totalAmount: number;
  averageAmount: number;
}

export default function AdminCashoutsPage() {
  const [cashouts, setCashouts] = useState<CashoutRequest[]>([]);
  const [stats, setStats] = useState<CashoutStats>({
    total: 0,
    pending: 0,
    initiated: 0,
    succeeded: 0,
    failed: 0,
    totalAmount: 0,
    averageAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCashout, setSelectedCashout] = useState<CashoutRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'initiated' | 'succeeded' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCashouts();
    fetchStats();
  }, [filter]);

  const fetchCashouts = async () => {
    try {
      const response = await fetch(`/api/cashout/admin?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCashouts(data);
      } else {
        toast.error('Failed to fetch cashout requests');
      }
    } catch (error) {
        toast.error('Error fetching cashout requests');
        // Use mock data for development
        setCashouts(getMockCashouts());
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/cashout/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use mock stats for development
      setStats({
        total: 156,
        pending: 23,
        initiated: 45,
        succeeded: 78,
        failed: 10,
        totalAmount: 23456.78,
        averageAmount: 45.67
      });
    }
  };

  const handleInitiate = async (cashoutId: string) => {
    try {
      const response = await fetch(`/api/cashout/${cashoutId}/initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Cashout initiated successfully');
        fetchCashouts();
        fetchStats();
      } else {
        toast.error('Failed to initiate cashout');
      }
    } catch (error) {
      toast.error('Error initiating cashout');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      initiated: { color: 'bg-blue-100 text-blue-800', icon: PlayIcon },
      succeeded: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircleIcon },
      canceled: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </span>
    );
  };

  const getMethodIcon = (method: string) => {
    const methodConfig = {
      paypal: { color: 'bg-blue-100 text-blue-600', label: 'PayPal' },
      stripe: { color: 'bg-purple-100 text-purple-600', label: 'Stripe' },
      bank_transfer: { color: 'bg-green-100 text-green-600', label: 'Bank Transfer' },
      crypto: { color: 'bg-orange-100 text-orange-600', label: 'Crypto' }
    };

    const config = methodConfig[method as keyof typeof methodConfig];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getMockCashouts = (): CashoutRequest[] => [
    {
      id: '1',
      user: { id: '1', name: 'John Doe', email: 'john@example.com' },
      points_used: 1000,
      cash_amount: 45.67,
      method: 'paypal',
      destination_ref: 'john.doe@paypal.com',
      status: 'pending',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      user: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      points_used: 750,
      cash_amount: 34.25,
      method: 'stripe',
      destination_ref: 'jane.smith@stripe.com',
      status: 'initiated',
      created_at: '2024-01-14T15:45:00Z',
      updated_at: '2024-01-15T09:20:00Z',
      payout_transaction: {
        id: 'txn1',
        gateway: 'stripe',
        status: 'processing'
      }
    },
    {
      id: '3',
      user: { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
      points_used: 2000,
      cash_amount: 91.34,
      method: 'bank_transfer',
      destination_ref: '1234567890',
      status: 'succeeded',
      created_at: '2024-01-13T08:15:00Z',
      updated_at: '2024-01-14T14:30:00Z',
      payout_transaction: {
        id: 'txn2',
        gateway: 'bank_transfer',
        gateway_txn_id: 'BT123456',
        status: 'completed',
        processed_at: '2024-01-14T14:30:00Z'
      }
    }
  ];

  const filteredCashouts = cashouts.filter(cashout => {
    const matchesSearch = 
      cashout.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cashout.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cashout.destination_ref.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cashout Management</h1>
          <p className="mt-2 text-gray-600">Manage user cashout requests and payouts</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Succeeded</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.succeeded}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by status:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="initiated">Initiated</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div className="flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder="Search by user name, email, or destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cashouts List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Cashout Requests ({filteredCashouts.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCashouts.map((cashout) => (
                  <tr key={cashout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{cashout.user.name}</div>
                        <div className="text-sm text-gray-500">{cashout.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">${cashout.cash_amount.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">{cashout.points_used.toLocaleString()} points</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getMethodIcon(cashout.method)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {cashout.destination_ref}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(cashout.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(cashout.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(cashout.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedCashout(cashout)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        {cashout.status === 'pending' && (
                          <button
                            onClick={() => handleInitiate(cashout.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Initiate payout"
                          >
                            <PlayIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCashouts.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No cashout requests found for the selected criteria.
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCashout && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Cashout Request Details</h3>
                <button
                  onClick={() => setSelectedCashout(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 font-medium">{selectedCashout.user.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium">{selectedCashout.user.email}</span>
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Points Used:</span>
                      <span className="ml-2 font-medium">{selectedCashout.points_used.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cash Amount:</span>
                      <span className="ml-2 font-medium">${selectedCashout.cash_amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Payment Method:</span>
                      <span className="ml-2 font-medium">{getMethodIcon(selectedCashout.method)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2">{getStatusBadge(selectedCashout.status)}</span>
                    </div>
                  </div>
                </div>

                {/* Destination */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Destination</h4>
                  <div className="text-sm">
                    <span className="text-gray-500">Reference:</span>
                    <span className="ml-2 font-medium break-all">{selectedCashout.destination_ref}</span>
                  </div>
                </div>

                {/* Transaction Details */}
                {selectedCashout.payout_transaction && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Transaction Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Gateway:</span>
                        <span className="ml-2 font-medium">{selectedCashout.payout_transaction.gateway}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className="ml-2 font-medium">{selectedCashout.payout_transaction.status}</span>
                      </div>
                      {selectedCashout.payout_transaction.gateway_txn_id && (
                        <div>
                          <span className="text-gray-500">Transaction ID:</span>
                          <span className="ml-2 font-medium">{selectedCashout.payout_transaction.gateway_txn_id}</span>
                        </div>
                      )}
                      {selectedCashout.payout_transaction.processed_at && (
                        <div>
                          <span className="text-gray-500">Processed:</span>
                          <span className="ml-2 font-medium">
                            {new Date(selectedCashout.payout_transaction.processed_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Timestamps</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedCashout.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Updated:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedCashout.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedCashout.status === 'pending' && (
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => {
                        handleInitiate(selectedCashout.id);
                        setSelectedCashout(null);
                      }}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Initiate Payout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}