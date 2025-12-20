import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(() => {
  return Response.json({ 
    error: 'This endpoint is deprecated. Badge sharing now handled client-side.' 
  }, { status: 410 });
});