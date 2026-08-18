import { Request, Response } from 'express';
import { query, queryOne } from '../../database/connection';
import { NotFoundError } from '../../errors/AppError';

// ─── Initiate Call ──────────────────────────────────────────────────────────
export const initiateCall = async (req: Request, res: Response) => {
  const callerId = req.user?.userId;
  const { receiverId, callType } = req.body;

  const [call] = await query(
    `INSERT INTO calls (id, caller_id, receiver_id, status, type) 
     VALUES (gen_random_uuid(), $1, $2, 'INITIATED', $3) 
     RETURNING *`,
    [callerId, receiverId, callType]
  );

  // Note: Signaling would happen via WebSockets here

  res.status(201).json({ success: true, data: call });
};

// ─── Update Call Status ─────────────────────────────────────────────────────
export const updateCallStatus = async (req: Request, res: Response) => {
  const { callId } = req.params;
  const { status } = req.body; // e.g. ACCEPTED, REJECTED, ENDED

  const call = await queryOne('SELECT id FROM calls WHERE id = $1', [callId]);
  if (!call) throw new NotFoundError('Call not found');

  const [updated] = await query(
    `UPDATE calls SET status = $1, 
      started_at = CASE WHEN $1 = 'ACCEPTED' THEN NOW() ELSE started_at END,
      ended_at = CASE WHEN $1 IN ('ENDED', 'REJECTED') THEN NOW() ELSE ended_at END
     WHERE id = $2 RETURNING *`,
    [status, callId]
  );

  res.json({ success: true, data: updated });
};
