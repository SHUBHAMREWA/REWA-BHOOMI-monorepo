import { query, queryOne } from '../../database/connection';
import { NotFoundError } from '../../errors/AppError';

export async function getUserByUsername(identifier: string) {
  const isEmail = identifier.includes('@');
  const user = await queryOne<{
    id: string;
    name: string;
    username: string;
    bio: string | null;
    avatar_url: string | null;
    created_at: string;
  }>(
    `SELECT id, name, username, bio, avatar_url, created_at
     FROM users 
     WHERE ${isEmail ? 'LOWER(email)' : 'LOWER(username)'} = LOWER($1) AND deleted_at IS NULL AND status = 'ACTIVE'`,
    [identifier.trim()]
  );

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function getUserProperties(identifier: string, isAdmin: boolean = false) {
  const isEmail = identifier.includes('@');
  const properties = await query(
    `SELECT 
      p.id, p.slug, p.title, p.price, p.listing_type, p.status, p.created_at,
      p.city, p.state, p.area, p.area_unit, p.bedrooms, p.bathrooms, p.furnished_status,
      c.name as category_name, c.slug as category_slug,
      (SELECT url FROM property_images pi WHERE pi.property_id = p.id ORDER BY sort_order ASC LIMIT 1) as thumbnail
     FROM properties p
     JOIN users u ON p.owner_id = u.id
     LEFT JOIN property_categories c ON p.category_id = c.id
     WHERE ${isEmail ? 'LOWER(u.email)' : 'LOWER(u.username)'} = LOWER($1) 
       ${isAdmin ? '' : "AND p.status = 'PUBLISHED'"} 
       AND p.deleted_at IS NULL
     ORDER BY p.created_at DESC`,
    [identifier.trim()]
  );

  return properties;
}
