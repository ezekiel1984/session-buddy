import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.isPremium) {
      return Response.json({ error: 'Premium subscription required' }, { status: 403 });
    }

    const { stats, sessions, badges, isAnonymous } = await req.json();

    // Generate unique share ID
    const shareId = crypto.randomUUID().split('-')[0];

    // Generate share image for weekly stats
    const imagePrompt = `Create a sleek, dark-themed weekly stats card (Instagram square 1080x1080):

**Background:** Deep black gradient (#0A0A0B to #141416), subtle green (#25A55F) glow effects

**Header:**
- Session Buddy logo (top left)
- "This Week" badge (top right, gray)

**Main Stats (center, huge):**
- ${stats.totalThc7d}mg (bright green #25A55F, massive text)
- "Total THC" (smaller, gray)

**Grid of 3 stat tiles below:**
1. 🔥 ${stats.sessions7d} Sessions (orange accent)
2. 📈 ${stats.avgPeakBuzz}/10 Avg Buzz (blue accent)
3. 🏆 ${badges} Badges (gold accent)

**Bottom row:**
- Most Used: ${stats.mostCommonMethod}
- Streak: ${stats.consecutiveDays} days

**Footer:**
- "Track your vibe. Stay mindful. Enjoy the ride."
- "session-buddy.app" (bright green)

**Style:**
- Modern, minimalist, high contrast
- Rounded corners on stat tiles
- Professional but cannabis-friendly
- Instagram square 1080x1080
${isAnonymous ? '- NO user names or identifying info' : ''}`;

    const { url: imageUrl } = await base44.integrations.Core.GenerateImage({
      prompt: imagePrompt
    });

    // Calculate total session count from all provided sessions
    const totalSessions = sessions.length;

    // Save share record
    const share = await base44.asServiceRole.entities.Share.create({
      uid: user.id,
      sessionId: 'weekly_stats',
      shareId,
      imageUrl,
      isAnonymous,
      buzzScore: stats.avgPeakBuzz,
      activeTHC: stats.totalThc7d,
      method: stats.mostCommonMethod,
      vibeText: `${stats.sessions7d} sessions | ${badges} badges | ${totalSessions} total doses`
    });

    const shareUrl = `https://session-buddy-8ec261d8.base44.app/share/${shareId}`;

    return Response.json({
      shareUrl,
      imageUrl,
      shareId
    });

  } catch (error) {
    console.error('Error creating stats share:', error);
    return Response.json({ 
      error: error.message || 'Failed to create share' 
    }, { status: 500 });
  }
});