import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate sticker design using AI
    const response = await base44.integrations.Core.GenerateImage({
      prompt: `Design a clean, minimalist sticker for thermal label printing (black and white only, high contrast).

Layout:
- Top: Cannabis leaf icon (simple, clean lines)
- Center: "Session Buddy" in bold, modern font
- Below: "Track smart. Stay safe." in smaller text
- Bottom: Large QR code that links to session-buddy.app with "Scan to Download" text underneath

Style:
- Black and white only (no gradients)
- Bold, thick lines for thermal printing
- High contrast
- Professional and clean
- Square or slightly rectangular format (2:1 or 3:2 ratio)
- Minimalist cannabis aesthetic
- Easy to read from a distance

The QR code should be prominent and scannable. Keep plenty of white space around elements for clarity.`
    });

    return Response.json({ 
      imageUrl: response.url,
      message: 'Sticker design generated! For best results, print at 300 DPI on 2x2 or 3x2 inch labels.'
    });

  } catch (error) {
    console.error('Error generating sticker:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate sticker design' 
    }, { status: 500 });
  }
});