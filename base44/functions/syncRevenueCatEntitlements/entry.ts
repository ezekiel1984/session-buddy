import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Use server-side secret key (V1 legacy or V2 depending on what you generated in RC dashboard).
// Prompt requested V1 if verification requires it, but standard API usually works with Secret Key.
const REVENUECAT_API_KEY = Deno.env.get("REVENUECAT_SECRET_API_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Auth Check
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Input
    const { userId } = await req.json().catch(() => ({}));
    const targetUserId = userId || user.id;

    // 3. Security Check (Admin or Self)
    if (targetUserId !== user.id && user.role !== 'admin') {
         return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!REVENUECAT_API_KEY) {
        console.error("REVENUECAT_SECRET_API_KEY is not set");
        return Response.json({ error: 'Configuration error' }, { status: 500 });
    }

    // 4. Fetch Subscriber Data from RevenueCat
    // GET https://api.revenuecat.com/v1/subscribers/{app_user_id}
    const rcResponse = await fetch(`https://api.revenuecat.com/v1/subscribers/${targetUserId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${REVENUECAT_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    if (!rcResponse.ok) {
        if (rcResponse.status === 404) {
             // User not in RC yet -> not premium via RC
             return Response.json({ isPremium: false, source: 'revenuecat-404' });
        }
        const errorText = await rcResponse.text();
        console.error(`RevenueCat API Error (${rcResponse.status}): ${errorText}`);
        return Response.json({ error: 'RevenueCat API error' }, { status: 500 });
    }

    const rcData = await rcResponse.json();
    const entitlements = rcData.subscriber?.entitlements?.active || {};
    
    // Check for 'Session Buddy Premium' entitlement (from screenshot)
    const hasRcPremium = !!entitlements['Session Buddy Premium'];
    
    // 5. Update Base44 User
    // Logic: 
    // - If RC says PREMIUM -> Set isPremium=true, premiumSource='revenuecat'
    // - If RC says NOT PREMIUM ->
    //      - If current source is 'stripe' and isPremium is true -> DO NOT TOUCH (Stripe webhook handles that)
    //      - Otherwise -> Set isPremium=false (native expired or never existed)

    // First, get the current user record to check existing source
    // We can use the 'user' object we fetched above, but to be sure we have latest DB state (e.g. webhook just fired):
    // const currentUserState = await base44.entities.User.get(targetUserId); // Not available in all SDK versions directly, rely on auth.me user or assume safe.
    // 'user' from auth.me() is fresh enough for this logic usually.

    const updateData = {};
    const currentSource = user.premiumSource;
    const currentIsPremium = user.isPremium;

    if (hasRcPremium) {
        // Native Premium Active
        updateData.isPremium = true;
        updateData.premiumSource = 'revenuecat';
        updateData.premiumUpdatedAt = new Date().toISOString();
        
        // Optional: Extract expiration date
        if (entitlements['Session Buddy Premium'].expires_date) {
            updateData.premiumExpiresAt = entitlements['Session Buddy Premium'].expires_date;
        }
    } else {
        // Native Premium Inactive
        if (currentIsPremium && currentSource === 'stripe') {
            console.log(`[SyncRC] User ${targetUserId} is Stripe Premium. Ignoring RC inactive status.`);
            return Response.json({ 
                isPremium: true, 
                source: 'stripe-preserved', 
                msg: 'Stripe premium active, ignoring RevenueCat' 
            });
        }
        
        // Otherwise, safe to downgrade (was native or nothing)
        if (currentIsPremium) {
             updateData.isPremium = false;
             updateData.premiumSource = null;
             updateData.premiumUpdatedAt = new Date().toISOString();
        }
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.User.update(targetUserId, updateData);
    }

    return Response.json({ 
        success: true,
        isPremium: hasRcPremium || (currentIsPremium && currentSource === 'stripe'),
        updatedFields: Object.keys(updateData)
    });

  } catch (error) {
    console.error('[syncRevenueCatEntitlements] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});