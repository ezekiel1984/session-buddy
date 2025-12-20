import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify the webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received Stripe event:', event.type);

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;

      if (!userId) {
        console.error('No client_reference_id (userId) found in session');
        return Response.json({ error: 'No user reference' }, { status: 400 });
      }

      console.log(`Processing payment for user: ${userId}`);

      // Use Base44 SDK with service role for secure updates
      const base44 = createClientFromRequest(req);
      
      try {
        // Ensure we have a valid client/environment
        if (!base44 || !base44.asServiceRole) {
           throw new Error('Base44 SDK Service Role not available');
        }

        // Update the user entity directly via SDK
        const result = await base44.asServiceRole.entities.User.update(userId, { isPremium: true });
        
        console.log(`Successfully set isPremium=true for user ${userId}`, result);
        
        return Response.json({ 
          received: true,
          userId: userId,
          message: 'User upgraded to premium'
        });

      } catch (updateError) {
        console.error('Error updating user:', updateError);
        return Response.json({ 
          error: 'Failed to update user',
          details: updateError.message 
        }, { status: 500 });
      }
    }

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const sessions = await stripe.checkout.sessions.list({
        subscription: subscription.id,
        limit: 1
      });

      if (sessions.data.length > 0) {
        const userId = sessions.data[0].client_reference_id;
        
        if (userId) {
          const base44 = createClientFromRequest(req);
          try {
            await base44.asServiceRole.entities.User.update(userId, { isPremium: false });
            console.log(`Subscription cancelled for user ${userId}`);
          } catch (error) {
            console.error('Error cancelling subscription:', error);
          }
        }
      }
    }

    // Acknowledge receipt of other event types
    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ 
      error: error.message || 'Webhook handler failed' 
    }, { status: 500 });
  }
});