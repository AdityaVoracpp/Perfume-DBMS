const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function runSeed() {
  let connection;
  try {
    console.log('Connecting to Aiven Database...');
    connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'perfume_user',
        password: process.env.DB_PASSWORD || 'perfume_password',
        database: process.env.DB_NAME || 'defaultdb',
        port: process.env.DB_PORT || 3306,
        ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud') ? { 
          rejectUnauthorized: true,
          ca: fs.readFileSync(path.join(__dirname, 'ca.pem'))
        } : null,
        multipleStatements: true
    });

    console.log('Connected!');

    // 1. Run Schema.sql
    console.log('Reading Schema.sql...');
    let schemaSql = fs.readFileSync(path.join(__dirname, '../Schema.sql'), 'utf8');
    schemaSql = schemaSql.replace(/CREATE DATABASE .*;/g, '');
    schemaSql = schemaSql.replace(/USE .*;/g, '');
    
    console.log('Executing Schema...');
    await connection.query(schemaSql);
    console.log('Schema created successfully!');

    // 2. Generate 02-seed.sql
    console.log('Generating seed data...');
    execSync('node generate_seed.js', { cwd: path.join(__dirname, '../'), stdio: 'inherit' });

    // 3. Execute 02-seed.sql
    console.log('Reading 02-seed.sql...');
    let seedSql = fs.readFileSync(path.join(__dirname, '../init_db/02-seed.sql'), 'utf8');
    seedSql = seedSql.replace(/USE .*;/g, '');

    console.log('Executing seed data...');
    await connection.query(seedSql);
    console.log('Seed data inserted successfully!');

    connection.end();
    process.exit(0);
  } catch (err) {
    console.error('Error during cloud seeding:', err);
    if (connection) connection.end();
    process.exit(1);
  }
}

runSeed();
