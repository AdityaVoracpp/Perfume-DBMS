const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const perfumeRoutes = require('./routes/perfumeRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/perfumes', perfumeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Perfume API is running' });
});

// TEMPORARY SEED ROUTE
app.get('/api/seed', async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const mysql = require('mysql2/promise');
  const { execSync } = require('child_process');

  try {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'perfume_user',
        password: process.env.DB_PASSWORD || 'perfume_password',
        database: process.env.DB_NAME || 'defaultdb',
        port: process.env.DB_PORT || 3306,
        ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud') ? { 
          rejectUnauthorized: false
        } : null,
        multipleStatements: true
    });

    let schemaSql = fs.readFileSync(path.join(__dirname, '../Schema.sql'), 'utf8');
    schemaSql = schemaSql.replace(/CREATE DATABASE .*;/g, '');
    schemaSql = schemaSql.replace(/USE .*;/g, '');
    await connection.query(schemaSql);

    execSync('node generate_seed.js', { cwd: path.join(__dirname, '../') });

    let seedSql = fs.readFileSync(path.join(__dirname, '../init_db/02-seed.sql'), 'utf8');
    seedSql = seedSql.replace(/USE .*;/g, '');
    await connection.query(seedSql);

    connection.end();
    res.send('<h1>Database Seeded Successfully!</h1><p>You can now remove this route.</p>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error seeding database: ' + err.message);
  }
});

// Serve static frontend files in production (Render will deploy both together)
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!', details: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
