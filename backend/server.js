require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// --------------- API Routes ---------------
const authRoutes = require('./routes/authRoutes');
const perfumeRoutes = require('./routes/perfumeRoutes');
const brandRoutes = require('./routes/brandRoutes');
const lookupRoutes = require('./routes/lookupRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const searchRoutes = require('./routes/searchRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/perfumes', perfumeRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);

// --------------- Health Check ---------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------- SPA Fallback ---------------
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// --------------- Error Handler ---------------
app.use(errorHandler);

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`\n  🧴 Perfume Recommendation API`);
  console.log(`  ➜ Server:   http://localhost:${PORT}`);
  console.log(`  ➜ API:      http://localhost:${PORT}/api\n`);
});
