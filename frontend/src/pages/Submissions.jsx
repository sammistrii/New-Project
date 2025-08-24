import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const Submissions = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with real API calls
    const mockSubmissions = [
      {
        id: 1,
        title: 'Plastic Bottle Collection at Central Park',
        description: 'Collected 15 plastic bottles from the walking trail and disposed them properly in recycling bins.',
        category: 'plastic',
        status: 'approved',
        points: 150,
        location: 'Central Park, New York',
        submittedAt: '2024-01-15T10:30:00Z',
        reviewedAt: '2024-01-16T14:20:00Z',
        videoUrl: '#',
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
      },
      {
        id: 2,
        title: 'Cardboard Recycling at Brooklyn Bridge',
        description: 'Found and recycled 8 cardboard boxes that were left near the bridge entrance.',
        category: 'cardboard',
        status: 'pending',
        points: 75,
        location: 'Brooklyn Bridge, New York',
        submittedAt: '2024-01-14T16:45:00Z',
        reviewedAt: null,
        videoUrl: '#',
        thumbnail: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop'
      },
      {
        id: 3,
        title: 'Aluminum Can Cleanup at Times Square',
        description: 'Picked up 12 aluminum cans and placed them in the appropriate recycling containers.',
        category: 'metal',
        status: 'approved',
        points: 120,
        location: 'Times Square, New York',
        submittedAt: '2024-01-13T12:15:00Z',
        reviewedAt: '2024-01-14T09:30:00Z',
        videoUrl: '#',
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
      },
      {
        id: 4,
        title: 'Organic Waste Composting',
        description: 'Started a small composting project in my backyard for kitchen waste.',
        category: 'organic',
        status: 'rejected',
        points: 0,
        location: 'Queens, New York',
        submittedAt: '2024-01-12T08:20:00Z',
        reviewedAt: '2024-01-13T11:45:00Z',
        videoUrl: '#',
        thumbnail: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
        rejectionReason: 'Video quality too low to verify the composting process'
      },
      {
        id: 5,
        title: 'Plastic Bag Collection at Prospect Park',
        description: 'Collected 25 plastic bags that were stuck in trees and bushes.',
        category: 'plastic',
        status: 'approved',
        points: 200,
        location: 'Prospect Park, Brooklyn',
        submittedAt: '2024-01-11T15:10:00Z',
        reviewedAt: '2024-01-12T13:25:00Z',
        videoUrl: '#',
        thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
      }
    ];

    setSubmissions(mockSubmissions);
    setFilteredSubmissions(mockSubmissions);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = submissions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(submission =>
        submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(submission => submission.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.submittedAt) - new Date(a.submittedAt);
        case 'points':
          return b.points - a.points;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm, statusFilter, categoryFilter, sortBy]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full font-medium";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'plastic':
        return 'bg-blue-100 text-blue-800';
      case 'cardboard':
        return 'bg-orange-100 text-orange-800';
      case 'metal':
        return 'bg-gray-100 text-gray-800';
      case 'organic':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-purple-100 text-purple-800';
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Submissions
        </h1>
        <p className="text-gray-600">
          Track your environmental actions and earned points
        </p>
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Categories</option>
            <option value="plastic">Plastic Waste</option>
            <option value="cardboard">Cardboard/Paper</option>
            <option value="metal">Metal/Glass</option>
            <option value="organic">Organic Waste</option>
            <option value="other">Other</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
          >
            <option value="date">Sort by Date</option>
            <option value="points">Sort by Points</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredSubmissions.length} of {submissions.length} submissions
        </p>
      </div>

      {/* Submissions Grid */}
      {filteredSubmissions.length === 0 ? (
        <div className="card text-center py-12">
          <FunnelIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
          <p className="text-gray-500">
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className="card hover:shadow-lg transition-shadow duration-200">
              {/* Thumbnail */}
              <div className="relative mb-4">
                <img
                  src={submission.thumbnail}
                  alt={submission.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getCategoryColor(submission.category)}`}>
                    {submission.category}
                  </span>
                </div>
                <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg">
                  <PlayIcon className="w-12 h-12 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {submission.title}
                  </h3>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(submission.status)}
                    <span className={getStatusBadge(submission.status)}>
                      {submission.status}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {submission.description}
                </p>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{submission.location}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(submission.submittedAt)}</span>
                </div>

                {submission.status === 'approved' && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Points earned:</span>
                    <span className="text-lg font-bold text-eco-green-600">
                      +{submission.points}
                    </span>
                  </div>
                )}

                {submission.status === 'rejected' && submission.rejectionReason && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-red-600">
                      <span className="font-medium">Reason:</span> {submission.rejectionReason}
                    </p>
                  </div>
                )}

                {submission.status === 'pending' && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-yellow-600">
                      Review in progress...
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
          <div className="text-sm text-gray-600">Total Submissions</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {submissions.filter(s => s.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {submissions.filter(s => s.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-eco-green-600">
            {submissions
              .filter(s => s.status === 'approved')
              .reduce((sum, s) => sum + s.points, 0)
            }
          </div>
          <div className="text-sm text-gray-600">Total Points</div>
        </div>
      </div>
    </div>
  );
};

export default Submissions;