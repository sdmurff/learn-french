'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type AttemptStats = {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  recentAttempts: {
    sentence: string;
    score: number;
    created_at: string;
  }[];
};

type SubscriptionData = {
  subscription_status: string;
  trial_end_date: string | null;
  current_period_end: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AttemptStats | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchUserStats();
      fetchSubscription();
    }
  }, [user, authLoading, router]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, trial_end_date, current_period_end')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    setPortalLoading(true);

    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to open subscription management. Please try again.');
      setPortalLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch all user attempts
      const { data: attempts, error } = await supabase
        .from('attempts')
        .select('*, sentences(text)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (attempts && attempts.length > 0) {
        const totalAttempts = attempts.length;
        const averageScore = attempts.reduce((sum, att) => sum + att.score, 0) / totalAttempts;
        const bestScore = Math.max(...attempts.map(att => att.score));

        const recentAttempts = attempts.slice(0, 5).map(att => ({
          sentence: (att.sentences as any)?.text || 'Unknown',
          score: att.score,
          created_at: att.created_at,
        }));

        setStats({
          totalAttempts,
          averageScore: Math.round(averageScore),
          bestScore,
          recentAttempts,
        });
      } else {
        setStats({
          totalAttempts: 0,
          averageScore: 0,
          bestScore: 0,
          recentAttempts: [],
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </main>
    );
  }

  if (!user) return null;

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

        <header className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Your Profile</h1>
          <p className="text-lg text-slate-600">{user.email}</p>
        </header>

        {/* Subscription Status */}
        {subscription && (
          <div className="mb-12 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Subscription Status</h2>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    subscription.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                    subscription.subscription_status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                    subscription.subscription_status === 'past_due' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {subscription.subscription_status === 'active' ? 'Premium Active' :
                     subscription.subscription_status === 'trialing' ? 'Free Trial' :
                     subscription.subscription_status === 'past_due' ? 'Payment Due' :
                     'Free Plan'}
                  </span>
                  {subscription.trial_end_date && new Date(subscription.trial_end_date) > new Date() && (
                    <span className="text-sm text-slate-600">
                      Trial ends {new Date(subscription.trial_end_date).toLocaleDateString()}
                    </span>
                  )}
                  {subscription.current_period_end && (
                    <span className="text-sm text-slate-600">
                      Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {(subscription.subscription_status === 'active' ||
                  subscription.subscription_status === 'trialing' ||
                  subscription.subscription_status === 'past_due') ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {portalLoading ? 'Loading...' : 'Manage Subscription'}
                  </button>
                ) : (
                  <Link
                    href="/pricing"
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
                  >
                    Upgrade to Premium
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {stats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Total Attempts
                </div>
                <div className="text-4xl font-bold text-indigo-600">
                  {stats.totalAttempts}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Average Score
                </div>
                <div className="text-4xl font-bold text-green-600">
                  {stats.averageScore}%
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Best Score
                </div>
                <div className="text-4xl font-bold text-purple-600">
                  {stats.bestScore}%
                </div>
              </div>
            </div>

            {/* Recent Attempts */}
            {stats.recentAttempts.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900">Recent Attempts</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Sentence
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recentAttempts.map((attempt, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-900 font-mono max-w-md truncate">
                            {attempt.sentence}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              attempt.score >= 80 ? 'bg-green-100 text-green-800' :
                              attempt.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {attempt.score}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(attempt.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <p className="text-slate-600 text-lg">No attempts yet. Start practicing to see your progress!</p>
                <Link
                  href="/"
                  className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Start Practicing
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
