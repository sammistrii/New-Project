import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserCircleIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutMethod, setCashoutMethod] = useState('bank');
  const [processingCashout, setProcessingCashout] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showCashoutModal, setShowCashoutModal] = useState(false);

  useEffect(() => {
    // Mock transaction data - replace with real API calls
    setTransactions([
      {
        id: 1,
        type: 'earned',
        amount: 150,
        description: 'Plastic Bottle Collection',
        date: '2024-01-15T10:30:00Z',
        status: 'completed'
      },
      {
        id: 2,
        type: 'earned',
        amount: 75,
        description: 'Cardboard Recycling',
        date: '2024-01-14T16:45:00Z',
        status: 'completed'
      },
      {
        id: 3,
        type: 'cashout',
        amount: -25.00,
        description: 'Cashout to Bank Account',
        date: '2024-01-10T14:20:00Z',
        status: 'completed'
      },
      {
        id: 4,
        type: 'earned',
        amount: 120,
        description: 'Aluminum Can Cleanup',
        date: '2024-01-13T12:15:00Z',
        status: 'completed'
      }
    ]);
  }, []);

  const handleCashout = async () => {
    if (!cashoutAmount || parseFloat(cashoutAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(cashoutAmount) > user.wallet) {
      alert('Insufficient funds in wallet');
      return;
    }

    setProcessingCashout(true);

    try {
      // Mock cashout processing - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newWalletBalance = user.wallet - parseFloat(cashoutAmount);
      updateUser({ wallet: newWalletBalance });
      
      // Add transaction
      const newTransaction = {
        id: Date.now(),
        type: 'cashout',
        amount: -parseFloat(cashoutAmount),
        description: `Cashout to ${cashoutMethod === 'bank' ? 'Bank Account' : 'PayPal'}`,
        date: new Date().toISOString(),
        status: 'completed'
      };
      
      setTransactions([newTransaction, ...transactions]);
      setShowCashoutModal(false);
      setCashoutAmount('');
      alert('Cashout successful! Funds will be transferred within 2-3 business days.');
    } catch (error) {
      alert('Cashout failed. Please try again.');
    } finally {
      setProcessingCashout(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    if (type === 'earned') {
      return <ArrowUpIcon className="w-5 h-5 text-green-600" />;
    } else {
      return <ArrowDownIcon className="w-5 h-5 text-red-600" />;
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserCircleIcon },
    { id: 'wallet', name: 'Wallet', icon: CurrencyDollarIcon },
    { id: 'transactions', name: 'Transactions', icon: CreditCardIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 eco-gradient rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500">Member since {new Date().getFullYear()}</span>
              <span className="px-2 py-1 bg-eco-green-100 text-eco-green-800 text-xs rounded-full font-medium">
                {user.level}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-eco-green-600 mb-2">{user.points}</div>
          <div className="text-gray-600">Total Points</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{user.submissions}</div>
          <div className="text-gray-600">Submissions</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">${user.wallet}</div>
          <div className="text-gray-600">Wallet Balance</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('wallet')}
            className="flex items-center space-x-3 p-4 bg-eco-green-50 hover:bg-eco-green-100 rounded-lg transition-colors duration-200"
          >
            <BanknotesIcon className="w-6 h-6 text-eco-green-600" />
            <span className="font-medium text-gray-900">Manage Wallet</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
          >
            <CreditCardIcon className="w-6 h-6 text-blue-600" />
            <span className="font-medium text-gray-900">View Transactions</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderWallet = () => (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-eco-green-600 mb-2">${user.wallet}</div>
            <div className="text-gray-600">Available Balance</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{user.points}</div>
            <div className="text-gray-600">Points Available</div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-4">
            <strong>Conversion Rate:</strong> 100 points = $1.00
          </div>
          <button
            onClick={() => setShowCashoutModal(true)}
            disabled={user.wallet <= 0}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cash Out Funds
          </button>
        </div>
      </div>

      {/* Cashout History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Cashouts</h3>
        <div className="space-y-3">
          {transactions
            .filter(t => t.type === 'cashout')
            .slice(0, 5)
            .map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ArrowDownIcon className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="font-medium text-gray-900">{transaction.description}</div>
                    <div className="text-sm text-gray-500">{formatDate(transaction.date)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-red-600">${Math.abs(transaction.amount)}</div>
                  <div className="text-sm text-gray-500">{transaction.status}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
        <div className="space-y-3">
          {transactions.map(transaction => (
            <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getTransactionIcon(transaction.type)}
                <div>
                  <div className="font-medium text-gray-900">{transaction.description}</div>
                  <div className="text-sm text-gray-500">{formatDate(transaction.date)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-medium ${
                  transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'earned' ? '+' : ''}{transaction.amount}
                  {transaction.type === 'earned' ? ' pts' : ''}
                  {transaction.type === 'cashout' ? ' USD' : ''}
                </div>
                <div className="text-sm text-gray-500">{transaction.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <BellIcon className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-500">Get notified about submissions and rewards</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-eco-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-eco-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                <div className="text-sm text-gray-500">Add an extra layer of security</div>
              </div>
            </div>
            <button className="btn-secondary">Enable</button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <GlobeAltIcon className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Language</div>
                <div className="text-sm text-gray-500">English (US)</div>
              </div>
            </div>
            <button className="btn-secondary">Change</button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-red-900">Delete Account</div>
              <div className="text-sm text-red-700">Permanently delete your account and all data</div>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Profile & Settings
        </h1>
        <p className="text-gray-600">
          Manage your account, wallet, and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-eco-green-500 text-eco-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'wallet' && renderWallet()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'settings' && renderSettings()}

      {/* Cashout Modal */}
      {showCashoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Out Funds</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                  className="input-field"
                  placeholder="0.00"
                  min="0"
                  max={user.wallet}
                  step="0.01"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: ${user.wallet}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={cashoutMethod}
                  onChange={(e) => setCashoutMethod(e.target.value)}
                  className="input-field"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Processing Time:</strong> 2-3 business days<br />
                  <strong>Minimum Amount:</strong> $5.00<br />
                  <strong>Fee:</strong> No fees for amounts over $10.00
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCashoutModal(false)}
                className="btn-secondary flex-1"
                disabled={processingCashout}
              >
                Cancel
              </button>
              <button
                onClick={handleCashout}
                disabled={processingCashout || !cashoutAmount || parseFloat(cashoutAmount) <= 0}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingCashout ? 'Processing...' : 'Confirm Cashout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;