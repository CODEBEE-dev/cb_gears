const { Pool } = require('pg')

const pool = new Pool({
  host: 'postgres',
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
})

pool.on('error', (err) => {
  console.log(`[DATABASE] Unexpected error on idle client`, err)
})

const query = (text, params) => pool.query(text, params)

module.exports = { query, pool }