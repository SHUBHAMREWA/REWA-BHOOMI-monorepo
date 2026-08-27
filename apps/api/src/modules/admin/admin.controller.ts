import { Request, Response } from 'express';
import { query, queryOne } from '../../database/connection';
import { BadRequestError, NotFoundError } from '../../errors/AppError';

// ─── Dashboard Stats ────────────────────────────────────────────────────────
export const getDashboardStats = async (req: Request, res: Response) => {
  const usersCount = await queryOne<{ count: string }>('SELECT COUNT(*) FROM users');
  const propertiesCount = await queryOne<{ count: string }>('SELECT COUNT(*) FROM properties');
  const pendingPropertiesCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*) FROM properties WHERE status = $1',
    ['PENDING_REVIEW']
  );
  
  // Example revenue/activity stat
  const activeProjectsCount = await queryOne<{ count: string }>('SELECT COUNT(*) FROM projects WHERE status = $1', ['ONGOING']);

  res.json({
    success: true,
    data: {
      totalUsers: parseInt(usersCount?.count || '0', 10),
      totalProperties: parseInt(propertiesCount?.count || '0', 10),
      pendingProperties: parseInt(pendingPropertiesCount?.count || '0', 10),
      activeProjects: parseInt(activeProjectsCount?.count || '0', 10),
    },
  });
};

// ─── List Users ─────────────────────────────────────────────────────────────
export const listUsers = async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search = '' } = req.query;
  const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

  let usersQuery = `
    SELECT 
      u.id, u.email, u.name, u.phone, u.status, u.avatar_url, u.username,
      (u.email_verified_at IS NOT NULL) AS is_email_verified, 
      u.created_at,
      u.last_login_at,
      COALESCE(pc.total_properties, 0)::int AS total_properties,
      COALESCE(pc.published_properties, 0)::int AS published_properties,
      COALESCE(pc.pending_properties, 0)::int AS pending_properties,
      COALESCE(ur.roles, ARRAY['USER']::text[]) AS roles
    FROM users u
    LEFT JOIN (
      SELECT ur.user_id, array_agg(r.name::text) as roles
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      GROUP BY ur.user_id
    ) ur ON ur.user_id = u.id
    LEFT JOIN (
      SELECT 
        owner_id,
        COUNT(*) AS total_properties,
        COUNT(*) FILTER (WHERE status = 'PUBLISHED') AS published_properties,
        COUNT(*) FILTER (WHERE status = 'PENDING_REVIEW') AS pending_properties
      FROM properties
      WHERE deleted_at IS NULL
      GROUP BY owner_id
    ) pc ON pc.owner_id = u.id
    WHERE u.deleted_at IS NULL
  `;
  const queryParams: any[] = [];

  if (search) {
    usersQuery += ' AND (u.name ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1)';
    queryParams.push(`%${search}%`);
  }

  usersQuery += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
  queryParams.push(parseInt(limit as string, 10), offset);

  const users = await query(usersQuery, queryParams);

  res.json({
    success: true,
    data: users,
  });
};

// ─── Update User Status ─────────────────────────────────────────────────────
export const updateUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['ACTIVE', 'PENDING', 'SUSPENDED', 'BLOCKED', 'DEACTIVATED'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const user = await queryOne<{ id: string; status: string }>('SELECT id, status FROM users WHERE id = $1', [id]);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  await query(
    'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, id]
  );

  // Log audit
  await query(
    'INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, before_data, after_data) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)',
    [
      req.user?.userId,
      'USER_STATUS_UPDATED',
      'user',
      id,
      JSON.stringify({ status: user.status }),
      JSON.stringify({ status }),
    ]
  );

  res.json({
    success: true,
    message: `User status updated to ${status}`,
  });
};

// ─── Update User Role ───────────────────────────────────────────────────────
export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body; // e.g. 'ADMIN' or 'USER'

  const validRoles = ['USER', 'ADMIN', 'SUPER_ADMIN'];
  if (!validRoles.includes(role)) {
    throw new BadRequestError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  const user = await queryOne<{ id: string }>('SELECT id FROM users WHERE id = $1', [id]);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Clear existing roles
  await query('DELETE FROM user_roles WHERE user_id = $1', [id]);
  
  // Insert new role
  await query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE name = $2`,
    [id, role]
  );

  // Log audit
  await query(
    'INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, after_data) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)',
    [
      req.user?.userId,
      'USER_ROLE_UPDATED',
      'user',
      id,
      JSON.stringify({ role }),
    ]
  );

  res.json({
    success: true,
    message: `User role updated to ${role}`,
  });
};

// ─── Moderate Property ──────────────────────────────────────────────────────
export const moderateProperty = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!['PUBLISHED', 'REJECTED', 'SOLD'].includes(status)) {
    throw new BadRequestError('Invalid status. Must be PUBLISHED, REJECTED, or SOLD');
  }

  const property = await queryOne('SELECT id FROM properties WHERE id = $1', [id]);
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  await query(
    'UPDATE properties SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, id]
  );

  // Log audit
  await query(
    'INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, after_data) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)',
    [req.user?.userId, `PROPERTY_${status}`, 'property', id, JSON.stringify({ remarks })]
  );

  res.json({
    success: true,
    message: `Property ${status.toLowerCase()} successfully`,
  });
};

// ─── Audit Logs ─────────────────────────────────────────────────────────────
export const getAuditLogs = async (req: Request, res: Response) => {
  const logs = await query(
    `SELECT a.id, a.action, a.resource_type as entity_type, a.resource_id as entity_id, a.after_data as details, a.created_at, u.name as user_name, u.email as user_email
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC
     LIMIT 50`
  );

  res.json({
    success: true,
    data: logs,
  });
};

// ─── Properties ─────────────────────────────────────────────────────────────
export const listPropertiesAdmin = async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search = '', listingPurpose, startDate, endDate } = req.query;
  const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

  let propertiesQuery = `
    SELECT p.id, p.title, p.slug, p.status, p.price, p.listing_type, p.is_popular, p.created_at, u.name as owner_name, u.email as owner_email, u.avatar_url as owner_avatar
    FROM properties p
    LEFT JOIN users u ON u.id = p.owner_id
    WHERE p.deleted_at IS NULL
  `;
  const queryParams: any[] = [];

  if (search) {
    queryParams.push(`%${search}%`);
    propertiesQuery += ` AND (p.title ILIKE $${queryParams.length} OR u.email ILIKE $${queryParams.length})`;
  }

  if (listingPurpose && listingPurpose !== 'ALL') {
    queryParams.push(listingPurpose);
    propertiesQuery += ` AND p.listing_type = $${queryParams.length}`;
  }

  const { status } = req.query;
  if (status && status !== 'ALL') {
    queryParams.push(status);
    propertiesQuery += ` AND p.status = $${queryParams.length}`;
  }

  if (startDate) {
    queryParams.push(startDate);
    propertiesQuery += ` AND p.created_at >= $${queryParams.length}`;
  }

  if (endDate) {
    queryParams.push(endDate);
    // Add time to cover the entire end date (up to 23:59:59)
    propertiesQuery += ` AND p.created_at <= $${queryParams.length}::timestamp + interval '1 day' - interval '1 second'`;
  }

  propertiesQuery += ` ORDER BY p.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
  queryParams.push(parseInt(limit as string, 10), offset);

  const properties = await query(propertiesQuery, queryParams);

  res.json({
    success: true,
    data: properties,
  });
};

// ─── Projects ─────────────────────────────────────────────────────────────
export const listProjectsAdmin = async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search = '', startDate, endDate } = req.query;
  const offset = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

  let projectsQuery = `
    SELECT pr.id, pr.name, pr.slug, pr.status, pr.created_at, pr.developer as builder_name
    FROM projects pr
    WHERE pr.deleted_at IS NULL
  `;
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (search) {
    projectsQuery += ` AND (pr.name ILIKE $${paramIndex} OR pr.developer ILIKE $${paramIndex})`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }

  if (startDate) {
    projectsQuery += ` AND pr.created_at >= $${paramIndex}`;
    queryParams.push(`${startDate} 00:00:00`);
    paramIndex++;
  }

  if (endDate) {
    projectsQuery += ` AND pr.created_at <= $${paramIndex}`;
    queryParams.push(`${endDate} 23:59:59`);
    paramIndex++;
  }

  projectsQuery += ` ORDER BY pr.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(parseInt(limit as string, 10), offset);

  const projects = await query(projectsQuery, queryParams);

  res.json({
    success: true,
    data: projects,
  });
};

// ─── Toggle Property Popular ────────────────────────────────────────────────
export const togglePropertyPopular = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isPopular } = req.body;

  if (typeof isPopular !== 'boolean') {
    throw new BadRequestError('isPopular must be a boolean');
  }

  const property = await queryOne('SELECT id FROM properties WHERE id = $1', [id]);
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  await query(
    'UPDATE properties SET is_popular = $1, updated_at = NOW() WHERE id = $2',
    [isPopular, id]
  );

  // Log audit
  await query(
    'INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, after_data) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)',
    [req.user?.userId, 'PROPERTY_POPULAR_TOGGLED', 'property', id, JSON.stringify({ is_popular: isPopular })]
  );

  res.json({
    success: true,
    message: `Property marked as ${isPopular ? 'popular' : 'not popular'}`,
  });
};

// ─── Delete Property (Admin Hard Delete) ────────────────────────────────────
import { deleteFromR2 } from '../media/media.service';

export const deletePropertyAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;

  const property = await queryOne('SELECT id FROM properties WHERE id = $1', [id]);
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  // Fetch images to delete from R2 (Cloudflare Storage)
  const images = await query<{ storage_key: string }>(
    'SELECT storage_key FROM property_images WHERE property_id = $1',
    [id],
  );

  for (const img of images) {
    if (img.storage_key && !img.storage_key.startsWith('auto_')) {
      try {
        await deleteFromR2(img.storage_key);
      } catch (err) {
        console.error(`Failed to delete R2 key ${img.storage_key}:`, err);
      }
    }
  }

  // Hard delete: PostgreSQL ON DELETE CASCADE will handle related tables
  await query('DELETE FROM properties WHERE id = $1', [id]);

  // Log audit
  await query(
    'INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id) VALUES (gen_random_uuid(), $1, $2, $3, $4)',
    [req.user?.userId, 'PROPERTY_DELETED_ADMIN', 'property', id]
  );

  res.json({
    success: true,
    message: 'Property and all related data deleted successfully',
  });
};

// ─── Bulk Delete Properties (Admin) ─────────────────────────────────────────
export const bulkDeletePropertiesAdmin = async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new BadRequestError('An array of property IDs is required');
  }

  // Fetch images to delete from R2 for ALL selected properties
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const images = await query<{ storage_key: string }>(
    `SELECT storage_key FROM property_images WHERE property_id IN (${placeholders})`,
    ids
  );

  for (const img of images) {
    if (img.storage_key && !img.storage_key.startsWith('auto_')) {
      try {
        await deleteFromR2(img.storage_key);
      } catch (err) {
        console.error(`Failed to delete R2 key ${img.storage_key}:`, err);
      }
    }
  }

  // Hard delete all specified properties
  await query(`DELETE FROM properties WHERE id IN (${placeholders})`, ids);

  // Log audit
  await query(
    'INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, after_data) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)',
    [req.user?.userId, 'PROPERTIES_BULK_DELETED', 'properties', 'bulk', JSON.stringify({ deleted_ids: ids })]
  );

  res.json({
    success: true,
    message: `${ids.length} properties and related data deleted successfully`,
  });
};
