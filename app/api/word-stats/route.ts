import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday (0) and Monday start
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    // Get all-time stats
    const { data: allTimeData, error: allTimeError } = await supabase
      .from('word_tracking')
      .select('word, action_type, repeat_count')
      .eq('user_id', userId);

    if (allTimeError) {
      console.error('Error fetching all-time stats:', allTimeError);
      return NextResponse.json(
        { error: 'Failed to fetch all-time stats' },
        { status: 500 }
      );
    }

    // Calculate all-time stats
    const allTimeStats = {
      totalHeard: 0,
      distinctHeard: new Set<string>(),
      totalTyped: 0,
      distinctTyped: new Set<string>(),
      totalSpoken: 0,
      distinctSpoken: new Set<string>(),
    };

    allTimeData?.forEach(item => {
      if (item.action_type === 'heard') {
        allTimeStats.totalHeard += item.repeat_count || 1;
        allTimeStats.distinctHeard.add(item.word);
      } else if (item.action_type === 'typed') {
        allTimeStats.totalTyped += 1;
        allTimeStats.distinctTyped.add(item.word);
      } else if (item.action_type === 'spoken') {
        allTimeStats.totalSpoken += 1;
        allTimeStats.distinctSpoken.add(item.word);
      }
    });

    // Get weekly stats
    const { data: weeklyData, error: weeklyError } = await supabase
      .from('word_tracking')
      .select('word, action_type, repeat_count')
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString());

    let weeklyStats = {
      totalHeard: 0,
      distinctHeard: new Set<string>(),
      totalTyped: 0,
      distinctTyped: new Set<string>(),
      totalSpoken: 0,
      distinctSpoken: new Set<string>(),
    };

    if (!weeklyError && weeklyData) {
      weeklyData.forEach(item => {
        if (item.action_type === 'heard') {
          weeklyStats.totalHeard += item.repeat_count || 1;
          weeklyStats.distinctHeard.add(item.word);
        } else if (item.action_type === 'typed') {
          weeklyStats.totalTyped += 1;
          weeklyStats.distinctTyped.add(item.word);
        } else if (item.action_type === 'spoken') {
          weeklyStats.totalSpoken += 1;
          weeklyStats.distinctSpoken.add(item.word);
        }
      });
    }

    // Get session stats if sessionId provided
    let sessionStats = null;
    if (sessionId) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('word_tracking')
        .select('word, action_type, repeat_count')
        .eq('user_id', userId)
        .eq('session_id', sessionId);

      if (sessionError) {
        console.error('Error fetching session stats:', sessionError);
      } else {
        sessionStats = {
          totalHeard: 0,
          distinctHeard: new Set<string>(),
          totalTyped: 0,
          distinctTyped: new Set<string>(),
          totalSpoken: 0,
          distinctSpoken: new Set<string>(),
        };

        sessionData?.forEach(item => {
          if (item.action_type === 'heard') {
            sessionStats!.totalHeard += item.repeat_count || 1;
            sessionStats!.distinctHeard.add(item.word);
          } else if (item.action_type === 'typed') {
            sessionStats!.totalTyped += 1;
            sessionStats!.distinctTyped.add(item.word);
          } else if (item.action_type === 'spoken') {
            sessionStats!.totalSpoken += 1;
            sessionStats!.distinctSpoken.add(item.word);
          }
        });
      }
    }

    return NextResponse.json({
      session: sessionStats ? {
        totalHeard: sessionStats.totalHeard,
        distinctHeard: sessionStats.distinctHeard.size,
        totalTyped: sessionStats.totalTyped,
        distinctTyped: sessionStats.distinctTyped.size,
        totalSpoken: sessionStats.totalSpoken,
        distinctSpoken: sessionStats.distinctSpoken.size,
      } : null,
      weekly: {
        totalHeard: weeklyStats.totalHeard,
        distinctHeard: weeklyStats.distinctHeard.size,
        totalTyped: weeklyStats.totalTyped,
        distinctTyped: weeklyStats.distinctTyped.size,
        totalSpoken: weeklyStats.totalSpoken,
        distinctSpoken: weeklyStats.distinctSpoken.size,
      },
      allTime: {
        totalHeard: allTimeStats.totalHeard,
        distinctHeard: allTimeStats.distinctHeard.size,
        totalTyped: allTimeStats.totalTyped,
        distinctTyped: allTimeStats.distinctTyped.size,
        totalSpoken: allTimeStats.totalSpoken,
        distinctSpoken: allTimeStats.distinctSpoken.size,
      },
    });
  } catch (error) {
    console.error('Error in word-stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
