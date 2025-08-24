'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  VideoCameraIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Submission {
  id: string;
  status: string;
  created_at: string;
  auto_score?: number;
  rejection_reason?: string;
  thumb_key?: string;
  duration_s?: number;
  size_bytes?: number;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const url = filter === 'all' 
        ? '/api/submissions' 
        : `/api/submissions?status=${filter}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/submissions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Submission deleted successfully');
        fetchSubmissions(); // Refresh the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete submission');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete submission');
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

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (searchTerm) {
      return submission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
             submission.status.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
            <p className="text-gray-600 mt-1">
              Track the status of your eco-friendly action videos
            </p>
          </div>
          <Link
            href="/dashboard/submissions/new"
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Upload New Video
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">All Submissions</option>
              <option value="queued">Queued</option>
              <option value="needs_review">Needs Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredSubmissions.length} Submission{filteredSubmissions.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No submissions found' : 'No submissions yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : 'Get started by uploading your first eco-friendly action video'
              }
            </p>
            {!searchTerm && (
              <Link href="/dashboard/submissions/new" className="btn btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Upload Your First Video
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Status Icon */}
                    {getStatusIcon(submission.status)}
                    
                    {/* Submission Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          Video Submission
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {getStatusText(submission.status)}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Submitted: {formatDate(submission.created_at)}</span>
                        {submission.duration_s && (
                          <span>Duration: {formatDuration(submission.duration_s)}</span>
                        )}
                        {submission.size_bytes && (
                          <span>Size: {formatFileSize(submission.size_bytes)}</span>
                        )}
                        {submission.auto_score && (
                          <span>Score: {(submission.auto_score * 100).toFixed(0)}%</span>
                        )}
                      </div>

                      {submission.rejection_reason && (
                        <div className="mt-2 text-sm text-error-600">
                          <strong>Rejection Reason:</strong> {submission.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/submissions/${submission.id}`}
                      className="btn btn-secondary btn-sm"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    
                    {submission.status === 'queued' && (
                      <button
                        onClick={() => deleteSubmission(submission.id)}
                        className="btn btn-error btn-sm"
                        title="Delete Submission"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {submissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{submissions.length}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">
                {submissions.filter(s => s.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-500">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600">
                {submissions.filter(s => ['queued', 'needs_review'].includes(s.status)).length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-error-600">
                {submissions.filter(s => s.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-500">Rejected</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}