import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateDiff } from '@/utils/diff';

export async function POST(request: NextRequest) {
  try {
    const { sentenceId, attemptText, userId } = await request.json();

    if (!sentenceId || attemptText === undefined) {
      return NextResponse.json(
        { error: 'Sentence ID and attempt text are required' },
        { status: 400 }
      );
    }

    // Get the reference sentence
    const { data: sentence, error: sentenceError } = await supabase
      .from('sentences')
      .select('text')
      .eq('id', sentenceId)
      .single();

    if (sentenceError || !sentence) {
      return NextResponse.json(
        { error: 'Sentence not found' },
        { status: 404 }
      );
    }

    // Calculate diff and score
    const { diff, score } = calculateDiff(sentence.text, attemptText);

    // Store attempt in database (if userId provided)
    if (userId) {
      const { error: insertError } = await supabase
        .from('attempts')
        .insert({
          user_id: userId,
          sentence_id: sentenceId,
          attempt_text: attemptText,
          score,
          diff_json: diff,
        });

      if (insertError) {
        console.error('Error storing attempt:', insertError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      diff,
      score,
      referenceText: sentence.text,
    });
  } catch (error) {
    console.error('Error grading attempt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
