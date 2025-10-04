import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get sentences that have audio
    const { data, error } = await supabase
      .from('sentences')
      .select('*')
      .not('audio_url', 'is', null);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sentence' },
        { status: 500 }
      );
    }

    // If no sentences with audio exist, return null
    if (!data || data.length === 0) {
      console.log('No sentences with audio found in database');
      return NextResponse.json({ sentence: null });
    }

    // Pick a random sentence
    const randomIndex = Math.floor(Math.random() * data.length);
    const sentence = data[randomIndex];

    console.log('Returning sentence with audio:', { id: sentence.id, audioUrl: sentence.audio_url });

    return NextResponse.json({
      sentence: {
        id: sentence.id,
        text: sentence.text,
        translation: sentence.translation || null,
        difficulty: sentence.difficulty,
        theme: sentence.theme,
        audioUrl: sentence.audio_url,
      },
    });
  } catch (error) {
    console.error('Error fetching random sentence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
