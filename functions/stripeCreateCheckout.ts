import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.26.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) {
      return Response.json({ error: 'Missing STRIPE_SECRET_KEY' }, { status: 500 });
    }

    const payload = await req.json().catch(() => ({}));
    const defaultPriceId = Deno.env.get('STRIPE_PRICE_ID');
    const priceId = payload.priceId || defaultPriceId;

    if (!priceId) {
      return Response.json({ error: 'Missing Stripe price. Set STRIPE_PRICE_ID secret or pass priceId.' }, { status: 400 });
    }

    const origin = payload.origin || (typeof req.headers.get === 'function' ? (req.headers.get('x-forwarded-origin') || req.headers.get('origin') || '') : '');
    const successUrl = `${origin}/PremiumWeb?status=success`;
    const cancelUrl = `${origin}/PremiumWeb?status=cancel`;

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      metadata: {
        userId: user.id,
        email: user.email || ''
      },
      allow_promotion_codes: true
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});