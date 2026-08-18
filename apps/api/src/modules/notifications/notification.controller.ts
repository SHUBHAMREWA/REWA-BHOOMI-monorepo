import { Request, Response } from 'express';
import { query } from '../../database/connection';

// ─── List Notifications ─────────────────────────────────────────────────────
export const listNotifications = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const notifications = await query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 50`,
    [userId]
  );

  res.json({ success: true, data: notifications });
};

// ─── Mark as Read ───────────────────────────────────────────────────────────
export const markAsRead = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params;

  await query(
    `UPDATE notifications 
     SET read_at = NOW() 
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  res.json({ success: true, message: 'Marked as read' });
};

// ─── Mark All as Read ───────────────────────────────────────────────────────
export const markAllAsRead = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  await query(
    `UPDATE notifications 
     SET read_at = NOW() 
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );

  res.json({ success: true, message: 'All marked as read' });
};
