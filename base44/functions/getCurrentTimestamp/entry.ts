import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return current UTC timestamp in ISO 8601 format
    const now = new Date().toISOString();

    return Response.json({ 
      timestamp: now,
      unix: Date.now(),
      readable: new Date().toUTCString()
    });

  } catch (error) {
    console.error('Error getting timestamp:', error);
    return Response.json({ 
      error: error.message || 'Failed to get timestamp' 
    }, { status: 500 });
  }
});