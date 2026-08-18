import argon2 from 'argon2';
import { pool, connectDatabase } from './connection';
import { env } from '../config/env';
import { logger } from '../config/logger';

async function createAdmin() {
  const email = env.INITIAL_ADMIN_EMAIL;
  const password = env.INITIAL_ADMIN_PASSWORD;

  if (!email || !password) {
    logger.error('INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be provided in .env');
    process.exit(1);
  }

  await connectDatabase();
  const client = await pool.connect();

  try {
    // Check if user already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    let userId: string;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      logger.info(`User ${email} already exists. Upgrading to ADMIN...`);
      // Update password if they want to override? Let's just grant role
    } else {
      logger.info(`Creating new admin user: ${email}...`);
      const hashedPassword = await argon2.hash(password);
      
      const insertResult = await client.query(
        `INSERT INTO users (name, email, password_hash, status)
         VALUES ($1, $2, $3, 'ACTIVE')
         RETURNING id`,
        ['Admin User', email, hashedPassword]
      );
      userId = insertResult.rows[0].id;
    }

    // Ensure they have the ADMIN role in user_roles mapping
    const adminRoleResult = await client.query(`SELECT id FROM roles WHERE name = 'ADMIN'`);
    if (adminRoleResult.rows.length === 0) {
      throw new Error('ADMIN role not found in roles table! Did you run migrations and seed?');
    }
    const adminRoleId = adminRoleResult.rows[0].id;

    // Check if they already have the role
    const hasRole = await client.query(
      `SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2`,
      [userId, adminRoleId]
    );

    if (hasRole.rows.length === 0) {
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [userId, adminRoleId]
      );
      logger.info(`Successfully granted ADMIN role to ${email}`);
    } else {
      logger.info(`User ${email} is already an ADMIN.`);
    }

    logger.info('Admin setup complete!');
  } catch (error) {
    logger.error('Failed to setup admin user:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

createAdmin();
