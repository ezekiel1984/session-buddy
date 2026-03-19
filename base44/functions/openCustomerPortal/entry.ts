
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    console.log('=== Starting openCustomerPortal ===');
    
    const base44 = createClientFromRequest(req);
    console.log('Base44 client created');
    
    const user = await base44.auth.me();
    console.log('User authenticated:', user?.id);

    if (!user) {
      console.log('No user found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User details:', {
      id: user.id,
      email: user.email,
      isPremium: user.isPremium,
      stripeCustomerId: user.stripeCustomerId
    });

    if (!user.isPremium) {
      console.log('User is not premium');
      return Response.json({ error: 'Not a premium member' }, { status: 403 });
    }

    // Get or find Stripe customer ID
    let customerId = user.stripeCustomerId;
    console.log('Initial customer ID:', customerId);

    // Check if customer ID is from test mode (starts with test pattern or verify it exists)
    if (customerId) {
      try {
        console.log('Verifying customer exists in live mode:', customerId);
        await stripe.customers.retrieve(customerId);
        console.log('Customer verified in live mode');
      } catch (verifyError) {
        console.log('Customer verification failed:', verifyError.message);
        
        // If it's a test mode customer or doesn't exist, clear it
        if (verifyError.message.includes('similar object exists in test mode') || 
            verifyError.message.includes('No such customer')) {
          console.log('Detected test mode customer ID, clearing it');
          customerId = null;
          
          // Clear the test customer ID from user record
          try {
            const apiKey = Deno.env.get('BASE44_API_KEY');
            const appId = Deno.env.get('BASE44_APP_ID');
            
            if (apiKey) {
              await fetch(
                `https://app.base44.com/api/apps/${appId}/entities/User/${user.id}`,
                {
                  method: 'PUT',
                  headers: {
                    'api_key': apiKey,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ stripeCustomerId: null })
                }
              );
              console.log('Cleared test customer ID from user record');
            }
          } catch (clearError) {
            console.error('Failed to clear test customer ID:', clearError);
          }
        }
      }
    }

    if (!customerId) {
      console.log('Searching for Stripe customer by email:', user.email);
      
      try {
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1
        });

        console.log('Stripe customers found:', customers.data.length);

        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          console.log('Found customer ID from Stripe:', customerId);
          
          try {
            console.log('Attempting to update user with customer ID');
            const apiKey = Deno.env.get('BASE44_API_KEY');
            const appId = Deno.env.get('BASE44_APP_ID');
            
            console.log('API Key available:', !!apiKey);
            console.log('App ID:', appId);
            
            if (!apiKey) {
              console.warn('BASE44_API_KEY not set, skipping user update');
            } else {
              const updateResponse = await fetch(
                `https://app.base44.com/api/apps/${appId}/entities/User/${user.id}`,
                {
                  method: 'PUT',
                  headers: {
                    'api_key': apiKey,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ stripeCustomerId: customerId })
                }
              );
              
              if (updateResponse.ok) {
                console.log('User updated successfully with customer ID');
              } else {
                const errorText = await updateResponse.text();
                console.error('Failed to update user:', updateResponse.status, errorText);
              }
            }
          } catch (updateError) {
            console.error('Error updating user with customer ID:', updateError);
          }
        } else {
          console.log('No Stripe customer found for email:', user.email);
          return Response.json({ 
            error: 'No live subscription found. If you subscribed in test mode, please upgrade again using a real payment method to activate your premium membership.',
            requiresResubscribe: true
          }, { status: 404 });
        }
      } catch (stripeError) {
        console.error('Error searching for Stripe customer:', stripeError);
        return Response.json({ 
          error: 'Failed to find your subscription. Please contact support.',
          details: stripeError.message
        }, { status: 500 });
      }
    }

    // Create portal session with updated return URL
    console.log('Creating portal session for customer:', customerId);
    const appUrl = 'https://session-buddy-8ec261d8.base44.app';
    
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/PortalReturn`,
      });

      console.log('Portal session created successfully:', portalSession.id);
      return Response.json({ url: portalSession.url });
    } catch (portalError) {
      console.error('Error creating portal session:', portalError);
      
      if (portalError.message && portalError.message.includes('No configuration provided')) {
        return Response.json({ 
          error: 'Subscription management is being set up. Please contact support or try again later.',
          details: 'Stripe Customer Portal not configured'
        }, { status: 503 });
      }
      
      return Response.json({ 
        error: 'Failed to open subscription portal. Please try again or contact support.',
        details: portalError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Unexpected error in openCustomerPortal:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: error.message || 'Failed to open customer portal',
      details: error.stack
    }, { status: 500 });
  }
});
