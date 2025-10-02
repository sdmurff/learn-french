# Stripe Subscription Setup Guide

This guide will help you set up Stripe subscriptions with a 7-day free trial for your French learning app.

---

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Supabase project with authentication enabled
- Node.js and npm installed

---

## Step 1: Database Setup

1. **Run the subscription migration in Supabase SQL Editor:**

   Copy and paste the contents of `supabase-subscription-migration.sql` into your Supabase SQL Editor and run it.

   This creates:
   - `profiles` table for user subscription data
   - `daily_usage` table for tracking free tier limits
   - Triggers to auto-create profiles on user signup
   - RLS policies for security

---

## Step 2: Stripe Product Setup

1. **Log in to Stripe Dashboard** (https://dashboard.stripe.com)

2. **Create a Product:**
   - Go to Products → Add product
   - Name: "French Dictation Premium"
   - Description: "Unlimited practice attempts for French dictation"
   - Click "Add product"

3. **Add Pricing:**
   - Click "Add pricing"
   - Type: Recurring
   - Price: $9.99 (or your preferred amount)
   - Billing period: Monthly
   - Click "Add pricing"

4. **Copy the Price ID:**
   - It will look like `price_1234567890abcdef`
   - You'll need this for the next step

---

## Step 3: Environment Variables

Add these to your `.env.local` file:

```bash
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Existing OpenAI variable
OPENAI_API_KEY=your_openai_api_key

# NEW: Stripe variables
STRIPE_SECRET_KEY=sk_test_... # From Stripe Dashboard → Developers → API Keys
NEXT_PUBLIC_STRIPE_PRICE_ID=price_... # The Price ID you copied above
STRIPE_WEBHOOK_SECRET=whsec_... # We'll generate this in the next step
```

---

## Step 4: Stripe Webhook Setup

### For Local Development (using Stripe CLI):

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (Scoop)
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe
   ```

2. **Login to Stripe CLI:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook signing secret:**
   - The CLI will output something like: `whsec_...`
   - Add this to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### For Production (Vercel):

1. **Deploy your app to Vercel**

2. **Add webhook endpoint in Stripe Dashboard:**
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Select events to listen to:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.payment_succeeded`
   - Click "Add endpoint"

3. **Copy the signing secret:**
   - Click on your webhook endpoint
   - Reveal the signing secret
   - Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

---

## Step 5: Configure Billing Portal

1. **Go to Stripe Dashboard → Settings → Billing → Customer portal**

2. **Enable the customer portal:**
   - Toggle "Link to customer portal" to ON
   - Save changes

3. **Configure portal settings:**
   - Allow customers to update payment methods: ON
   - Allow customers to cancel subscriptions: ON
   - Allow customers to switch plans: Optional
   - Save settings

---

## Step 6: Test the Integration

### Test Subscription Flow:

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **In another terminal, start Stripe webhook forwarding:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Test the flow:**
   - Sign up for a new account
   - Navigate to `/pricing`
   - Click "Start Free Trial"
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete checkout

4. **Verify subscription:**
   - Check Stripe Dashboard → Customers
   - Check Supabase `profiles` table
   - Navigate to `/profile` to see subscription status

### Test Stripe Cards:

- **Successful payment:** `4242 4242 4242 4242`
- **Payment declined:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0025 0000 3155`

More test cards: https://stripe.com/docs/testing

---

## Step 7: Usage Limits

The app enforces these limits:

- **Free users:** 5 attempts per day
- **Premium users:** Unlimited attempts
- **Trial users:** Unlimited attempts during trial

Limits reset at midnight UTC.

---

## Step 8: Deploy to Production

1. **Add environment variables to Vercel:**
   - Go to your Vercel project settings
   - Environment Variables section
   - Add all the variables from `.env.local`
   - Use production Stripe keys (starts with `pk_live_` and `sk_live_`)

2. **Switch Stripe to live mode:**
   - Toggle the "Test mode" switch in Stripe Dashboard
   - Create a new product and price in live mode
   - Update `NEXT_PUBLIC_STRIPE_PRICE_ID` with live price ID
   - Create webhook endpoint for production URL

3. **Test in production:**
   - Use real cards (with small amounts) or
   - Use Stripe test mode in production first

---

## Troubleshooting

### Webhook not receiving events:
- Check Stripe CLI is running (`stripe listen`)
- Verify webhook URL is correct
- Check webhook signing secret matches
- Look at Stripe Dashboard → Developers → Webhooks for delivery attempts

### Subscription not updating in database:
- Check Stripe webhook logs
- Verify Supabase service role key is correct
- Check browser console and server logs for errors
- Ensure `profiles` table exists with correct columns

### Trial not working:
- Verify price has no trial period set in Stripe (we set it programmatically)
- Check checkout session creation includes `trial_period_days: 7`
- Look at Stripe customer subscriptions tab to verify trial status

### Usage limits not working:
- Check `daily_usage` table exists
- Verify RLS policies are set correctly
- Check API endpoints are recording usage
- Ensure date comparison is using UTC

---

## Security Notes

- Never expose `STRIPE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in client code
- Always verify webhook signatures
- Use HTTPS in production
- Enable Stripe fraud protection
- Set up RLS policies on all Supabase tables

---

## Additional Resources

- [Stripe Subscriptions Docs](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## Support

If you run into issues:
1. Check the browser console for errors
2. Check Stripe Dashboard webhook logs
3. Check Supabase logs
4. Review the Stripe CLI output
5. Verify all environment variables are set correctly
