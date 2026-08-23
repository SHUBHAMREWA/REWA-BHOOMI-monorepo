require('dotenv').config();
const { Pool } = require('pg');

async function test() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/rewa_bhoomi'
  });
  
  const res = await pool.query(`SELECT id FROM properties WHERE deleted_at IS NULL LIMIT 1`);
  if (!res.rows.length) return console.log('No property');
  
  const id = res.rows[0].id;
  
  console.log('Testing with property', id);
  
  try {
    await pool.query(
      `INSERT INTO property_land_details (
        property_id, total_land_area, area_unit, land_type, irrigation_available, soil_type, current_crop,
        fencing, farm_house, nearest_road_distance, nearest_village, nearest_city, plot_length, plot_width
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (property_id) DO UPDATE SET
        total_land_area = EXCLUDED.total_land_area, area_unit = EXCLUDED.area_unit, land_type = EXCLUDED.land_type,
        irrigation_available = EXCLUDED.irrigation_available, soil_type = EXCLUDED.soil_type, current_crop = EXCLUDED.current_crop,
        fencing = EXCLUDED.fencing, farm_house = EXCLUDED.farm_house, nearest_road_distance = EXCLUDED.nearest_road_distance,
        nearest_village = EXCLUDED.nearest_village, nearest_city = EXCLUDED.nearest_city,
        plot_length = EXCLUDED.plot_length, plot_width = EXCLUDED.plot_width`,
      [
        id, 1000, 'SQ_FT', null, false, null, null, false, false, null, null, null, 150, 250
      ]
    );
    console.log('Updated successfully');
    
    const check = await pool.query(`SELECT plot_length, plot_width FROM property_land_details WHERE property_id = $1`, [id]);
    console.log('Check DB:', check.rows);
  } catch (err) {
    console.error('Error:', err);
  }
  
  await pool.end();
}

test();
