import { Request, Response } from 'express';
import { query, queryOne } from '../../database/connection';
import { NotFoundError, ForbiddenError } from '../../errors/AppError';

// ─── List Conversations ─────────────────────────────────────────────────────
export const listConversations = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const conversations = await query(
    `SELECT c.id, c.property_id, c.created_at,
            p.title as property_title,
            m.content as last_message, m.created_at as last_message_at
     FROM conversations c
     JOIN conversation_members cm ON cm.conversation_id = c.id
     LEFT JOIN properties p ON p.id = c.property_id
     LEFT JOIN messages m ON m.conversation_id = c.id 
          AND m.id = (SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1)
     WHERE cm.user_id = $1
     ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
    [userId]
  );

  res.json({ success: true, data: conversations });
};

// ─── Get Messages ───────────────────────────────────────────────────────────
export const getMessages = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { conversationId } = req.params;
  const { limit = '50', before } = req.query;

  // Verify membership
  const member = await queryOne(
    'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );

  if (!member) {
    throw new ForbiddenError('You are not a member of this conversation');
  }

  let sql = 'SELECT * FROM messages WHERE conversation_id = $1';
  const params: any[] = [conversationId];

  if (before) {
    sql += ' AND created_at < $2';
    params.push(before);
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
  params.push(parseInt(limit as string, 10));

  const messages = await query(sql, params);

  res.json({ success: true, data: messages });
};

// ─── Send Message ───────────────────────────────────────────────────────────
export const sendMessage = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { conversationId } = req.params;
  const { content } = req.body;

  // Verify membership
  const member = await queryOne(
    'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );

  if (!member) {
    throw new ForbiddenError('You are not a member of this conversation');
  }

  const [message] = await query(
    `INSERT INTO messages (id, conversation_id, sender_id, content) 
     VALUES (gen_random_uuid(), $1, $2, $3) 
     RETURNING *`,
    [conversationId, userId, content]
  );

  // In a real app, emit Socket.IO event here
  // io.to(conversationId).emit('new_message', message);

  res.status(201).json({ success: true, data: message });
};
