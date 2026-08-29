import { pool, connectDatabase } from './connection';
import { logger } from '../config/logger';

export async function runSeed(closePool = true) {
  await connectDatabase();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ─── Property Categories ────────────────────────────────────────────────────
    logger.info('Seeding property categories...');
    await client.query(`
      INSERT INTO property_categories (name, slug, icon, sort_order) VALUES
        ('Plot',       'plot',       'landscape',        1),
        ('House',      'house',      'home',             2),
        ('Villa',      'villa',      'villa',            3),
        ('Land',       'land',       'terrain',          4),
        ('Apartment',  'apartment',  'apartment',        5),
        ('Flat',       'flat',       'business',         6),
        ('Commercial', 'commercial', 'store',            7),
        ('Office',     'office',     'work',             8),
        ('Shop',       'shop',       'storefront',       9),
        ('Warehouse',  'warehouse',  'warehouse',        10),
        ('Farmhouse',  'farmhouse',  'agriculture',      11),
        ('Other',      'other',      'category',         12)
      ON CONFLICT (slug) DO NOTHING
    `);

    // ─── Property Amenities ─────────────────────────────────────────────────────
    logger.info('Seeding property amenities...');
    await client.query(`
      INSERT INTO property_amenities (name, icon) VALUES
        ('Swimming Pool',   'pool'),
        ('Gym',             'fitness_center'),
        ('Parking',         'local_parking'),
        ('Security',        'security'),
        ('Power Backup',    'electrical_services'),
        ('Lift',            'elevator'),
        ('Garden',          'park'),
        ('Club House',      'villa'),
        ('Play Area',       'sports_esports'),
        ('CCTV',            'videocam'),
        ('Water Supply',    'water_drop'),
        ('Bore Well',       'water'),
        ('Solar Panel',     'solar_power'),
        ('Rain Water Harvesting', 'umbrella'),
        ('Intercom',        'call'),
        ('Gated Community', 'gated'),
        ('Temple',          'temple_hindu'),
        ('Hospital Nearby', 'local_hospital'),
        ('School Nearby',   'school'),
        ('Market Nearby',   'shopping_cart')
      ON CONFLICT (name) DO NOTHING
    `);

    // ─── Blog Categories ────────────────────────────────────────────────────────
    logger.info('Seeding blog categories...');
    await client.query(`
      INSERT INTO blog_categories (name, slug) VALUES
        ('Buying Guide',   'buying-guide'),
        ('Selling Tips',   'selling-tips'),
        ('Market Updates', 'market-updates'),
        ('Legal & Finance','legal-finance'),
        ('Interior',       'interior'),
        ('News',           'news')
      ON CONFLICT (slug) DO NOTHING
    `);

    // ─── Super Admin User ───────────────────────────────────────────────────────
    logger.info('Creating default super admin...');
    const argon2 = await import('argon2');
    const passwordHash = await argon2.hash('Admin@1234!', {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    const adminResult = await client.query(`
      INSERT INTO users (name, email, password_hash, status, email_verified_at)
      VALUES ('Super Admin', 'admin@rewabhoomi.com', $1, 'ACTIVE', NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [passwordHash]);

    if (adminResult.rows.length > 0) {
      const adminId = adminResult.rows[0].id;
      await client.query(`
        INSERT INTO user_roles (user_id, role_id)
        SELECT $1, id FROM roles WHERE name IN ('USER', 'ADMIN', 'SUPER_ADMIN')
        ON CONFLICT DO NOTHING
      `, [adminId]);
      logger.info(`✅ Super admin created: admin@rewabhoomi.com / Admin@1234!`);
    } else {
      logger.info('⏭  Super admin already exists, skipping');
    }

    await client.query('COMMIT');
    logger.info('🌱 Database seeded successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, '❌ Seed failed');
    if (closePool) process.exit(1);
  } finally {
    client.release();
    if (closePool) await pool.end();
  }
}

const isDirectRun = require.main === module || 
  (process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js')));

if (isDirectRun) {
  runSeed().catch((err) => {
    logger.error({ err }, 'Seed runner failed');
    process.exit(1);
  });
}
