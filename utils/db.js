const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    port: process.env.PG_PORT || 5432,
    max: 10, // Max number of clients
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

module.exports = pool;
