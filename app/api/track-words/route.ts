import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseWords } from '@/utils/wordParser';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId, text, actionType, sentenceId, repeatCount = 1 } = await request.json();

    // Validation
    if (!userId || !sessionId || !text || !actionType) {
      return NextResponse.json(
        { error: 'userId, sessionId, text, and actionType are required' },
        { status: 400 }
      );
    }

    if (!['heard', 'typed', 'spoken', 'read_aloud', 'read_silent'].includes(actionType)) {
      return NextResponse.json(
        { error: 'actionType must be one of: heard, typed, spoken, read_aloud, read_silent' },
        { status: 400 }
      );
    }

    // Parse words from text
    const words = parseWords(text);

    if (words.length === 0) {
      return NextResponse.json(
        { error: 'No valid words found in text' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare bulk insert data
    const trackingData = words.map(word => ({
      user_id: userId,
      session_id: sessionId,
      word,
      action_type: actionType,
      sentence_id: sentenceId || null,
      repeat_count: repeatCount,
    }));

    // Bulk insert
    const { error: insertError } = await supabase
      .from('word_tracking')
      .insert(trackingData);

    if (insertError) {
      console.error('Error tracking words:', insertError);
      return NextResponse.json(
        { error: 'Failed to track words' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wordsTracked: words.length,
      uniqueWords: new Set(words).size,
    });
  } catch (error) {
    console.error('Error in track-words:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
