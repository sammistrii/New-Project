'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon, 
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface VideoSubmission {
  id: string;
  title: string;
  description: string;
  status: 'queued' | 'auto_verified' | 'needs_review' | 'approved' | 'rejected';
  auto_score: number;
  duration_s: number;
  size_bytes: number;
  gps_lat: number;
  gps_lng: number;
  recorded_at: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  rejection_reason?: string;
  s3_key: string;
  thumb_key: string;
}

interface ModerationStats {
  total: number;
  queued: number;
  needs_review: number;
  approved: number;
  rejected: number;
}

export default function AdminModerationPage() {
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);
  const [stats, setStats] = useState<ModerationStats>({
    total: 0,
    queued: 0,
    needs_review: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<VideoSubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'queued' | 'needs_review'>('all');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchModerationQueue();
    fetchStats();
  }, [filter]);

  const fetchModerationQueue = async () => {
    try {
      const response = await fetch(`/api/submissions/moderation-queue?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        toast.error('Failed to fetch moderation queue');
      }
    } catch (error) {
      toast.error('Error fetching moderation queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/submissions/stats', {
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
    }
  };

  const handleApprove = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Submission approved successfully');
        fetchModerationQueue();
        fetchStats();
        setSelectedSubmission(null);
      } else {
        toast.error('Failed to approve submission');
      }
    } catch (error) {
      toast.error('Error approving submission');
    }
  };

  const handleReject = async (submissionId: string, reason: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: reason })
      });

      if (response.ok) {
        toast.success('Submission rejected successfully');
        fetchModerationQueue();
        fetchStats();
        setSelectedSubmission(null);
        setRejectionReason('');
      } else {
        toast.error('Failed to reject submission');
      }
    } catch (error) {
      toast.error('Error rejecting submission');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      queued: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      auto_verified: { color: 'bg-green-100 text-green-800', icon: CheckIcon },
      needs_review: { color: 'bg-orange-100 text-orange-800', icon: ExclamationTriangleIcon },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckIcon },
      rejected: { color: 'bg-red-100 text-red-800', icon: XMarkIcon }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Moderation Queue</h1>
          <p className="mt-2 text-gray-600">Review and moderate video submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
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
                <p className="text-sm font-medium text-gray-600">Queued</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.queued}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Needs Review</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.needs_review}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XMarkIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by status:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="queued">Queued</option>
                <option value="needs_review">Needs Review</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Submissions ({submissions.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {submissions.map((submission) => (
              <div key={submission.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={`/api/storage/thumbnail/${submission.thumb_key}`}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{submission.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{submission.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(submission.status)}
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Review
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">User:</span>
                        <span className="ml-2 font-medium">{submission.user.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 font-medium">{formatDuration(submission.duration_s)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <span className="ml-2 font-medium">{formatFileSize(submission.size_bytes)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Auto Score:</span>
                        <span className={`ml-2 font-medium ${getScoreColor(submission.auto_score)}`}>
                          {submission.auto_score}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {submission.gps_lat.toFixed(6)}, {submission.gps_lng.toFixed(6)}
                      <span className="mx-2">•</span>
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {new Date(submission.recorded_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {submissions.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No submissions found for the selected filter.
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Review Submission</h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Video Player */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <video
                    controls
                    className="w-full rounded-lg"
                    src={`/api/storage/video/${selectedSubmission.s3_key}`}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Submission Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Title:</span>
                    <span className="ml-2 font-medium">{selectedSubmission.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">User:</span>
                    <span className="ml-2 font-medium">{selectedSubmission.user.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Auto Score:</span>
                    <span className={`ml-2 font-medium ${getScoreColor(selectedSubmission.auto_score)}`}>
                      {selectedSubmission.auto_score}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 font-medium">{formatDuration(selectedSubmission.duration_s)}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {selectedSubmission.gps_lat.toFixed(6)}, {selectedSubmission.gps_lng.toFixed(6)}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Recorded: {new Date(selectedSubmission.recorded_at).toLocaleString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedSubmission.id)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  
                  <button
                    onClick={() => {
                      if (rejectionReason.trim()) {
                        handleReject(selectedSubmission.id, rejectionReason);
                      } else {
                        toast.error('Please provide a rejection reason');
                      }
                    }}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </div>

                {/* Rejection Reason Input */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (required for rejection)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter reason for rejection..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}