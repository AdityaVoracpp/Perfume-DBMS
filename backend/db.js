const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'perfume_user',
  password: process.env.DB_PASSWORD || 'perfume_password',
  database: process.env.DB_NAME || 'PerfumeRecommendation',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud') ? { 
    rejectUnauthorized: true,
    ca: require('fs').readFileSync(require('path').join(__dirname, 'ca.pem'))
  } : null,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
