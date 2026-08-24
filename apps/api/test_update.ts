import { config } from 'dotenv';
config();
import { updateProperty } from './src/modules/properties/property.service';
import { query } from './src/database';

async function run() {
  const props = await query(`SELECT id, owner_id FROM properties LIMIT 1`);
  if (!props.rows.length) return console.log('no property');
  
  const id = props.rows[0].id;
  const owner = props.rows[0].owner_id;
  
  console.log('Updating property:', id);
  await updateProperty(
    id, 
    { 
      landDetails: { 
        plotLength: 100, 
        plotWidth: 200 
      } 
    },
    owner,
    ['USER']
  );
  
  const res = await query(`SELECT plot_length, plot_width FROM property_land_details WHERE property_id = $1`, [id]);
  console.log('Result:', res.rows);
  process.exit(0);
}

run().catch(console.error);
