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
      `SELECT c.id, c.created_at,
              m.content as last_message, m.created_at as last_message_at,
              cm.user_id as associated_user_id,
              u.name as user_name,
              u.email as user_email,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
       FROM conversations c
       LEFT JOIN conversation_members cm ON cm.conversation_id = c.id
       LEFT JOIN users u ON u.id = cm.user_id
       LEFT JOIN messages m ON m.conversation_id = c.id 
            AND m.id = (SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1)
       ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
       [userId]
    );
  } else {
    conversations = await query(
      `SELECT c.id, c.created_at,
              m.content as last_message, m.created_at as last_message_at,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
       FROM conversations c
       JOIN conversation_members cm ON cm.conversation_id = c.id
       LEFT JOIN messages m ON m.conversation_id = c.id 
            AND m.id = (SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1)
       WHERE cm.user_id = $1
       ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
      [userId]
    );
  }

  res.json({ success: true, data: conversations });
};

// ─── Get or Create Conversation ───────────────────────────────────────────────
export const getOrCreateConversation = async (req: Request, res: Response) => {
  const user = req.user!;
  let targetUserId = user.userId;

  if (req.body.targetUserId && (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN'))) {
    targetUserId = req.body.targetUserId;
  }

  // Since user-to-admin is 1:1, find if user already has a conversation
  const existingConv = await query(
    `SELECT c.id FROM conversations c
     JOIN conversation_members cm ON cm.conversation_id = c.id
     WHERE cm.user_id = $1 LIMIT 1`,
    [targetUserId]
  );

  if (existingConv.length > 0) {
    return res.json({ success: true, data: { id: existingConv[0].id } });
  }

  const [newConv] = await query(
    `INSERT INTO conversations (id) VALUES (gen_random_uuid()) RETURNING id`
  );

  await query(
    `INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2)`,
    [newConv.id, targetUserId]
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
      rm.content as replied_message_content,
      rm.sender_id as replied_message_sender_id,
      (
        SELECT COALESCE(json_agg(json_build_object('emoji', r.emoji, 'user_id', r.user_id, 'user_name', u.name)), '[]'::json)
        FROM message_reactions r
        LEFT JOIN users u ON u.id = r.user_id
        WHERE r.message_id = m.id
      ) as reactions
    FROM messages m
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
  const { content, reply_to_message_id } = req.body;

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

  const [message] = await query(
    `INSERT INTO messages (id, conversation_id, sender_id, content, reply_to_message_id) 
     VALUES (gen_random_uuid(), $1, $2, $3, $4) 
     RETURNING *`,
    [conversationId, userId, content, reply_to_message_id || null]
  );
  
  // Fetch the joined data to broadcast it correctly
  const [populatedMessage] = await query(
    `SELECT 
      m.*,
      rm.content as replied_message_content,
      rm.sender_id as replied_message_sender_id,
      '[]'::json as reactions
     FROM messages m
     LEFT JOIN messages rm ON m.reply_to_message_id = rm.id
     WHERE m.id = $1`,
    [message.id]
  );

  // Emit Socket.IO event
  try {
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit('new_message', populatedMessage);
    
    // Also alert admins so their sidebar updates in real-time
    io.to('admins').emit('admin_new_message', populatedMessage);
  } catch (e) {
    // Ignore error if socket is not initialized (e.g. in tests)
  }

  res.status(201).json({ success: true, data: populatedMessage });
};

// ─── Toggle Reaction ────────────────────────────────────────────────────────
export const toggleReaction = async (req: Request, res: Response) => {
  const user = req.user!;
  const userId = user.userId;
  const { conversationId, messageId } = req.params;
  const { emoji } = req.body; // e.g. "👍"

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
    // Remove it
    await query(
      'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );
  } else {
    // Add it
    await query(
      'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
      [messageId, userId, emoji]
    );
  }

  try {
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit('reaction_toggled', { messageId, userId, emoji, added: !existing, user_name: 'User' });
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
