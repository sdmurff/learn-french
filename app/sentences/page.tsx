'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

type Sentence = {
  id: string;
  text: string;
  translation?: string;
  difficulty: string;
  theme: string;
  created_at: string;
};

type WordStat = {
  word: string;
  timesHeard: number;
  timesTyped: number;
  timesSpoken: number;
  timesReadAloud: number;
  timesReadSilent: number;
  totalInteractions: number;
  lastSeen: string;
};

export default function SentencesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sentences' | 'words'>('sentences');

  // Sentences state
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [sentencesLoading, setSentencesLoading] = useState(true);

  // Words state
  const [words, setWords] = useState<WordStat[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('timesHeard');
  const [filterBy, setFilterBy] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWords, setTotalWords] = useState(0);

  useEffect(() => {
    fetchSentences();
  }, []);

  useEffect(() => {
    if (activeTab === 'words' && user) {
      fetchWords();
    }
  }, [activeTab, sortBy, filterBy, searchQuery, currentPage, user]);

  const fetchSentences = async () => {
    try {
      const res = await fetch('/api/list-sentences');
      const data = await res.json();
      setSentences(data.sentences || []);
    } catch (error) {
      console.error('Error fetching sentences:', error);
    } finally {
      setSentencesLoading(false);
    }
  };

  const fetchWords = async () => {
    if (!user) return;

    setWordsLoading(true);
    try {
      const res = await fetch('/api/word-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          sortBy,
          filterBy: filterBy || undefined,
          searchQuery: searchQuery || undefined,
          page: currentPage,
          pageSize: 50,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setWords(data.words);
        setTotalPages(data.pagination.totalPages);
        setTotalWords(data.pagination.totalWords);
      }
    } catch (error) {
      console.error('Error fetching word history:', error);
    } finally {
      setWordsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return diffMins === 0 ? 'Just now' : `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">History</h1>
          <p className="text-lg text-slate-600">
            {activeTab === 'sentences'
              ? 'All generated sentences from your practice sessions'
              : 'Track every word you\'ve heard, typed, and spoken'
            }
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab('sentences')}
                className={`pb-4 px-2 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'sentences'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                📝 Sentences
              </button>
              <button
                onClick={() => setActiveTab('words')}
                className={`pb-4 px-2 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'words'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                📚 Word History
              </button>
            </nav>
          </div>
        </div>

        {/* Sentences Tab */}
        {activeTab === 'sentences' && (
          <>
            {sentencesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : sentences.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <p className="text-slate-600 text-lg">No sentences yet. Start practicing to see your history!</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Sentence
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Theme
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sentences.map((sentence) => (
                        <tr key={sentence.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-900 font-mono">
                            <div>{sentence.text}</div>
                            {sentence.translation && (
                              <div className="text-xs text-slate-500 mt-1 italic font-sans">
                                {sentence.translation}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                              {sentence.difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {sentence.theme}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(sentence.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Words Tab */}
        {activeTab === 'words' && (
          <>
            {!user ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <p className="text-slate-600 text-lg">Please sign in to view your word history.</p>
              </div>
            ) : (
              <>
                {/* Summary and Controls */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <div className="mb-6">
                    <p className="text-lg font-semibold text-slate-900">
                      Total Words Tracked: <span className="text-indigo-600">{totalWords}</span> distinct words
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Filter */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Action</label>
                      <select
                        value={filterBy}
                        onChange={(e) => { setFilterBy(e.target.value); setCurrentPage(1); }}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">All Actions</option>
                        <option value="heard">🎧 Heard</option>
                        <option value="typed">⌨️ Typed</option>
                        <option value="spoken">🎤 Spoken</option>
                        <option value="read_aloud">🎙️ Read Aloud</option>
                        <option value="read_silent">📖 Read Silently</option>
                      </select>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Sort by</label>
                      <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="timesHeard">Most Heard</option>
                        <option value="timesTyped">Most Typed</option>
                        <option value="timesSpoken">Most Spoken</option>
                        <option value="timesReadAloud">Most Read Aloud</option>
                        <option value="timesReadSilent">Most Read Silently</option>
                        <option value="totalInteractions">Total Interactions</option>
                        <option value="alphabetical">Alphabetical</option>
                        <option value="lastSeen">Recently Seen</option>
                      </select>
                    </div>

                    {/* Search */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder="Search for a word..."
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Words Table */}
                {wordsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : words.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <p className="text-slate-600 text-lg">
                      {searchQuery || filterBy
                        ? 'No words found matching your criteria.'
                        : 'No words tracked yet. Start practicing to build your word history!'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Word
                              </th>
                              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                🎧 Heard
                              </th>
                              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                ⌨️ Typed
                              </th>
                              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                🎤 Spoken
                              </th>
                              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                🎙️ Read Aloud
                              </th>
                              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                📖 Read Silently
                              </th>
                              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Total
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Last Seen
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {words.map((word, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-slate-900 font-semibold font-mono">
                                  {word.word}
                                </td>
                                <td className="px-6 py-4 text-center text-slate-700">
                                  {word.timesHeard}
                                </td>
                                <td className="px-6 py-4 text-center text-slate-700">
                                  {word.timesTyped}
                                </td>
                                <td className="px-6 py-4 text-center text-slate-700">
                                  {word.timesSpoken}
                                </td>
                                <td className="px-6 py-4 text-center text-slate-700">
                                  {word.timesReadAloud}
                                </td>
                                <td className="px-6 py-4 text-center text-slate-700">
                                  {word.timesReadSilent}
                                </td>
                                <td className="px-6 py-4 text-center font-semibold text-indigo-600">
                                  {word.totalInteractions}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                  {formatDate(word.lastSeen)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-6 flex items-center justify-center gap-4">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ← Previous
                        </button>
                        <span className="text-sm text-slate-600">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
