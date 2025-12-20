import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, buzzScore, activeTHC, method, isAnonymous } = await req.json();

    // Generate unique share ID
    const shareId = crypto.randomUUID().split('-')[0];

    // Get vibe text based on buzz score
    const getVibeText = (score) => {
      if (score < 3) return 'Light Buzz';
      if (score < 5) return 'Moderate Buzz';
      if (score < 7) return 'Strong Buzz';
      if (score < 9) return 'Very High';
      return 'Extremely High';
    };

    const vibeText = getVibeText(buzzScore);

    // Generate share image using AI
    const imagePrompt = `Create a minimalist, dark-themed social media share card with the following:

Background: Near-black gradient (#0A0A0B to #141416)
Top left: Session Buddy logo (cannabis leaf)
Center: Large "${buzzScore.toFixed(1)}" in bright green (#25A55F)
Below score: "${vibeText}" in smaller green text
Below that: "Active THC: ${activeTHC.toFixed(1)}mg" in white
Method: "${method}" in gray
Bottom: "Track your vibe. Stay mindful. Enjoy the ride." in small gray text
Very bottom: "session-buddy.app" in green

Style: Clean, modern, Instagram/Twitter-ready
Size: 1080x1080px square
NO user photos or names${isAnonymous ? ' - ANONYMOUS' : ''}`;

    const { url: imageUrl } = await base44.integrations.Core.GenerateImage({
      prompt: imagePrompt
    });

    // Save share record
    const share = await base44.entities.Share.create({
      uid: user.id,
      sessionId,
      shareId,
      imageUrl,
      isAnonymous,
      buzzScore,
      activeTHC,
      method,
      vibeText
    });

    const shareUrl = `https://session-buddy-8ec261d8.base44.app/share/${shareId}`;

    return Response.json({
      shareUrl,
      imageUrl,
      shareId
    });

  } catch (error) {
    console.error('Error creating share:', error);
    return Response.json({ 
      error: error.message || 'Failed to create share' 
    }, { status: 500 });
  }
});