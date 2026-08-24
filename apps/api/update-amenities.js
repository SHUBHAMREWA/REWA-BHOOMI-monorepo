const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:shubham@localhost:5432/rewabhoomi' });
  await client.connect();
  
  await client.query("UPDATE property_amenities SET name = 'Bijli (Power Backup)' WHERE name = 'Power Backup'");
  await client.query("UPDATE property_amenities SET name = 'Near Market' WHERE name = 'Market Nearby'");
  await client.query("UPDATE property_amenities SET name = 'Near School' WHERE name = 'School Nearby'");
  await client.query("UPDATE property_amenities SET name = 'Near Hospital' WHERE name = 'Hospital Nearby'");
  await client.query("UPDATE property_amenities SET name = 'Near Gym' WHERE name = 'Gym'");
  await client.query("INSERT INTO property_amenities (name, icon) SELECT 'Near College', 'school' WHERE NOT EXISTS (SELECT 1 FROM property_amenities WHERE name = 'Near College')");
  
  console.log('Amenities updated');
  await client.end();
}

run().catch(console.error);
