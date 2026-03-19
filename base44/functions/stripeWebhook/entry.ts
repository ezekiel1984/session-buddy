import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@13.11.0';

Deno.serve(async (req) => {
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecret || !webhookSecret) {
    return Response.json({ error: 'Missing Stripe secrets' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });

  // Read raw body for signature verification
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, sig, webhookSecret);
  } catch (err) {
    return Response.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  // Create Base44 client AFTER reading headers/body (per platform guidance)
  const base44 = createClientFromRequest(req);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const email = session.customer_details?.email || session.customer_email || session.metadata?.email;
        
        if (!userId && !email) break;

        // Find user by id or email
        let targetUser = null;
        try {
          if (userId) {
            const users = await base44.asServiceRole.entities.User.filter({ id: userId });
            targetUser = users?.[0] || null;
          }
          if (!targetUser && email) {
            const usersByEmail = await base44.asServiceRole.entities.User.filter({ email });
            targetUser = usersByEmail?.[0] || null;
          }
        } catch {}

        if (targetUser) {
          await base44.asServiceRole.entities.User.update(targetUser.id, {
            isPremium: true,
            stripeCustomerId: session.customer || targetUser.stripeCustomerId || null,
            stripeSubscriptionStatus: 'active'
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;
        if (!customerId) break;

        // Find user by stripeCustomerId
        let target = null;
        try {
          const users = await base44.asServiceRole.entities.User.filter({ stripeCustomerId: customerId });
          target = users?.[0] || null;
        } catch {}

        if (target) {
          const active = sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due';
          await base44.asServiceRole.entities.User.update(target.id, {
            isPremium: !!active,
            stripeSubscriptionStatus: sub.status
          });
        }
        break;
      }
      default:
        // No-op
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});