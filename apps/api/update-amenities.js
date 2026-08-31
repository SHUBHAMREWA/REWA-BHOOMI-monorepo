const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:shubham@localhost:5432/rewabhoomi' });
  await client.connect();
  
  await client.query("UPDATE property_amenities SET name = 'Bijli (Electricity)' WHERE name = 'Bijli (Power Backup)'");
  await client.query("DELETE FROM property_amenity_mapping WHERE amenity_id IN (SELECT id FROM property_amenities WHERE name = 'Power Backup')");
  await client.query("DELETE FROM property_amenities WHERE name = 'Power Backup'");
  await client.query("DELETE FROM property_amenities WHERE name IN ('Market Nearby', 'School Nearby', 'Hospital Nearby', 'Gym')");
  await client.query("INSERT INTO property_amenities (name, icon) SELECT 'Near College', 'school' WHERE NOT EXISTS (SELECT 1 FROM property_amenities WHERE name = 'Near College')");
  
  const res = await client.query("SELECT name FROM property_amenities ORDER BY name");
  console.log('Current amenities:', res.rows.map(r => r.name));
  
  console.log('Amenities updated');
  await client.end();
}

run().catch(console.error);
