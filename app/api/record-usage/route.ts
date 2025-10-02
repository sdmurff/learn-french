import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split('T')[0];

    // Increment usage count
    const { data: existing } = await supabase
      .from('daily_usage')
      .select('attempt_count')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      await supabase
        .from('daily_usage')
        .update({ attempt_count: existing.attempt_count + 1 })
        .eq('user_id', userId)
        .eq('date', today);
    } else {
      await supabase
        .from('daily_usage')
        .insert({
          user_id: userId,
          date: today,
          attempt_count: 1,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
