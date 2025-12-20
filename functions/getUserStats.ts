import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user sessions
    const sessions = await base44.entities.Session.filter(
      { uid: user.id },
      '-created_date',
      500
    );

    if (sessions.length === 0) {
      return Response.json({
        sessions7d: 0,
        sessions30d: 0,
        totalThc7d: 0,
        totalThc30d: 0,
        avgPeakBuzz: 0,
        longestSession: "0h 0m",
        mostCommonMethod: "None",
        mostUsedStrain: "None"
      });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter sessions by time period
    const sessions7d = sessions.filter(s => new Date(s.startedAt) >= sevenDaysAgo);
    const sessions30d = sessions.filter(s => new Date(s.startedAt) >= thirtyDaysAgo);

    // Calculate totals
    const totalThc7d = sessions7d.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);
    const totalThc30d = sessions30d.reduce((sum, s) => sum + (parseFloat(s.dosageMg) || 0), 0);

    // Average buzz
    const avgPeakBuzz = sessions7d.length > 0
      ? sessions7d.reduce((sum, s) => sum + (s.buzzScore || 0), 0) / sessions7d.length
      : 0;

    // Longest session
    let longestDuration = 0;
    sessions.forEach(s => {
      try {
        const start = new Date(s.startedAt);
        const end = new Date(s.soberAt);
        const duration = (end - start) / (1000 * 60); // minutes
        if (duration > longestDuration) {
          longestDuration = duration;
        }
      } catch (err) {
        // Skip invalid dates
      }
    });
    const hours = Math.floor(longestDuration / 60);
    const minutes = Math.round(longestDuration % 60);
    const longestSession = `${hours}h ${minutes}m`;

    // Most common method
    const methodCounts = {};
    sessions7d.forEach(s => {
      methodCounts[s.method] = (methodCounts[s.method] || 0) + 1;
    });
    const mostCommonMethod = Object.keys(methodCounts).length > 0
      ? Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0][0]
      : "None";

    // Most used strain
    const strainCounts = {};
    sessions7d.forEach(s => {
      if (s.strain) {
        strainCounts[s.strain] = (strainCounts[s.strain] || 0) + 1;
      }
    });
    const mostUsedStrain = Object.keys(strainCounts).length > 0
      ? Object.entries(strainCounts).sort((a, b) => b[1] - a[1])[0][0]
      : "None";

    return Response.json({
      sessions7d: sessions7d.length,
      sessions30d: sessions30d.length,
      totalThc7d: Math.round(totalThc7d),
      totalThc30d: Math.round(totalThc30d),
      avgPeakBuzz: Math.round(avgPeakBuzz * 10) / 10,
      longestSession,
      mostCommonMethod,
      mostUsedStrain,
      totalSessions: sessions.length
    });

  } catch (error) {
    console.error('Error getting user stats:', error);
    return Response.json({ 
      error: error.message || 'Failed to get stats' 
    }, { status: 500 });
  }
});