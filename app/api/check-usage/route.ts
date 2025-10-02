import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const FREE_TIER_DAILY_LIMIT = 5;

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

    // Check subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_end_date, current_period_end')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has active subscription or trial
    const now = new Date();
    const isTrialing = profile.subscription_status === 'trialing' &&
      profile.trial_end_date &&
      new Date(profile.trial_end_date) > now;

    const isActive = profile.subscription_status === 'active' &&
      profile.current_period_end &&
      new Date(profile.current_period_end) > now;

    if (isTrialing || isActive) {
      return NextResponse.json({
        canUse: true,
        isPremium: true,
        attemptsRemaining: null,
        subscriptionStatus: profile.subscription_status,
      });
    }

    // Free tier - check daily usage
    const today = new Date().toISOString().split('T')[0];

    const { data: usage, error } = await supabase
      .from('daily_usage')
      .select('attempt_count')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const currentAttempts = usage?.attempt_count || 0;
    const attemptsRemaining = Math.max(0, FREE_TIER_DAILY_LIMIT - currentAttempts);
    const canUse = attemptsRemaining > 0;

    return NextResponse.json({
      canUse,
      isPremium: false,
      attemptsRemaining,
      attemptsUsed: currentAttempts,
      dailyLimit: FREE_TIER_DAILY_LIMIT,
      subscriptionStatus: profile.subscription_status || 'inactive',
    });
  } catch (error) {
    console.error('Error checking usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
