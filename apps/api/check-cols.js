const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:shubham@localhost:5432/rewabhoomi' });
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'properties'");
  console.log(res.rows.map(r => r.column_name));
  await client.end();
}

run().catch(console.error);
