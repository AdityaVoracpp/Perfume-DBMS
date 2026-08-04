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

    connection.end();

    // Run the actual CSV importer asynchronously so the request doesn't timeout
    exec('node backend/import_parfumo.js', { cwd: path.join(__dirname, '../') }, (error, stdout, stderr) => {
        if (error) console.error("Importer error:", error);
        if (stdout) console.log("Importer output:", stdout);
    });

    res.send('<h1>Database Seeding Started!</h1><p>The server is downloading the CSV and populating the database with 1000 real perfumes in the background. It will also download images. Check the dashboard in about 30 seconds!</p><p>You can remove this route now.</p>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error starting seeding: ' + err.message);
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
