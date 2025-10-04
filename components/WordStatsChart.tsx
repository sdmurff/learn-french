'use client';

import { useEffect, useState } from 'react';

type WordStats = {
  totalHeard: number;
  distinctHeard: number;
  totalTyped: number;
  distinctTyped: number;
  totalSpoken: number;
  distinctSpoken: number;
  totalReadAloud: number;
  distinctReadAloud: number;
  totalReadSilent: number;
  distinctReadSilent: number;
};

type Goals = {
  session_goal: number;
  weekly_goal: number;
  alltime_goal: number;
};

type Props = {
  userId: string;
  sessionId: string;
};

export default function WordStatsChart({ userId, sessionId }: Props) {
  const [sessionStats, setSessionStats] = useState<WordStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WordStats | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<WordStats | null>(null);
  const [goals, setGoals] = useState<Goals>({ session_goal: 50, weekly_goal: 500, alltime_goal: 5000 });
  const [loading, setLoading] = useState(true);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [editGoals, setEditGoals] = useState(goals);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/word-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionStats(data.session);
        setWeeklyStats(data.weekly);
        setAllTimeStats(data.allTime);
      }
    } catch (error) {
      console.error('Error fetching word stats:', error);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch(`/api/user-goals?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
        setEditGoals(data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGoals = async () => {
    try {
      const res = await fetch('/api/user-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionGoal: editGoals.session_goal,
          weeklyGoal: editGoals.weekly_goal,
          alltimeGoal: editGoals.alltime_goal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGoals(data);
        setShowGoalsModal(false);
      }
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchGoals();
    // Refresh stats every 10 seconds to pick up new tracking
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [userId, sessionId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  const getProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 100) return 'from-green-500 to-emerald-600';
    if (percentage >= 50) return 'from-indigo-500 to-indigo-600';
    return 'from-blue-500 to-blue-600';
  };

  const getTotalWords = (stats: WordStats | null) => {
    if (!stats) return 0;
    return stats.totalHeard + stats.totalTyped + stats.totalSpoken + stats.totalReadAloud + stats.totalReadSilent;
  };

  const renderStatSection = (
    title: string,
    stats: WordStats | null,
    goal: number,
    emoji: string
  ) => {
    const totalWords = getTotalWords(stats);
    const progress = getProgress(totalWords, goal);
    const isGoalMet = totalWords >= goal;

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
          {isGoalMet && <span className="text-2xl">🎉</span>}
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-600 mb-1">🎯 Goal: {goal} words</p>
          <p className="text-2xl font-bold text-indigo-600 mb-1">
            {totalWords} / {goal}
          </p>
          <p className="text-sm text-slate-500">
            {progress.toFixed(0)}% complete
          </p>
        </div>

        {stats && totalWords > 0 ? (
          <div className="space-y-4">
            {/* Heard */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">🎧 Heard</span>
                <span className="text-sm text-slate-600">
                  {stats.totalHeard} ({stats.distinctHeard} unique)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${getProgressColor(stats.totalHeard, goal)} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${getProgress(stats.totalHeard, goal)}%` }}
                />
              </div>
            </div>

            {/* Typed */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">⌨️ Typed</span>
                <span className="text-sm text-slate-600">
                  {stats.totalTyped} ({stats.distinctTyped} unique)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${getProgressColor(stats.totalTyped, goal)} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${getProgress(stats.totalTyped, goal)}%` }}
                />
              </div>
            </div>

            {/* Spoken */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">🎤 Spoken</span>
                <span className="text-sm text-slate-600">
                  {stats.totalSpoken} ({stats.distinctSpoken} unique)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${getProgressColor(stats.totalSpoken, goal)} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${getProgress(stats.totalSpoken, goal)}%` }}
                />
              </div>
            </div>

            {/* Read Aloud */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">🎙️ Read Aloud</span>
                <span className="text-sm text-slate-600">
                  {stats.totalReadAloud} ({stats.distinctReadAloud} unique)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${getProgressColor(stats.totalReadAloud, goal)} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${getProgress(stats.totalReadAloud, goal)}%` }}
                />
              </div>
            </div>

            {/* Read Silently */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">📖 Read Silently</span>
                <span className="text-sm text-slate-600">
                  {stats.totalReadSilent} ({stats.distinctReadSilent} unique)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${getProgressColor(stats.totalReadSilent, goal)} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${getProgress(stats.totalReadSilent, goal)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic">No progress yet. Start practicing!</p>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">📊 Your Progress</h2>
          <button
            onClick={() => setShowGoalsModal(true)}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Edit Goals
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {renderStatSection('This Session', sessionStats, goals.session_goal, '💪')}
            {renderStatSection('This Week', weeklyStats, goals.weekly_goal, '📅')}
            {renderStatSection('All Time', allTimeStats, goals.alltime_goal, '🏆')}
          </div>
        </div>
      </div>

      {/* Goals Modal */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Set Your Goals</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Session Goal (words)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editGoals.session_goal}
                  onChange={(e) => setEditGoals({ ...editGoals, session_goal: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Weekly Goal (words)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editGoals.weekly_goal}
                  onChange={(e) => setEditGoals({ ...editGoals, weekly_goal: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  All-Time Goal (words)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editGoals.alltime_goal}
                  onChange={(e) => setEditGoals({ ...editGoals, alltime_goal: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditGoals(goals);
                  setShowGoalsModal(false);
                }}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveGoals}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Save Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
