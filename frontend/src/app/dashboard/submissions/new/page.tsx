'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CloudArrowUpIcon,
  MapPinIcon,
  VideoCameraIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const uploadSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description cannot exceed 500 characters'),
  location: z.string().min(1, 'Please provide a location'),
  recordedAt: z.string().min(1, 'Please provide the recording date and time'),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadedFile {
  file: File;
  preview: string;
  uploadProgress: number;
  status: 'uploading' | 'success' | 'error';
}

export default function NewSubmissionPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    mode: 'onChange',
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file size must be less than 100MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setUploadedFile({
      file,
      preview,
      uploadProgress: 0,
      status: 'uploading',
    });

    // Simulate upload progress
    simulateUpload();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const simulateUpload = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        setUploadedFile(prev => prev ? { ...prev, uploadProgress: progress, status: 'success' } : null);
        clearInterval(interval);
        toast.success('Video uploaded successfully!');
      } else {
        setUploadedFile(prev => prev ? { ...prev, uploadProgress: progress } : null);
      }
    }, 200);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLocation({ lat: latitude, lng: longitude });
        toast.success('Location captured successfully!');
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Failed to get your location. Please enter it manually.');
      }
    );
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!uploadedFile || uploadedFile.status !== 'success') {
      toast.error('Please upload a video first');
      return;
    }

    if (!gpsLocation) {
      toast.error('Please capture your location');
      return;
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('video', uploadedFile.file);
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('location', data.location);
      formData.append('recordedAt', data.recordedAt);
      formData.append('gpsLat', gpsLocation.lat.toString());
      formData.append('gpsLng', gpsLocation.lng.toString());

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit video');
      }

      toast.success('Video submitted successfully! It will be reviewed shortly.');
      router.push('/dashboard/submissions');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit video');
    } finally {
      setIsUploading(false);
    }
  };

  const steps = [
    { id: 1, name: 'Upload Video', status: uploadedFile ? 'complete' : 'current' },
    { id: 2, name: 'Add Details', status: uploadedFile && currentStep >= 2 ? 'current' : 'upcoming' },
    { id: 3, name: 'Submit', status: uploadedFile && currentStep >= 3 ? 'current' : 'upcoming' },
  ];

  const getStepStatus = (step: any) => {
    if (step.status === 'complete') {
      return <CheckCircleIcon className="h-6 w-6 text-success-500" />;
    } else if (step.status === 'current') {
      return <div className="h-6 w-6 rounded-full border-2 border-primary-500 bg-primary-500 text-white flex items-center justify-center text-xs font-bold">{step.id}</div>;
    } else {
      return <div className="h-6 w-6 rounded-full border-2 border-gray-300 bg-gray-50 text-gray-500 flex items-center justify-center text-xs font-bold">{step.id}</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit New Video</h1>
        <p className="text-gray-600 mt-1">
          Share your eco-friendly action and earn points for making a difference.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-center space-x-8">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className="flex items-center">
                <div className="flex items-center">
                  {getStepStatus(step)}
                  <span className={`ml-3 text-sm font-medium ${
                    step.status === 'complete' ? 'text-success-600' :
                    step.status === 'current' ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="ml-8 h-0.5 w-16 bg-gray-200" />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step 1: Video Upload */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Your Video</h2>
          
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop the video here' : 'Drag & drop your video here'}
                </p>
                <p className="text-gray-500 mt-1">
                  or click to browse files
                </p>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p>Supported formats: MP4, MOV, AVI, MKV, WebM</p>
                <p>Maximum file size: 100MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <VideoCameraIcon className="h-12 w-12 text-primary-500" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{uploadedFile.file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <div className="text-right">
                  {uploadedFile.status === 'uploading' && (
                    <div className="text-sm text-warning-600">Uploading...</div>
                  )}
                  {uploadedFile.status === 'success' && (
                    <div className="text-sm text-success-600">Uploaded!</div>
                  )}
                </div>
              </div>

              {uploadedFile.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadedFile.uploadProgress}%` }}
                  />
                </div>
              )}

              {uploadedFile.status === 'success' && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="btn btn-primary"
                  >
                    Continue to Details
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Video Details */}
      {currentStep === 2 && uploadedFile && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Details</h2>
          
          <form className="space-y-6" onSubmit={handleSubmit(() => setCurrentStep(3))}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="form-label">
                  Video Title
                </label>
                <input
                  id="title"
                  type="text"
                  {...register('title')}
                  className={`form-input ${errors.title ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="Describe your eco-friendly action"
                />
                {errors.title && (
                  <p className="form-error">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="location" className="form-label">
                  Location
                </label>
                <div className="flex space-x-2">
                  <input
                    id="location"
                    type="text"
                    {...register('location')}
                    className={`form-input flex-1 ${errors.location ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="e.g., Hyde Park, London"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="btn btn-secondary px-3"
                    title="Get current location"
                  >
                    <MapPinIcon className="h-5 w-5" />
                  </button>
                </div>
                {errors.location && (
                  <p className="form-error">{errors.location.message}</p>
                )}
                {gpsLocation && (
                  <p className="text-sm text-success-600 mt-1">
                    ✓ Location captured: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                {...register('description')}
                className={`form-input ${errors.description ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                placeholder="Explain what eco-friendly action you performed and how it helps the environment..."
              />
              {errors.description && (
                <p className="form-error">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="recordedAt" className="form-label">
                When was this recorded?
              </label>
              <input
                id="recordedAt"
                type="datetime-local"
                {...register('recordedAt')}
                className={`form-input ${errors.recordedAt ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
              />
              {errors.recordedAt && (
                <p className="form-error">{errors.recordedAt.message}</p>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!isValid || !gpsLocation}
                className="btn btn-primary"
              >
                Continue to Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {currentStep === 3 && uploadedFile && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h2>
          
          <div className="space-y-6">
            {/* Video Preview */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">Video Preview</h3>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <VideoCameraIcon className="h-8 w-8 text-primary-500" />
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Details */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">Submission Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium">{watch('title')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{watch('location')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GPS Coordinates:</span>
                  <span className="font-medium text-sm">
                    {gpsLocation ? `${gpsLocation.lat.toFixed(6)}, ${gpsLocation.lng.toFixed(6)}` : 'Not captured'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recorded:</span>
                  <span className="font-medium">{watch('recordedAt')}</span>
                </div>
              </div>
            </div>

            {/* Guidelines Reminder */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Submission Guidelines</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ensure your video clearly shows the eco-friendly action</li>
                      <li>Video should be at least 10 seconds long</li>
                      <li>Location must be within a registered bin area</li>
                      <li>Action must be performed within the last 24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary"
              >
                Back to Details
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isUploading}
                className="btn btn-primary btn-lg"
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Video'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}