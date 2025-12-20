import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify current authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require confirmation token in body
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }
    const confirm = body?.confirm;
    if (confirm !== 'DELETE') {
      return Response.json({ error: 'Confirmation required' }, { status: 400 });
    }

    const userId = user.id;

    // Helper to delete user-owned items safely
    const safeBulkDelete = async (entityName, filterObj) => {
      // Try user-scoped first (RLS-respecting)
      try {
        const items = await base44.entities[entityName].filter(filterObj || {});
        if (items?.length) {
          await Promise.all(items.map((i) => base44.entities[entityName].delete(i.id)));
        }
      } catch (e) {
        // If RLS blocks due to relationships, use service role but keep strict filter by user
        try {
          const items = await base44.asServiceRole.entities[entityName].filter(filterObj || {});
          if (items?.length) {
            await Promise.all(items.map((i) => base44.asServiceRole.entities[entityName].delete(i.id)));
          }
        } catch (err) {
          console.error(`[deleteAccount] Failed deleting ${entityName}:`, err);
        }
      }
    };

    // Delete dependent data
    await safeBulkDelete('Session', { uid: userId });
    await safeBulkDelete('StrainProfile', { uid: userId });
    await safeBulkDelete('Share', { uid: userId });
    await safeBulkDelete('Badge', { uid: userId });

    // Chats and their messages
    let chats = [];
    try {
      chats = await base44.entities.Chat.filter({ uid: userId });
    } catch (e) {
      // fallback with service role if needed
      try {
        chats = await base44.asServiceRole.entities.Chat.filter({ uid: userId });
      } catch (err) {
        chats = [];
      }
    }

    if (chats?.length) {
      for (const chat of chats) {
        try {
          const msgs = await base44.asServiceRole.entities.Message.filter({ chatId: chat.id });
          if (msgs?.length) {
            await Promise.all(msgs.map((m) => base44.asServiceRole.entities.Message.delete(m.id)));
          }
        } catch (e) {
          console.error('[deleteAccount] Failed deleting messages for chat', chat.id, e);
        }
      }
      // Delete chats (try user scope first)
      try {
        await Promise.all(chats.map((c) => base44.entities.Chat.delete(c.id)));
      } catch (e) {
        await Promise.all(chats.map((c) => base44.asServiceRole.entities.Chat.delete(c.id)));
      }
    }

    // Finally delete the user record (service role required)
    await base44.asServiceRole.entities.User.delete(userId);

    return Response.json({ success: true });
  } catch (error) {
    console.error('[deleteAccount] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});