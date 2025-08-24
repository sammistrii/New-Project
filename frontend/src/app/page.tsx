'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  PlayCircleIcon, 
  MapPinIcon, 
  CurrencyDollarIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const features = [
    {
      icon: PlayCircleIcon,
      title: 'Video Submissions',
      description: 'Upload videos of your eco-friendly actions and earn points automatically',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      icon: MapPinIcon,
      title: 'GPS Verification',
      description: 'Automatic location validation against registered bin locations',
      color: 'text-eco-600',
      bgColor: 'bg-eco-50',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Instant Cash-Out',
      description: 'Convert your eco-points to real money through secure payment gateways',
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Fraud Prevention',
      description: 'Advanced AI detection and human moderation for quality control',
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
    {
      icon: ChartBarIcon,
      title: 'Real-time Analytics',
      description: 'Track your impact and view community participation metrics',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: UserGroupIcon,
      title: 'Community Building',
      description: 'Join a network of environmentally conscious individuals',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  const stats = [
    { label: 'Active Users', value: '2,500+', change: '+12%' },
    { label: 'Videos Processed', value: '15,000+', change: '+25%' },
    { label: 'Points Awarded', value: '500K+', change: '+18%' },
    { label: 'Cash Payouts', value: '$25K+', change: '+30%' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-eco-500 rounded-lg"></div>
              <span className="text-xl font-bold eco-gradient-text">EcoPoints</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
                How it Works
              </Link>
              <Link href="#stats" className="text-gray-600 hover:text-gray-900 transition-colors">
                Impact
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="btn btn-secondary">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Turn Your{' '}
              <span className="eco-gradient-text">Eco Actions</span>
              <br />
              Into Real Rewards
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload videos of your sustainable actions, earn eco-points automatically, 
              and cash out for real money. Join thousands of people making a difference 
              while earning rewards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="btn btn-primary btn-lg group">
                Start Earning Today
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                className="btn btn-secondary btn-lg"
              >
                <PlayCircleIcon className="mr-2 h-5 w-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-eco-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-success-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools and features needed 
              to make your eco-friendly actions count and earn rewards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className={`p-6 rounded-xl ${feature.bgColor} group-hover:shadow-lg transition-all duration-300`}>
                  <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in just three simple steps and start earning rewards immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Record & Upload',
                description: 'Record a video of your eco-friendly action and upload it through our secure platform.',
                icon: '📱',
              },
              {
                step: '2',
                title: 'Auto-Verification',
                description: 'Our AI system automatically verifies your submission and awards eco-points.',
                icon: '🤖',
              },
              {
                step: '3',
                title: 'Cash Out',
                description: 'Convert your accumulated points to real money through our payment system.',
                icon: '💰',
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how our community is making a real difference in environmental sustainability.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 mb-1">{stat.label}</div>
                <div className="text-sm text-success-600 font-medium">
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-eco-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of people who are already making money while helping the environment.
          </p>
          <Link href="/auth/register" className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100">
            Create Your Account
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-eco-500 rounded-lg"></div>
                <span className="text-xl font-bold">EcoPoints</span>
              </div>
              <p className="text-gray-400">
                Making sustainability profitable through innovative technology and community engagement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">System Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EcoPoints. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}