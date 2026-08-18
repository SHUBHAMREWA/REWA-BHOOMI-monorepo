import { query } from './connection';

async function run() {
  try {
    const project = await query(
      `INSERT INTO projects (
        id, name, slug, description, developer, status, total_plots, total_area,
        city, state, address, latitude, longitude, created_by
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *`,
      [
        'Test Project', 'test-project', 'Test desc', 'Dev', 'ONGOING', 30, 9990,
        'Rewa', 'MP', 'Rewa', 24.517086, 81.289875, null
      ]
    );
    console.log('Success:', project);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

run();
