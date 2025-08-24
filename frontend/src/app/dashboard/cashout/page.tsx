'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  WalletIcon,
  CreditCardIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const cashoutSchema = z.object({
  points: z.number().min(500, 'Minimum cash-out is 500 points ($5.00)').max(100000, 'Maximum cash-out is 100,000 points ($1,000.00)'),
  method: z.enum(['paypal', 'stripe', 'bank_transfer', 'crypto']),
  destinationRef: z.string().min(1, 'Please provide payment destination'),
});

type CashoutFormData = z.infer<typeof cashoutSchema>;

interface Wallet {
  points_balance: number;
  cash_balance: number;
  locked_amount: number;
}

const PAYMENT_METHODS = [
  {
    id: 'paypal',
    name: 'PayPal',
    icon: CreditCardIcon,
    description: 'Fast and secure PayPal transfer',
    minAmount: 5,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: CreditCardIcon,
    description: 'Direct bank transfer via Stripe',
    minAmount: 10,
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    icon: BanknotesIcon,
    description: 'Traditional bank transfer (3-5 business days)',
    minAmount: 25,
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    icon: CurrencyDollarIcon,
    description: 'Bitcoin, Ethereum, or other supported crypto',
    minAmount: 50,
  },
];

export default function CashoutPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('paypal');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CashoutFormData>({
    resolver: zodResolver(cashoutSchema),
    defaultValues: {
      method: 'paypal',
    },
  });

  const watchedPoints = watch('points');
  const watchedMethod = watch('method');

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    setSelectedMethod(watchedMethod);
  }, [watchedMethod]);

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/users/me/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const walletData = await response.json();
        setWallet(walletData);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  const onSubmit = async (data: CashoutFormData) => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/cashout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: data.points,
          method: data.method,
          destinationRef: data.destinationRef,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create cash-out request');
      }

      const result = await response.json();
      
      toast.success('Cash-out request created successfully! It will be reviewed shortly.');
      
      // Refresh wallet data
      fetchWallet();
      
      // Reset form
      setValue('points', 0);
      setValue('destinationRef', '');
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create cash-out request');
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodIcon = (methodId: string) => {
    const method = PAYMENT_METHODS.find(m => m.id === methodId);
    return method ? method.icon : CreditCardIcon;
  };

  const getMethodInfo = (methodId: string) => {
    return PAYMENT_METHODS.find(m => m.id === methodId);
  };

  const calculateCashAmount = (points: number) => {
    return (points * 0.01).toFixed(2); // 1 point = $0.01
  };

  const getDestinationPlaceholder = (method: string) => {
    switch (method) {
      case 'paypal':
        return 'Enter your PayPal email address';
      case 'stripe':
        return 'Enter your bank account details';
      case 'bank_transfer':
        return 'Enter your bank account number and routing number';
      case 'crypto':
        return 'Enter your cryptocurrency wallet address';
      default:
        return 'Enter payment destination';
    }
  };

  if (!wallet) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const availablePoints = wallet.points_balance - wallet.locked_amount;
  const selectedMethodInfo = getMethodInfo(selectedMethod);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Cash Out Your Eco-Points</h1>
        <p className="text-gray-600 mt-1">
          Convert your earned eco-points to real money and get paid for your environmental contributions.
        </p>
      </div>

      {/* Wallet Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Wallet</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{availablePoints}</div>
            <div className="text-sm text-gray-500">Available Points</div>
            <div className="text-xs text-gray-400 mt-1">Ready for cash-out</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600">${wallet.cash_balance.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Total Earned</div>
            <div className="text-xs text-gray-400 mt-1">Lifetime earnings</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning-600">${wallet.locked_amount.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Locked Amount</div>
            <div className="text-xs text-gray-400 mt-1">Pending transactions</div>
          </div>
        </div>
      </div>

      {/* Cash-out Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Cash-Out</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Points Input */}
          <div>
            <label htmlFor="points" className="form-label">
              Points to Convert
            </label>
            <div className="relative">
              <input
                id="points"
                type="number"
                {...register('points', { valueAsNumber: true })}
                className={`form-input pr-20 ${errors.points ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
                placeholder="Enter number of points"
                min="500"
                max="100000"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">
                = ${watchedPoints ? calculateCashAmount(watchedPoints) : '0.00'}
              </div>
            </div>
            {errors.points && (
              <p className="form-error">{errors.points.message}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Available: {availablePoints} points • Min: 500 points • Max: 100,000 points
            </p>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="form-label">Payment Method</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = watchedMethod === method.id;
                const isDisabled = availablePoints * 0.01 < method.minAmount;

                return (
                  <label
                    key={method.id}
                    className={`relative flex cursor-pointer rounded-lg border p-4 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      {...register('method')}
                      value={method.id}
                      className="sr-only"
                      disabled={isDisabled}
                    />
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <Icon className="h-6 w-6 text-primary-600" />
                          <p className="font-medium text-gray-900">{method.name}</p>
                          <p className="text-gray-500">{method.description}</p>
                          <p className="text-xs text-gray-400">Min: ${method.minAmount}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircleIcon className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.method && (
              <p className="form-error">{errors.method.message}</p>
            )}
          </div>

          {/* Destination Reference */}
          <div>
            <label htmlFor="destinationRef" className="form-label">
              Payment Destination
            </label>
            <input
              id="destinationRef"
              type="text"
              {...register('destinationRef')}
              className={`form-input ${errors.destinationRef ? 'border-error-300 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder={getDestinationPlaceholder(selectedMethod)}
            />
            {errors.destinationRef && (
              <p className="form-error">{errors.destinationRef.message}</p>
            )}
            {selectedMethodInfo && (
              <p className="text-sm text-gray-500 mt-1">
                {selectedMethodInfo.description}
              </p>
            )}
          </div>

          {/* Important Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Cash-out requests are reviewed within 24-48 hours</li>
                    <li>Processing times vary by payment method</li>
                    <li>Minimum cash-out amount is $5.00 (500 points)</li>
                    <li>Maximum cash-out amount is $1,000.00 (100,000 points)</li>
                    <li>Points are locked during processing and cannot be used for other purposes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || availablePoints < 500}
              className="btn btn-primary btn-lg"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Request Cash-Out'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Cash-out Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Cash-out Requests</h2>
        <div className="text-center py-8 text-gray-500">
          <WalletIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No cash-out requests yet</p>
          <p className="text-sm">Your cash-out history will appear here</p>
        </div>
      </div>
    </div>
  );
}