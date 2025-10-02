'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Practice
          </Link>
        </div>

        <header className="text-center mb-16">
          <span className="text-6xl mb-4 block">🇫🇷</span>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-slate-600">
            Start with a 7-day free trial, cancel anytime
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-slate-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-slate-900 mb-2">
                $0
                <span className="text-lg font-normal text-slate-600">/month</span>
              </div>
              <p className="text-slate-600">Perfect for trying out</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700">5 practice attempts per day</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700">All difficulty levels (A1-C2)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700">All themes</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700">Pronunciation checking</span>
              </li>
            </ul>

            <Link
              href={user ? "/" : "/signup"}
              className="block w-full bg-slate-200 text-slate-800 py-3 px-6 rounded-xl font-semibold text-center hover:bg-slate-300 transition-all"
            >
              {user ? 'Current Plan' : 'Get Started'}
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 border-2 border-indigo-400 relative">
            <div className="absolute top-0 right-8 -translate-y-1/2">
              <span className="bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <div className="text-4xl font-bold text-white mb-2">
                $9.99
                <span className="text-lg font-normal text-indigo-100">/month</span>
              </div>
              <p className="text-indigo-100">7-day free trial</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white font-semibold">Unlimited practice attempts</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">All difficulty levels (A1-C2)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">All themes</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Pronunciation checking</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Progress tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-white">Cancel anytime</span>
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!)}
              disabled={loading}
              className="w-full bg-white text-indigo-600 py-3 px-6 rounded-xl font-semibold hover:bg-indigo-50 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Start Free Trial'}
            </button>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-4">
            All plans include access to our full library of French sentences and exercises
          </p>
          <p className="text-sm text-slate-500">
            No credit card required for free plan • Cancel premium anytime
          </p>
        </div>
      </div>
    </main>
  );
}
