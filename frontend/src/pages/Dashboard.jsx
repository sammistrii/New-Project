import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrophyIcon, 
  CurrencyDollarIcon, 
  VideoCameraIcon, 
  LeafIcon,
  TrendingUpIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    // Mock data - replace with real API calls
    setRecentActivity([
      {
        id: 1,
        type: 'video_upload',
        title: 'Plastic Bottle Collection',
        points: 150,
        timestamp: '2 hours ago',
        location: 'Central Park, NY',
        status: 'approved'
      },
      {
        id: 2,
        type: 'video_upload',
        title: 'Cardboard Recycling',
        points: 75,
        timestamp: '1 day ago',
        location: 'Brooklyn Bridge, NY',
        status: 'pending'
      },
      {
        id: 3,
        type: 'cashout',
        title: 'Cashout to Bank',
        amount: 25.00,
        timestamp: '3 days ago',
        status: 'completed'
      }
    ]);

    setStats({
      totalPoints: 1250,
      monthlyPoints: 450,
      totalSubmissions: 8,
      approvedSubmissions: 6,
      pendingSubmissions: 2,
      environmentalImpact: {
        plasticBottles: 24,
        cardboardBoxes: 12,
        aluminumCans: 8,
        totalWeight: 15.5
      }
    });
  }, []);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 eco-gradient rounded-full flex items-center justify-center mb-6">
            <LeafIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to EcoPoints
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the movement to make our planet cleaner. Upload videos of your environmental actions 
            and earn points that can be converted to real money.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn-primary text-lg px-8 py-3"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="btn-secondary text-lg px-8 py-3"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}! 🌱
        </h1>
        <p className="text-gray-600">
          Keep up the great work making our planet cleaner!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-eco-green-100 rounded-lg">
              <TrophyIcon className="w-6 h-6 text-eco-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
              <p className="text-2xl font-bold text-gray-900">${user.wallet}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <VideoCameraIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{user.submissions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <LeafIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Level</p>
              <p className="text-2xl font-bold text-gray-900">{user.level}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Environmental Impact
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Plastic Bottles</span>
              <span className="font-medium">{stats.environmentalImpact?.plasticBottles || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cardboard Boxes</span>
              <span className="font-medium">{stats.environmentalImpact?.cardboardBoxes || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Aluminum Cans</span>
              <span className="font-medium">{stats.environmentalImpact?.aluminumCans || 0}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">Total Weight Saved</span>
                <span className="text-eco-green-600 font-bold">
                  {stats.environmentalImpact?.totalWeight || 0} kg
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              to="/upload"
              className="flex items-center justify-between p-3 bg-eco-green-50 hover:bg-eco-green-100 rounded-lg transition-colors duration-200"
            >
              <div className="flex items-center">
                <VideoCameraIcon className="w-5 h-5 text-eco-green-600 mr-3" />
                <span className="font-medium text-gray-900">Upload New Video</span>
              </div>
              <TrendingUpIcon className="w-4 h-4 text-eco-green-600" />
            </Link>
            
            <Link
              to="/submissions"
              className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
            >
              <div className="flex items-center">
                <ClockIcon className="w-5 h-5 text-blue-600 mr-3" />
                <span className="font-medium text-gray-900">View Submissions</span>
              </div>
              <TrendingUpIcon className="w-4 h-4 text-blue-600" />
            </Link>
            
            <Link
              to="/profile"
              className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
            >
              <div className="flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 text-purple-600 mr-3" />
                <span className="font-medium text-gray-900">Manage Wallet</span>
              </div>
              <TrendingUpIcon className="w-4 h-4 text-purple-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'video_upload' ? 'bg-eco-green-100' : 'bg-blue-100'
                }`}>
                  {activity.type === 'video_upload' ? (
                    <VideoCameraIcon className="w-5 h-5 text-eco-green-600" />
                  ) : (
                    <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <ClockIcon className="w-4 h-4" />
                    <span>{activity.timestamp}</span>
                    {activity.location && (
                      <>
                        <MapPinIcon className="w-4 h-4" />
                        <span>{activity.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {activity.type === 'video_upload' ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-eco-green-600 font-medium">+{activity.points} pts</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activity.status === 'approved' 
                        ? 'bg-eco-green-100 text-eco-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ) : (
                  <div className="text-blue-600 font-medium">
                    -${activity.amount}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;