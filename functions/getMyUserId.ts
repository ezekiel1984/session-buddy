import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return JUST the user ID as a plain string in the response
    return Response.json({ 
      userId: user.id
    });

  } catch (error) {
    console.error('Error getting user ID:', error);
    return Response.json({ 
      error: error.message || 'Failed to get user ID' 
    }, { status: 500 });
  }
});