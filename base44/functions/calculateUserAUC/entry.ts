import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Calculate Area Under Curve (AUC) for each day over the last 21 days
// This represents total THC exposure per day for tolerance calculations
// Based on pharmacokinetic principles: AUC correlates with total drug exposure over time

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all sessions from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    console.log('[calculateUserAUC] Fetching sessions for user:', user.id);
    
    const sessions = await base44.entities.Session.filter(
      { uid: user.id },
      '-created_date',
      500
    );

    console.log('[calculateUserAUC] Total sessions found:', sessions.length);

    // Filter to last 30 days and sort
    const recentSessions = sessions
      .filter(s => {
        const sessionDate = new Date(s.startedAt);
        return sessionDate >= thirtyDaysAgo && !isNaN(sessionDate.getTime());
      })
      .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));

    console.log('[calculateUserAUC] Recent sessions (last 30 days):', recentSessions.length);

    if (recentSessions.length === 0) {
      console.log('[calculateUserAUC] No recent sessions, returning empty array');
      return Response.json({ aucDays: [] });
    }

    // Group sessions by day and calculate AUC for each day
    // AUC = sum of absorbed THC doses for that day
    const aucByDay = {};

    recentSessions.forEach(session => {
      const dayISO = new Date(session.startedAt).toISOString().split('T')[0];
      const dosageMg = parseFloat(session.dosageMg) || 0;
      
      if (!aucByDay[dayISO]) {
        aucByDay[dayISO] = 0;
      }
      
      // Apply method-specific bioavailability adjustment based on scientific literature
      // These values reflect actual THC bioavailability and systemic exposure
      const method = session.method || 'vape_dry';
      const bioavailabilityFactor = getBioavailabilityFactor(method);
      
      // Adjusted exposure accounts for how much THC actually reaches systemic circulation
      // and contributes to CB1 receptor exposure (the driver of tolerance)
      const adjustedExposure = dosageMg * bioavailabilityFactor;
      
      aucByDay[dayISO] += adjustedExposure;
    });

    // Convert to array format and include last 21 days
    const aucDays = [];
    const today = new Date();
    
    for (let i = 20; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayISO = date.toISOString().split('T')[0];
      
      aucDays.push({
        dayISO,
        auc: aucByDay[dayISO] || 0
      });
    }

    console.log('[calculateUserAUC] Returning AUC data for', aucDays.length, 'days');
    console.log('[calculateUserAUC] Sample AUC values:', aucDays.slice(-7).map(d => ({ day: d.dayISO, auc: Math.round(d.auc) })));

    return Response.json({ aucDays });

  } catch (error) {
    console.error('[calculateUserAUC] Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to calculate AUC',
      aucDays: [] // Return empty array on error to prevent page breaking
    }, { status: 500 });
  }
});

// Scientific bioavailability factors based on pharmacokinetic research
// These reflect actual THC absorption and systemic exposure for each method
// References: 
// - Inhalation: 10-35% bioavailability (using 1.0 as baseline)
// - Sublingual: 6-20% bioavailability (~0.5x inhalation)
// - Oral/edibles: 4-12% bioavailability due to first-pass metabolism (~0.3-0.4x)
function getBioavailabilityFactor(method) {
  const factors = {
    vape_dry: 1.0,        // Baseline: direct lung absorption, ~20-30% bioavailability
    vape_cart: 1.0,       // Similar to dry herb vaping
    smoke: 0.95,          // Slightly less efficient than vaping due to combustion
    dab: 1.1,             // Higher concentration, more efficient delivery
    oil_sublingual: 0.6,  // Sublingual bypasses first-pass but lower absorption
    oil_ingested: 0.35,   // Significant first-pass metabolism, lower bioavailability
    edible: 0.35          // Similar to ingested oil, first-pass metabolism
  };
  
  return factors[method] || 1.0;
}