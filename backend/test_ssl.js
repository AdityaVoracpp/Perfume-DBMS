const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testConnection(sslConfig) {
  try {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: sslConfig
    });
    console.log('SUCCESS with:', sslConfig);
    conn.end();
    return true;
  } catch (err) {
    console.log('FAILED with:', sslConfig, '| Error:', err.code);
    return false;
  }
}

async function run() {
  const ca = fs.readFileSync(path.join(__dirname, 'ca.pem'));
  
  const configs = [
    { ca, rejectUnauthorized: true },
    { ca, rejectUnauthorized: false },
    { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
    { ca, minVersion: 'TLSv1.2' },
    'Amazon RDS'
  ];

  for (let config of configs) {
    const ok = await testConnection(config);
    if (ok) process.exit(0);
  }
  process.exit(1);
}

run();
