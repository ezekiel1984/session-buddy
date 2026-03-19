import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse payload
    const body = await req.json();
    const { platform, productId, transactionId } = body;

    console.log(`[handleNativePurchase] Processing purchase for user ${user.id}:`, { platform, productId, transactionId });

    // In a real production app, we would verify the receipt with Apple/Google here using the transactionId.
    // For this implementation as requested, we trust the successful client-side callback and update the user.
    
    // Update the user's premium status
    // Using service role to ensure we can update the premium flag regardless of standard RLS
    const updatedUser = await base44.asServiceRole.auth.updateUser(user.id, {
        isPremium: true,
        premiumSource: `native_${platform || 'unknown'}`, // Track source
        premiumSince: new Date().toISOString(),
        // We might want to clear stripeCustomerId or related fields if switching from Stripe, 
        // but for now we just ensure they are premium.
    });

    return Response.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error('[handleNativePurchase] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});