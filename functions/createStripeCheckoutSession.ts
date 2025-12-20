import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, successUrl, cancelUrl } = await req.json();

    if (!plan || !successUrl || !cancelUrl) {
      return Response.json({ error: 'Missing required parameters (plan, successUrl, cancelUrl)' }, { status: 400 });
    }

    // Hardcode price IDs to avoid dynamic ID restriction
    // Monthly: price_1ScNPqDFK6UOBOd6771fTDzz
    // Yearly: price_1ScNTgDFK6UOBOd61Q7zHtyX
    const priceId = plan === 'yearly' 
      ? 'price_1ScNTgDFK6UOBOd61Q7zHtyX' 
      : 'price_1ScNPqDFK6UOBOd6771fTDzz';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      customer_email: user.email,
      allow_promotion_codes: true,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        plan: plan,
        environment: 'web'
      },
    });

    // Return exact shape expected by frontend
    return Response.json({ 
      url: session.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});