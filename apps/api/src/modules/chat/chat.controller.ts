import { Request, Response } from 'express';
import { query, queryOne } from '../../database/connection';
import { NotFoundError, ForbiddenError } from '../../errors/AppError';
import { getIO } from '../../socket';

// ─── List Conversations ─────────────────────────────────────────────────────
export const listConversations = async (req: Request, res: Response) => {
  const user = req.user!;
  const userId = user.userId;
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');

  let conversations;
  
  if (isAdmin) {
    conversations = await query(
      `SELECT c.id, c.type, c.initiator_id, c.recipient_id, c.is_approved_for_recipient, c.created_at,
              m.content as last_message, m.created_at as last_message_at,
              u_init.name as initiator_name, u_init.email as initiator_email, u_init.avatar_url as initiator_avatar,
              u_recip.name as recipient_name, u_recip.email as recipient_email, u_recip.avatar_url as recipient_avatar,
              COALESCE(u_init.name, u_recip.name, 'Support User') as user_name,
              COALESCE(u_init.email, u_recip.email) as user_email,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
       FROM conversations c
       LEFT JOIN users u_init ON u_init.id = c.initiator_id
       LEFT JOIN users u_recip ON u_recip.id = c.recipient_id
       LEFT JOIN messages m ON m.conversation_id = c.id 
            AND m.id = (SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1)
       ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
      [userId]
    );
  } else {
    conversations = await query(
      `SELECT c.id, c.type, c.initiator_id, c.recipient_id, c.is_approved_for_recipient, c.created_at,
              m.content as last_message, m.created_at as last_message_at,
              CASE 
                WHEN c.type = 'SUPPORT' THEN 'Rewa Bhoomi Support'
                WHEN c.initiator_id = $1 THEN COALESCE(u_recip.name, 'User')
                ELSE COALESCE(u_init.name, 'User')
              END as other_user_name,
              CASE 
                WHEN c.type = 'SUPPORT' THEN NULL
                WHEN c.initiator_id = $1 THEN u_recip.avatar_url
                ELSE u_init.avatar_url
              END as other_user_avatar,
              CASE 
                WHEN c.type = 'SUPPORT' THEN 'support@rewabhoomi.com'
                WHEN c.initiator_id = $1 THEN u_recip.email
                ELSE u_init.email
              END as other_user_email,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
       FROM conversations c
       JOIN conversation_members cm ON cm.conversation_id = c.id
       LEFT JOIN users u_init ON u_init.id = c.initiator_id
       LEFT JOIN users u_recip ON u_recip.id = c.recipient_id
       LEFT JOIN messages m ON m.conversation_id = c.id 
            AND m.id = (SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1)
       WHERE cm.user_id = $1
         AND (c.type = 'SUPPORT' OR c.initiator_id = $1 OR c.is_approved_for_recipient = true)
       ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
      [userId]
    );
  }

  res.json({ success: true, data: conversations });
};

// ─── Get or Create Conversation ───────────────────────────────────────────────
export const getOrCreateConversation = async (req: Request, res: Response) => {
  const user = req.user!;
  const userId = user.userId;
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
  const targetUserId = req.body.targetUserId;

  // Case 1: P2P chat (targetUserId provided and different from current user)
  if (targetUserId && targetUserId !== userId) {
    // Check if target user has ADMIN role
    const targetUserRoles = await query(
      `SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1`,
      [targetUserId]
    );
    const targetIsAdmin = targetUserRoles.some((r: any) => r.name === 'ADMIN' || r.name === 'SUPER_ADMIN');

    if (!isAdmin && targetIsAdmin) {
      // User is chatting with platform support
      const existingSupport = await query(
        `SELECT c.id FROM conversations c
         WHERE c.type = 'SUPPORT' AND c.initiator_id = $1 LIMIT 1`,
        [userId]
      );
      if (existingSupport.length > 0) {
        return res.json({ success: true, data: { id: existingSupport[0].id } });
      }

      const [newSupport] = await query(
        `INSERT INTO conversations (id, type, initiator_id, is_approved_for_recipient)
         VALUES (gen_random_uuid(), 'SUPPORT', $1, true) RETURNING id`,
        [userId]
      );
      await query(
        `INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2)`,
        [newSupport.id, userId]
      );
      return res.status(201).json({ success: true, data: { id: newSupport.id } });
    }

    if (isAdmin && !targetIsAdmin) {
      // Admin is initiating chat with a regular user -> Find or create the user's SUPPORT conversation
      const existingSupport = await query(
        `SELECT c.id FROM conversations c
         WHERE c.type = 'SUPPORT' AND c.initiator_id = $1 LIMIT 1`,
        [targetUserId]
      );
      if (existingSupport.length > 0) {
        return res.json({ success: true, data: { id: existingSupport[0].id } });
      }

      const [newSupport] = await query(
        `INSERT INTO conversations (id, type, initiator_id, is_approved_for_recipient)
         VALUES (gen_random_uuid(), 'SUPPORT', $1, true) RETURNING id`,
        [targetUserId]
      );
      await query(
        `INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2)`,
        [newSupport.id, targetUserId]
      );
      return res.status(201).json({ success: true, data: { id: newSupport.id } });
    }

    // Direct P2P chat between two users (or Admin starting direct chat with a user)
    const initiatorId = userId;
    const recipientId = targetUserId;

    // Check existing direct conversation between pair
    const existing = await query(
      `SELECT c.id FROM conversations c
       WHERE ((c.initiator_id = $1 AND c.recipient_id = $2) 
          OR (c.initiator_id = $2 AND c.recipient_id = $1))
         AND c.type = 'DIRECT'
       LIMIT 1`,
      [initiatorId, recipientId]
    );

    if (existing.length > 0) {
      return res.json({ success: true, data: { id: existing[0].id } });
    }

    // Check auto-approval setting
    const settingRow = await queryOne(
      `SELECT value FROM system_settings WHERE key = 'auto_approve_p2p_chat'`
    );
    const isAutoApproved = (settingRow?.value as any)?.enabled === true || isAdmin;

    const [newConv] = await query(
      `INSERT INTO conversations (id, type, initiator_id, recipient_id, is_approved_for_recipient) 
       VALUES (gen_random_uuid(), 'DIRECT', $1, $2, $3) RETURNING id`,
      [initiatorId, recipientId, isAutoApproved]
    );

    await query(
      `INSERT INTO conversation_members (conversation_id, user_id) 
       VALUES ($1, $2), ($1, $3)
       ON CONFLICT DO NOTHING`,
      [newConv.id, initiatorId, recipientId]
    );

    return res.status(201).json({ success: true, data: { id: newConv.id } });
  }

  // Case 2: Support chat (Default when no targetUserId provided)
  const existingConv = await query(
    `SELECT c.id FROM conversations c
     JOIN conversation_members cm ON cm.conversation_id = c.id
     WHERE cm.user_id = $1 AND c.type = 'SUPPORT' LIMIT 1`,
    [userId]
  );

  if (existingConv.length > 0) {
    return res.json({ success: true, data: { id: existingConv[0].id } });
  }

  const [newConv] = await query(
    `INSERT INTO conversations (id, type, initiator_id, is_approved_for_recipient) 
     VALUES (gen_random_uuid(), 'SUPPORT', $1, true) RETURNING id`,
    [userId]
  );

  await query(
    `INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2)`,
    [newConv.id, userId]
  );

  res.status(201).json({ success: true, data: { id: newConv.id } });
};

// ─── Get Messages ───────────────────────────────────────────────────────────
export const getMessages = async (req: Request, res: Response) => {
  const user = req.user!;
  const userId = user.userId;
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
  const { conversationId } = req.params;
  const { limit = '50', before } = req.query;

  // Verify membership
  if (!isAdmin) {
    const member = await queryOne(
      'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (!member) {
      throw new ForbiddenError('You are not a member of this conversation');
    }
  }

  let sql = `
    SELECT 
      m.*,
      u.name as sender_name,
      u.avatar_url as sender_avatar,
      rm.content as replied_message_content,
      rm.sender_id as replied_message_sender_id,
      (
        SELECT COALESCE(json_agg(json_build_object('emoji', r.emoji, 'user_id', r.user_id, 'user_name', ru.name)), '[]'::json)
        FROM message_reactions r
        LEFT JOIN users ru ON ru.id = r.user_id
        WHERE r.message_id = m.id
      ) as reactions
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    LEFT JOIN messages rm ON m.reply_to_message_id = rm.id
    WHERE m.conversation_id = $1
  `;
  const params: any[] = [conversationId];

  if (before) {
    sql += ' AND m.created_at < $2';
    params.push(before);
  }

  sql += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
  params.push(parseInt(limit as string, 10));

  const messages = await query(sql, params);

  res.json({ success: true, data: messages });
};

// ─── Send Message ───────────────────────────────────────────────────────────
export const sendMessage = async (req: Request, res: Response) => {
  const user = req.user!;
  const userId = user.userId;
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
  const { conversationId } = req.params;
  const { content, reply_to_message_id, impersonate_as } = req.body;

  const conv = await queryOne<any>(
    `SELECT id, type, initiator_id, recipient_id, is_approved_for_recipient FROM conversations WHERE id = $1`,
    [conversationId]
  );
  if (!conv) {
    throw new NotFoundError('Conversation not found');
  }

  // Verify membership
  if (!isAdmin) {
    const member = await queryOne(
      'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (!member) {
      throw new ForbiddenError('You are not a member of this conversation');
    }
  }

  let senderId = userId;
  let actualSenderId = userId;
  let isAdminOverride = false;

  // Ghost / Impersonation mode for Admin
  if (isAdmin && impersonate_as) {
    senderId = impersonate_as;
    isAdminOverride = true;
  }

  const [message] = await query(
    `INSERT INTO messages (id, conversation_id, sender_id, actual_sender_id, is_admin_override, content, reply_to_message_id) 
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [conversationId, senderId, actualSenderId, isAdminOverride, content, reply_to_message_id || null]
  );
  
  // Fetch populated message
  const [populatedMessage] = await query(
    `SELECT 
      m.*,
      u.name as sender_name,
      u.avatar_url as sender_avatar,
      rm.content as replied_message_content,
      rm.sender_id as replied_message_sender_id,
      '[]'::json as reactions
     FROM messages m
     LEFT JOIN users u ON u.id = m.sender_id
     LEFT JOIN messages rm ON m.reply_to_message_id = rm.id
     WHERE m.id = $1`,
    [message.id]
  );

  // Emit Socket.IO events
  try {
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit('new_message', populatedMessage);
    
    // Also alert admins so their sidebar updates in real-time
    io.to('admins').emit('admin_new_message', populatedMessage);
  } catch (e) {}

  // Trigger Web Push Notification in background
  try {
    const { notifyChatMessagePush } = await import('../notifications/push.service');
    notifyChatMessagePush({
      conversationId,
      type: conv.type,
      initiatorId: conv.initiator_id,
      recipientId: conv.recipient_id,
      isApproved: conv.is_approved_for_recipient,
      // Use actualSenderId for routing decisions — senderId may be impersonated user
      senderId: actualSenderId,
      senderName: (populatedMessage as any)?.sender_name || 'User',
      content
    }).catch(() => {});
  } catch (e) {}

  res.status(201).json({ success: true, data: populatedMessage });
};

// ─── Toggle Conversation Approval (Admin Only) ──────────────────────────────
export const toggleConversationApproval = async (req: Request, res: Response) => {
  const user = req.user!;
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
  if (!isAdmin) throw new ForbiddenError('Admin access required');

  const { conversationId } = req.params;
  const { is_approved } = req.body;

  let newStatus = is_approved;
  if (typeof newStatus !== 'boolean') {
    const conv = await queryOne('SELECT is_approved_for_recipient FROM conversations WHERE id = $1', [conversationId]);
    if (!conv) throw new NotFoundError('Conversation not found');
    newStatus = !conv.is_approved_for_recipient;
  }

  const [updated] = await query(
    `UPDATE conversations 
     SET is_approved_for_recipient = $2, updated_at = NOW() 
     WHERE id = $1 
     RETURNING id, type, initiator_id, recipient_id, is_approved_for_recipient`,
    [conversationId, newStatus]
  );

  try {
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit('approval_status_changed', {
      conversationId,
      is_approved_for_recipient: newStatus,
    });
    io.to('admins').emit('approval_status_changed', {
      conversationId,
      is_approved_for_recipient: newStatus,
    });
  } catch (e) {}

  res.json({ success: true, data: updated });
};

// ─── Chat Global Settings (Admin Only) ──────────────────────────────────────
export const getChatSettings = async (req: Request, res: Response) => {
  const user = req.user!;
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
  if (!isAdmin) throw new ForbiddenError('Admin access required');

  const setting = await queryOne(`SELECT value FROM system_settings WHERE key = 'auto_approve_p2p_chat'`);
  const autoApprove = (setting?.value as any)?.enabled ?? false;

  res.json({ success: true, data: { auto_approve_p2p_chat: autoApprove } });
};

export const updateChatSettings = async (req: Request, res: Response) => {
  const user = req.user!;
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
  if (!isAdmin) throw new ForbiddenError('Admin access required');

  const { auto_approve_p2p_chat } = req.body;
  const valueJson = JSON.stringify({ enabled: !!auto_approve_p2p_chat });

  await query(
    `INSERT INTO system_settings (key, value, updated_at) 
     VALUES ('auto_approve_p2p_chat', $1::jsonb, NOW()) 
     ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = NOW()`,
    [valueJson]
  );

  res.json({ success: true, data: { auto_approve_p2p_chat: !!auto_approve_p2p_chat } });
};

// ─── Toggle Reaction ────────────────────────────────────────────────────────
export const toggleReaction = async (req: Request, res: Response) => {
  const user = req.user!;
  const userId = user.userId;
  const { conversationId, messageId } = req.params;
  const { emoji } = req.body;

  // First verify conversation membership
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
  if (!isAdmin) {
    const member = await queryOne(
      'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    if (!member) throw new ForbiddenError('You are not a member of this conversation');
  }

  // Check if reaction exists
  const existing = await queryOne(
    'SELECT 1 FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
    [messageId, userId, emoji]
  );

  if (existing) {
    await query(
      'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );
  } else {
    await query(
      'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
      [messageId, userId, emoji]
    );
  }

  try {
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit('reaction_toggled', { messageId, userId, emoji, added: !existing, user_name: (user as any).name || user.email || 'User' });
  } catch (e) {}

  res.json({ success: true, data: { toggled: true } });
};

// ─── Mark As Read ─────────────────────────────────────────────────────────────
export const markAsRead = async (req: Request, res: Response) => {
  const user = req.user!;
  const userId = user.userId;
  const { conversationId } = req.params;

  await query(
    'UPDATE messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false',
    [conversationId, userId]
  );

  try {
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit('messages_read', { conversationId, readBy: userId });
  } catch (e) {}

  res.json({ success: true, data: { marked: true } });
};

