const { Client } = require('pg');
const client = new Client('postgresql://postgres:shubham@localhost:5432/rewabhoomi');
client.connect()
  .then(() => client.query('SELECT COUNT(*) FROM users'))
  .then(() => client.query('SELECT COUNT(*) FROM properties'))
  .then(() => client.query('SELECT COUNT(*) FROM properties WHERE status = $1', ['PENDING_REVIEW']))
  .then(() => client.query('SELECT COUNT(*) FROM projects WHERE status = $1', ['ACTIVE']))
  .then(() => console.log('All good'))
  .catch(err => console.error('Error:', err.message))
  .then(() => client.end());
