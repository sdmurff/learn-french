import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId } = await request.json();

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Price ID and User ID are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get user's email - try multiple methods
    // First, try to get profile with stripe_customer_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    // Get email via RPC function that queries auth.users
    let userEmail: string | null = null;

    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_user_email', { user_id: userId });

    if (rpcError) {
      console.error('RPC function error:', rpcError);
      return NextResponse.json(
        { error: 'Failed to get user information. Please ensure the get_user_email function is created in Supabase.' },
        { status: 500 }
      );
    }

    if (rpcResult && rpcResult.length > 0) {
      userEmail = rpcResult[0].email;
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found. Please ensure you are logged in.' },
        { status: 404 }
      );
    }

    let customerId = profile?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
        },
      });

      customerId = customer.id;

      // Save customer ID to database (upsert in case profile doesn't exist)
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          stripe_customer_id: customerId
        });
    }

    // Get the origin for redirect URLs
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000';

    // Create checkout session with 7-day free trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: userId,
        },
      },
      success_url: `${origin}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        supabase_user_id: userId,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
