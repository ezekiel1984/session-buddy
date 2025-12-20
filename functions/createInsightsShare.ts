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

    const { stats, badges, isAnonymous } = await req.json();

    // Generate unique share ID
    const shareId = crypto.randomUUID().split('-')[0];

    // Generate flex-worthy share image
    const imagePrompt = `Create a sleek, dark-themed Instagram-style stats card:

**Background:** Deep black gradient (#0A0A0B to #141416), subtle green glow effects

**Header (top):**
- Session Buddy logo (left)
- "This Week" text (right, gray)

**Main Stats (center, large):**
- ${stats.totalThc7d}mg THC (bright green #25A55F, huge text)
- "Total THC This Week" (smaller, gray)

**Grid of 3 tiles below:**
1. 🔥 ${stats.sessions7d} Sessions (orange accent)
2. 📈 ${stats.avgPeakBuzz} Avg Buzz (blue accent)  
3. 🏆 ${badges} Badges (gold accent)

**Bottom stats row:**
- Most Used: ${stats.mostCommonMethod}
- Streak: ${stats.consecutiveDays} days

**Footer:**
- "Track your vibe. Stay mindful. Enjoy the ride."
- "session-buddy.app" (green)

**Style:** 
- Modern, minimalist, high-contrast
- Instagram square 1080x1080
- Rounded corners on stat tiles
- Professional but stoner-friendly
${isAnonymous ? '- NO user names or photos' : ''}`;

    const { url: imageUrl } = await base44.integrations.Core.GenerateImage({
      prompt: imagePrompt
    });

    // Save share record
    const share = await base44.entities.Share.create({
      uid: user.id,
      sessionId: 'insights',
      shareId,
      imageUrl,
      isAnonymous,
      buzzScore: stats.avgPeakBuzz,
      activeTHC: stats.totalThc7d,
      method: stats.mostCommonMethod,
      vibeText: `${stats.sessions7d} sessions | ${badges} badges`
    });

    const shareUrl = `https://session-buddy-8ec261d8.base44.app/share/${shareId}`;

    return Response.json({
      shareUrl,
      imageUrl,
      shareId
    });

  } catch (error) {
    console.error('Error creating insights share:', error);
    return Response.json({ 
      error: error.message || 'Failed to create share' 
    }, { status: 500 });
  }
});