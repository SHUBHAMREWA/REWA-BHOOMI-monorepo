import { Request, Response } from 'express';
import { query, queryOne, withTransaction } from '../../database/connection';
import { NotFoundError, ForbiddenError } from '../../errors/AppError';

// ─── List Groups ────────────────────────────────────────────────────────────
export const listGroups = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const groups = await query(
    `SELECT g.id, g.name, g.description, g.thumbnail, gm.role as user_role, g.created_at
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id
     WHERE gm.user_id = $1
     ORDER BY g.created_at DESC`,
    [userId]
  );

  res.json({ success: true, data: groups });
};

// ─── Create Group ───────────────────────────────────────────────────────────
export const createGroup = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { name, description, thumbnail, is_private } = req.body;

  const group = await withTransaction(async (client) => {
    // 1. Create group
    const { rows: [newGroup] } = await client.query(
      `INSERT INTO groups (id, name, description, thumbnail, is_private) 
       VALUES (gen_random_uuid(), $1, $2, $3, $4) 
       RETURNING *`,
      [name, description, thumbnail, is_private || false]
    );

    // 2. Add creator as ADMIN
    await client.query(
      `INSERT INTO group_members (group_id, user_id, role) 
       VALUES ($1, $2, 'ADMIN')`,
      [newGroup.id, userId]
    );

    return newGroup;
  });

  res.status(201).json({ success: true, data: group });
};

// ─── Get Group Details ──────────────────────────────────────────────────────
export const getGroupDetails = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { groupId } = req.params;

  const group = await queryOne('SELECT * FROM groups WHERE id = $1', [groupId]);
  if (!group) throw new NotFoundError('Group not found');

  // Verify membership if private
  if (group.is_private) {
    const member = await queryOne(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    if (!member) throw new ForbiddenError('This group is private');
  }

  // Fetch members
  const members = await query(
    `SELECT u.id, u.name, gm.role, gm.joined_at 
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY gm.joined_at ASC`,
    [groupId]
  );

  res.json({
    success: true,
    data: { ...group, members },
  });
};
