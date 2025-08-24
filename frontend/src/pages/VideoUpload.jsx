import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  CloudArrowUpIcon, 
  VideoCameraIcon, 
  MapPinIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const VideoUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'plastic',
    location: '',
    latitude: null,
    longitude: null
  });
  const [errors, setErrors] = useState({});

  // Redirect if not logged in
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be less than 100MB');
      return;
    }

    setSelectedFile(file);
    setErrors({ ...errors, file: null });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setErrors({
            ...errors,
            location: null
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setErrors({
            ...errors,
            location: 'Unable to get current location. Please enter manually.'
          });
        }
      );
    } else {
      setErrors({
        ...errors,
        location: 'Geolocation is not supported by this browser.'
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedFile) {
      newErrors.file = 'Please select a video file';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setUploading(true);

    try {
      // Mock upload - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful upload
      alert('Video uploaded successfully! You will receive points once it is reviewed.');
      navigate('/submissions');
    } catch (error) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setErrors({ ...errors, file: null });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Environmental Action Video
        </h1>
        <p className="text-gray-600">
          Share your environmental actions and earn points for making our planet cleaner.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Video Upload Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Video
          </h3>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
              dragActive 
                ? 'border-eco-green-400 bg-eco-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!selectedFile ? (
              <div>
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your video here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  MP4, MOV, AVI up to 100MB
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary"
                >
                  Choose Video File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <VideoCameraIcon className="h-8 w-8 text-eco-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                >
                  Choose Different File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            )}
          </div>
          
          {errors.file && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {errors.file}
            </p>
          )}
        </div>

        {/* Video Details Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Video Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`input-field ${errors.title ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="e.g., Plastic Bottle Collection at Central Park"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="plastic">Plastic Waste</option>
                <option value="cardboard">Cardboard/Paper</option>
                <option value="metal">Metal/Glass</option>
                <option value="organic">Organic Waste</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className={`input-field ${errors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
              placeholder="Describe what environmental action you took and its impact..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Location Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Location
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location Name *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`input-field ${errors.location ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="e.g., Central Park, New York"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="btn-secondary flex items-center space-x-2"
              >
                <MapPinIcon className="h-4 w-4" />
                <span>Get Current Location</span>
              </button>
              
              {formData.latitude && formData.longitude && (
                <div className="flex items-center space-x-2 text-sm text-eco-green-600">
                  <CheckIcon className="h-4 w-4" />
                  <span>GPS coordinates captured</span>
                </div>
              )}
            </div>

            {(formData.latitude && formData.longitude) && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Coordinates:</span> {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Upload Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Video should clearly show the environmental action being performed</li>
            <li>• Ensure good lighting and clear audio</li>
            <li>• Keep videos under 5 minutes for faster processing</li>
            <li>• Include location context when possible</li>
            <li>• Videos will be reviewed within 24-48 hours</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              'Upload Video & Earn Points'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VideoUpload;