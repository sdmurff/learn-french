'use client';

import Link from 'next/link';

type PaywallModalProps = {
  isOpen: boolean;
  onClose: () => void;
  attemptsUsed: number;
  dailyLimit: number;
};

export default function PaywallModal({ isOpen, onClose, attemptsUsed, dailyLimit }: PaywallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Daily Limit Reached
          </h2>
          <p className="text-slate-600 mb-6">
            You've used {attemptsUsed} of {dailyLimit} free attempts today.
          </p>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Upgrade to Premium
            </h3>
            <ul className="text-left space-y-2 mb-4">
              <li className="flex items-center gap-2 text-slate-700">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited practice attempts
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                7-day free trial
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cancel anytime
              </li>
            </ul>
            <div className="text-2xl font-bold text-indigo-600">
              $9.99<span className="text-sm font-normal text-slate-600">/month</span>
            </div>
          </div>

          <Link
            href="/pricing"
            className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-all mb-3"
          >
            Upgrade Now
          </Link>

          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-800 text-sm"
          >
            Maybe later
          </button>

          <p className="text-xs text-slate-500 mt-4">
            Your free attempts will reset tomorrow
          </p>
        </div>
      </div>
    </div>
  );
}
