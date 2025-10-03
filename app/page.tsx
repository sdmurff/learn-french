'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PaywallModal from '@/components/PaywallModal';
import WordStatsChart from '@/components/WordStatsChart';

type Sentence = {
  id: string;
  text: string;
  difficulty: string;
  theme: string;
  audioUrl?: string;
};

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const TOPICS = ['General', 'Travel', 'Food', 'Daily Life'];

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [cefrLevel, setCefrLevel] = useState('A1');
  const [topic, setTopic] = useState('General');
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [allSentences, setAllSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [attemptText, setAttemptText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [writtenScore, setWrittenScore] = useState<number | null>(null);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [checkingPronunciation, setCheckingPronunciation] = useState(false);
  const [repeatCount, setRepeatCount] = useState(1);
  const [currentRepeat, setCurrentRepeat] = useState(0);

  // Flow control: listen -> speak -> type
  const [hasListened, setHasListened] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);

  // Usage tracking
  const [usageData, setUsageData] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Word tracking
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const recordedAudioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);

  // Load sentence on mount
  useEffect(() => {
    loadInitialSentence();
    fetchAllSentences();
  }, []);

  // Check usage on mount and when user changes
  useEffect(() => {
    if (user) {
      checkUsage();
    }
  }, [user]);

  const checkUsage = async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/check-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      setUsageData(data);
    } catch (error) {
      console.error('Error checking usage:', error);
    }
  };

  const trackWords = async (text: string, actionType: 'heard' | 'typed' | 'spoken', repeatCount = 1) => {
    if (!user || !text) return;

    try {
      await fetch('/api/track-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          sessionId,
          text,
          actionType,
          sentenceId: sentence?.id,
          repeatCount,
        }),
      });
    } catch (error) {
      console.error('Error tracking words:', error);
    }
  };

  // Debug: Log when audioUrl or loading changes
  useEffect(() => {
    console.log('State changed:', { audioUrl, loading, hasListened, hasSpoken });
  }, [audioUrl, loading, hasListened, hasSpoken]);

  const loadInitialSentence = async () => {
    setLoading(true);
    console.log('Loading initial sentence...');
    try {
      const res = await fetch('/api/random-sentence');
      const data = await res.json();
      console.log('Received data:', data);

      if (data.sentence) {
        setSentence(data.sentence);
        setAudioUrl(data.sentence.audioUrl);
        console.log('Set sentence and audioUrl:', {
          sentenceId: data.sentence.id,
          audioUrl: data.sentence.audioUrl,
        });
      } else {
        // Database is empty, generate a new sentence
        console.log('No sentence in database, generating new one');
        await generateNewSentence();
      }
    } catch (error) {
      console.error('Error loading sentence:', error);
    } finally {
      setLoading(false);
      console.log('Loading complete, loading state set to false');
    }
  };

  const fetchAllSentences = async () => {
    try {
      const res = await fetch('/api/list-sentences');
      const data = await res.json();
      setAllSentences(data.sentences || []);
    } catch (error) {
      console.error('Error fetching sentences:', error);
    }
  };

  const generateNewSentence = async () => {
    setLoading(true);
    resetState();

    try {
      const sentenceRes = await fetch('/api/generate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: cefrLevel, theme: topic }),
      });

      if (!sentenceRes.ok) throw new Error('Failed to generate sentence');

      const sentenceData = await sentenceRes.json();
      setSentence(sentenceData);

      const audioRes = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentenceId: sentenceData.id,
          text: sentenceData.text,
        }),
      });

      if (!audioRes.ok) throw new Error('Failed to generate audio');

      const audioData = await audioRes.json();
      setAudioUrl(audioData.audioUrl);

      // Refresh sentence list
      await fetchAllSentences();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate sentence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateSentence = (direction: 'prev' | 'next') => {
    if (allSentences.length === 0) return;

    let newIndex = currentIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allSentences.length - 1;
    } else {
      newIndex = currentIndex < allSentences.length - 1 ? currentIndex + 1 : 0;
    }

    setCurrentIndex(newIndex);
    const newSentence = allSentences[newIndex];
    setSentence(newSentence);
    setAudioUrl(newSentence.audioUrl || null);
    resetState();
  };

  const resetState = () => {
    setAttemptText('');
    setTranscription('');
    setWrittenScore(null);
    setPronunciationScore(null);
    setRecordedAudioUrl(null);
    recordedBlobRef.current = null;
    setHasListened(false);
    setHasSpoken(false);
  };

  const handlePlayAudio = async () => {
    if (audioRef.current && sentence) {
      setIsPlaying(true);
      setCurrentRepeat(0);

      for (let i = 0; i < repeatCount; i++) {
        setCurrentRepeat(i + 1);
        audioRef.current.currentTime = 0;
        await audioRef.current.play();

        // Wait for audio to finish
        await new Promise<void>((resolve) => {
          const handleEnd = () => {
            audioRef.current?.removeEventListener('ended', handleEnd);
            resolve();
          };
          audioRef.current?.addEventListener('ended', handleEnd);
        });

        // Add 1 second delay between repeats (except after the last one)
        if (i < repeatCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setIsPlaying(false);
      setHasListened(true);
      setCurrentRepeat(0);

      // Track words heard (with repeat count)
      await trackWords(sentence.text, 'heard', repeatCount);
    }
  };

  const handleAudioEnded = () => {
    // Handled in handlePlayAudio now
  };

  const startRecording = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');

      const builtInMic = audioInputs.find(device =>
        device.label.toLowerCase().includes('built-in') ||
        device.label.toLowerCase().includes('internal')
      );

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: builtInMic ? {
          deviceId: { exact: builtInMic.deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        recordedBlobRef.current = audioBlob;
        setRecordedAudioUrl(audioUrl);
        setHasSpoken(true);
        stream.getTracks().forEach(track => track.stop());

        // Auto-grade pronunciation
        if (sentence) {
          handleCheckPronunciation();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please allow microphone permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playRecording = () => {
    if (recordedAudioRef.current) {
      recordedAudioRef.current.currentTime = 0;
      recordedAudioRef.current.play();
      setIsPlayingRecording(true);
    }
  };

  const handleRecordedAudioEnded = () => {
    setIsPlayingRecording(false);
  };

  const handleCheckPronunciation = async () => {
    if (!sentence || !recordedBlobRef.current) return;
    setCheckingPronunciation(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(recordedBlobRef.current);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];

        const res = await fetch('/api/check-pronunciation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            referenceText: sentence.text,
          }),
        });

        if (!res.ok) throw new Error('Failed to check pronunciation');

        const data = await res.json();
        setTranscription(data.transcription);
        setPronunciationScore(data.score);
        setCheckingPronunciation(false);

        // Track spoken words
        if (data.transcription) {
          await trackWords(data.transcription, 'spoken');
        }
      };
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to check pronunciation. Please try again.');
      setCheckingPronunciation(false);
    }
  };

  const handleSubmit = async () => {
    if (!sentence || !user) return;

    // Check usage before submitting
    if (usageData && !usageData.canUse && !usageData.isPremium) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);

    try {
      // Record usage
      if (!usageData?.isPremium) {
        await fetch('/api/record-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
      }

      const res = await fetch('/api/grade-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentenceId: sentence.id,
          attemptText,
          userId: user.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to grade attempt');

      const data = await res.json();
      setWrittenScore(data.score);

      // Track typed words
      await trackWords(attemptText, 'typed');

      // Refresh usage data
      await checkUsage();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit attempt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇫🇷</span>
              <span className="text-xl font-bold text-slate-900">French Dictation</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/sentences"
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                View History
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Pricing
              </Link>
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-3 tracking-tight">
            Practice French Dictation
          </h1>
          <p className="text-xl text-slate-600">
            Improve your listening comprehension and pronunciation
          </p>
        </header>

        {/* Word Stats Chart */}
        {user && <WordStatsChart userId={user.id} sessionId={sessionId} />}

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Settings Section */}
          <div className="p-8 border-b border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CEFR Level
                </label>
                <select
                  value={cefrLevel}
                  onChange={(e) => setCefrLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-slate-100"
                >
                  {CEFR_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Discussion Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-slate-100"
                >
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Navigation Row */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateSentence('prev')}
                  disabled={allSentences.length === 0}
                  className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  aria-label="Previous sentence"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateSentence('next')}
                  disabled={allSentences.length === 0}
                  className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  aria-label="Next sentence"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <span className="text-sm text-slate-600">Select a sentence</span>
              </div>

              <button
                onClick={generateNewSentence}
                disabled={loading}
                className="bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-200/50 disabled:shadow-none flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate New Sentence
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          {sentence && (
            <div className="p-8 border-b border-slate-100">
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-3 bg-slate-100 px-6 py-3 rounded-full">
                  <div className={`flex items-center gap-2 ${hasListened ? 'text-green-600' : 'text-slate-700'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasListened ? 'bg-green-100' : 'bg-slate-200'}`}>
                      {hasListened ? '✓' : '🎧'}
                    </div>
                    <span className="font-semibold text-sm">Listen</span>
                  </div>
                  <div className="w-8 border-t-2 border-slate-300"></div>
                  <div className={`flex items-center gap-2 ${hasSpoken ? 'text-green-600' : 'text-slate-700'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasSpoken ? 'bg-green-100' : 'bg-slate-200'}`}>
                      {hasSpoken ? '✓' : '🎤'}
                    </div>
                    <span className="font-semibold text-sm">Speak</span>
                  </div>
                  <div className="w-8 border-t-2 border-slate-300"></div>
                  <div className={`flex items-center gap-2 ${attemptText.trim() ? 'text-green-600' : 'text-slate-700'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${attemptText.trim() ? 'bg-green-100' : 'bg-slate-200'}`}>
                      {attemptText.trim() ? '✓' : '⌨️'}
                    </div>
                    <span className="font-semibold text-sm">Type</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Repeat:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-center font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm text-slate-600">time(s)</span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePlayAudio}
                    disabled={!audioUrl || loading || isPlaying}
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg shadow-blue-200/50 hover:shadow-xl disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed min-w-[140px]"
                  >
                    {isPlaying ? `🔊 Playing (${currentRepeat}/${repeatCount})` : '▶️ Listen'}
                  </button>

                  <button
                    onClick={toggleRecording}
                    disabled={!audioUrl || loading}
                    className={`${
                      isRecording ? 'bg-red-600 hover:bg-red-700 shadow-red-200/50' : 'bg-red-600 hover:bg-red-700 shadow-red-200/50'
                    } text-white px-8 py-4 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed min-w-[140px]`}
                  >
                    {isRecording ? '⏹ Stop' : '🎤 Speak'}
                  </button>

                  {recordedAudioUrl && (
                    <button
                      onClick={playRecording}
                      className="bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-lg shadow-green-200/50 hover:shadow-xl min-w-[140px]"
                    >
                      {isPlayingRecording ? '🔊 Playing' : '▶️ Play'}
                    </button>
                  )}
                </div>
              </div>

              {checkingPronunciation && (
                <div className="mt-4 flex items-center justify-center gap-2 text-purple-600 font-semibold">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking pronunciation...
                </div>
              )}

              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
              )}

              {recordedAudioUrl && (
                <audio
                  ref={recordedAudioRef}
                  src={recordedAudioUrl}
                  onEnded={handleRecordedAudioEnded}
                  className="hidden"
                />
              )}
            </div>
          )}

          {/* Input and Transcription Side-by-Side */}
          {sentence && (
            <div className="p-8 border-b border-slate-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Type what you hear */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Type what you hear
                  </label>
                  <textarea
                    value={attemptText}
                    onChange={(e) => setAttemptText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && attemptText.trim() && !loading) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="Type here... (Press Enter to submit)"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none mb-4 hover:bg-slate-100"
                    rows={6}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !attemptText.trim()}
                    className="w-full bg-slate-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                  >
                    {writtenScore !== null ? 'Submit Again' : 'Submit'}
                  </button>
                </div>

                {/* Right: What you said */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    What you said
                  </label>
                  <div className="w-full min-h-[180px] px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-base">
                    {transcription || <span className="text-slate-400">Your transcription will appear here...</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reference Text Banner */}
          {sentence && (writtenScore !== null || pronunciationScore !== null) && (
            <div className="p-6 bg-emerald-50 border-b border-emerald-200">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                What was actually said
              </h3>
              <p className="text-2xl font-mono text-slate-900">
                {sentence.text}
              </p>
            </div>
          )}

          {/* Accuracy Display */}
          {(writtenScore !== null || pronunciationScore !== null) && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {writtenScore !== null && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
                    <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Writing Accuracy
                    </div>
                    <div className="text-5xl font-bold text-indigo-600">
                      {writtenScore}%
                    </div>
                  </div>
                )}

                {pronunciationScore !== null && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
                    <div className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Pronunciation Accuracy
                    </div>
                    <div className="text-5xl font-bold text-purple-600">
                      {pronunciationScore}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12">
          <p className="text-sm text-slate-500">
            Practice makes perfect · Keep learning French
          </p>
          {usageData && !usageData.isPremium && (
            <p className="text-xs text-slate-400 mt-2">
              {usageData.attemptsRemaining} of {usageData.dailyLimit} free attempts remaining today
            </p>
          )}
        </footer>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        attemptsUsed={usageData?.attemptsUsed || 0}
        dailyLimit={usageData?.dailyLimit || 5}
      />
    </main>
  );
}
