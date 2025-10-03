import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Default goals
const DEFAULT_GOALS = {
  session_goal: 50,
  weekly_goal: 500,
  alltime_goal: 5000,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No goals found, return defaults
        return NextResponse.json(DEFAULT_GOALS);
      }
      console.error('Error fetching user goals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user goals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session_goal: data.session_goal,
      weekly_goal: data.weekly_goal,
      alltime_goal: data.alltime_goal,
    });
  } catch (error) {
    console.error('Error in user-goals GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionGoal, weeklyGoal, alltimeGoal } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate goals are positive numbers
    if (sessionGoal && sessionGoal <= 0) {
      return NextResponse.json(
        { error: 'sessionGoal must be greater than 0' },
        { status: 400 }
      );
    }

    if (weeklyGoal && weeklyGoal <= 0) {
      return NextResponse.json(
        { error: 'weeklyGoal must be greater than 0' },
        { status: 400 }
      );
    }

    if (alltimeGoal && alltimeGoal <= 0) {
      return NextResponse.json(
        { error: 'alltimeGoal must be greater than 0' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert goals
    const { data, error } = await supabase
      .from('user_goals')
      .upsert({
        user_id: userId,
        session_goal: sessionGoal || DEFAULT_GOALS.session_goal,
        weekly_goal: weeklyGoal || DEFAULT_GOALS.weekly_goal,
        alltime_goal: alltimeGoal || DEFAULT_GOALS.alltime_goal,
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user goals:', error);
      return NextResponse.json(
        { error: 'Failed to update user goals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session_goal: data.session_goal,
      weekly_goal: data.weekly_goal,
      alltime_goal: data.alltime_goal,
    });
  } catch (error) {
    console.error('Error in user-goals POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
