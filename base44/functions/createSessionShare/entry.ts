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

    const { 
      sessionId, 
      peakBuzz, 
      maxActiveTHC, 
      totalThc,
      soberTime, 
      isAnonymous,
      isWindow,
      sessionCount,
      windowDurationMinutes,
      sessions
    } = await req.json();

    // Get session details
    const session = await base44.asServiceRole.entities.Session.filter({ id: sessionId });
    if (!session || session.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = session[0];
    
    // Generate unique share ID
    const shareId = crypto.randomUUID().split('-')[0];

    // Calculate duration
    const duration = Math.round((new Date(soberTime) - new Date(sessionData.startedAt)) / (1000 * 60));
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    // Get buzz category
    let buzzCategory = 'Moderate';
    if (peakBuzz >= 9) buzzCategory = 'Extremely High';
    else if (peakBuzz >= 7) buzzCategory = 'Very High';
    else if (peakBuzz >= 5) buzzCategory = 'Strong';
    else if (peakBuzz >= 3) buzzCategory = 'Light';

    // Generate share image
    const imagePrompt = isWindow
      ? `Create a sleek, dark-themed consumption window card (Instagram story style):

**Background:** Deep black gradient (#0A0A0B to #141416), subtle green (#25A55F) glow effects

**Header:**
- Session Buddy logo (top left)
- "Consumption Window" badge (top right, blue)

**Hero Stats (center, large):**
- ${peakBuzz.toFixed(1)}/10 (huge bold text, bright green #25A55F)
- "Peak Buzz - ${buzzCategory}" (subtext, lighter green)

**Window Info:**
- 🔥 ${sessionCount} doses
- 💊 ${(totalThc || maxActiveTHC).toFixed(1)}mg Total THC
- ⏱️ ${durationText} window

**Stats Grid (sessions breakdown):**
${sessions ? sessions.map((s, i) => `${i + 1}. ${s.method}: ${s.dosageMg}mg`).join('\n') : ''}

**Footer:**
- "Track your vibe. Stay mindful. Enjoy the ride."
- "session-buddy.app" (bright green)

**Style:**
- Modern, clean, minimal
- High contrast for readability
- Rounded corners, soft shadows
- Professional but cannabis-friendly
- 1080x1920 (Instagram story dimensions)
${isAnonymous ? '- NO user names or identifying info' : ''}`
      : `Create a sleek, dark-themed session card (Instagram story style):

**Background:** Deep black gradient (#0A0A0B to #141416), subtle green (#25A55F) glow effects

**Header:**
- Session Buddy logo (top left)
- "Peak Buzz" label (top right, gray)

**Hero Stats (center, large):**
- ${peakBuzz.toFixed(1)}/10 (huge bold text, bright green #25A55F)
- "${buzzCategory}" (subtext, lighter green)

**Stats Grid (4 rounded tiles):**
1. 🔥 Max Blood THC: ${maxActiveTHC.toFixed(1)}mg (orange accent)
2. ⚡ Method: ${sessionData.method.replace('_', ' ')} (green accent)
3. 🌿 Strain: ${sessionData.strain} (purple accent)
4. ⏱️ Duration: ${durationText} (blue accent)

**Footer:**
- "Track your vibe. Stay mindful. Enjoy the ride."
- "session-buddy.app" (bright green)

**Style:**
- Modern, clean, minimal
- High contrast for readability
- Rounded corners, soft shadows
- Professional but cannabis-friendly
- 1080x1920 (Instagram story dimensions)
${isAnonymous ? '- NO user names or identifying info' : ''}`;

    const { url: imageUrl } = await base44.integrations.Core.GenerateImage({
      prompt: imagePrompt
    });

    // Save share record
    const share = await base44.asServiceRole.entities.Share.create({
      uid: user.id,
      sessionId: sessionData.id,
      shareId,
      imageUrl,
      isAnonymous,
      buzzScore: peakBuzz,
      activeTHC: maxActiveTHC,
      method: sessionData.method,
      vibeText: isWindow 
        ? `${sessionCount} doses - ${buzzCategory}` 
        : `${buzzCategory} - ${sessionData.strain}`
    });

    const shareUrl = `https://session-buddy-8ec261d8.base44.app/share/${shareId}`;

    return Response.json({
      shareUrl,
      imageUrl,
      shareId
    });

  } catch (error) {
    console.error('Error creating session share:', error);
    return Response.json({ 
      error: error.message || 'Failed to create share' 
    }, { status: 500 });
  }
});