
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use firstName if available, otherwise fall back to first name from full_name
    let firstName = user.firstName;
    if (!firstName && user.full_name) {
      firstName = user.full_name.split(' ')[0];
    }

    return Response.json({
      userId: user.id,
      full_name: user.full_name,
      email: user.email,
      firstName: firstName || null,
      lastName: user.lastName || null,
      preferredTone: user.preferredTone || 'zen',
      tolerance: user.tolerance || 'medium'
    });

  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return Response.json({ 
      error: error.message || 'Failed to get user' 
    }, { status: 500 });
  }
});
