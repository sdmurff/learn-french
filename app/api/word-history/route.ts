import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type WordStat = {
  word: string;
  timesHeard: number;
  timesTyped: number;
  timesSpoken: number;
  totalInteractions: number;
  lastSeen: string;
};

export async function POST(request: NextRequest) {
  try {
    const { userId, sortBy = 'timesHeard', filterBy, searchQuery, page = 1, pageSize = 50 } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all word tracking data for user
    const { data: trackingData, error: trackingError } = await supabase
      .from('word_tracking')
      .select('word, action_type, repeat_count, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (trackingError) {
      console.error('Error fetching word history:', trackingError);
      return NextResponse.json(
        { error: 'Failed to fetch word history' },
        { status: 500 }
      );
    }

    // Aggregate by word
    const wordMap = new Map<string, WordStat>();

    trackingData?.forEach(item => {
      if (!wordMap.has(item.word)) {
        wordMap.set(item.word, {
          word: item.word,
          timesHeard: 0,
          timesTyped: 0,
          timesSpoken: 0,
          totalInteractions: 0,
          lastSeen: item.created_at,
        });
      }

      const wordStat = wordMap.get(item.word)!;

      if (item.action_type === 'heard') {
        wordStat.timesHeard += item.repeat_count || 1;
      } else if (item.action_type === 'typed') {
        wordStat.timesTyped += 1;
      } else if (item.action_type === 'spoken') {
        wordStat.timesSpoken += 1;
      }

      // Update last seen if this is more recent
      if (new Date(item.created_at) > new Date(wordStat.lastSeen)) {
        wordStat.lastSeen = item.created_at;
      }
    });

    // Convert to array and calculate total interactions
    let words = Array.from(wordMap.values()).map(word => ({
      ...word,
      totalInteractions: word.timesHeard + word.timesTyped + word.timesSpoken,
    }));

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      words = words.filter(w => w.word.toLowerCase().includes(query));
    }

    // Apply action type filter
    if (filterBy && ['heard', 'typed', 'spoken'].includes(filterBy)) {
      words = words.filter(w => {
        if (filterBy === 'heard') return w.timesHeard > 0;
        if (filterBy === 'typed') return w.timesTyped > 0;
        if (filterBy === 'spoken') return w.timesSpoken > 0;
        return true;
      });
    }

    // Sort
    words.sort((a, b) => {
      switch (sortBy) {
        case 'timesHeard':
          return b.timesHeard - a.timesHeard;
        case 'timesTyped':
          return b.timesTyped - a.timesTyped;
        case 'timesSpoken':
          return b.timesSpoken - a.timesSpoken;
        case 'totalInteractions':
          return b.totalInteractions - a.totalInteractions;
        case 'alphabetical':
          return a.word.localeCompare(b.word, 'fr');
        case 'lastSeen':
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        default:
          return b.timesHeard - a.timesHeard;
      }
    });

    // Pagination
    const totalWords = words.length;
    const totalPages = Math.ceil(totalWords / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedWords = words.slice(startIndex, endIndex);

    return NextResponse.json({
      words: paginatedWords,
      pagination: {
        currentPage: page,
        pageSize,
        totalWords,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error in word-history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
