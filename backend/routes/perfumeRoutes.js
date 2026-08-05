const express = require('express');
const pool = require('../db');

const router = express.Router();

// Dashboard - Aggregate queries
router.get('/dashboard', async (req, res) => {
  try {
    const [counts] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM Perfume) AS total_perfumes,
        (SELECT COUNT(*) FROM Brand) AS total_brands,
        (SELECT COUNT(*) FROM Review) AS total_reviews
    `);

    const [categoryData] = await pool.execute(`
      SELECT c.name, COUNT(pc.perfume_id) as count
      FROM Category c
      JOIN PerfumeCategory pc ON c.category_id = pc.category_id
      GROUP BY c.name
      ORDER BY count DESC
    `);

    const [noteData] = await pool.execute(`
      SELECT n.note_name, COUNT(pn.perfume_id) as count
      FROM Note n
      JOIN PerfumeNote pn ON n.note_id = pn.note_id
      GROUP BY n.note_name
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({ stats: counts[0], categoryData, noteData });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Catalog / Advanced Search
router.get('/search', async (req, res) => {
  try {
    const { gender, season, category, note, sort, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT p.perfume_id, p.name, p.gender, p.price, p.image_url, b.brand_name,
        AVG(r.rating) as avg_rating, COUNT(r.review_id) as review_count
      FROM Perfume p
      LEFT JOIN Brand b ON p.brand_id = b.brand_id
      LEFT JOIN Review r ON p.perfume_id = r.perfume_id
    `;
    
    let joins = [];
    let whereClauses = [];
    let queryParams = [];

    if (gender) {
      if (gender === 'Male' || gender === 'Female') {
        whereClauses.push('(p.gender = ? OR p.gender = "Unisex")');
        queryParams.push(gender);
      } else if (gender === 'Unisex') {
        whereClauses.push('p.gender = "Unisex"');
      } else if (gender === 'Other') {
        // Recommend all perfumes for 'Other' (no gender filter)
      } else {
        whereClauses.push('p.gender = ?');
        queryParams.push(gender);
      }
    }

    if (season) {
      joins.push('JOIN PerfumeSeason ps ON p.perfume_id = ps.perfume_id');
      joins.push('JOIN Season s ON ps.season_id = s.season_id');
      whereClauses.push('s.name = ?');
      queryParams.push(season);
    }

    if (category) {
      joins.push('JOIN PerfumeCategory pc ON p.perfume_id = pc.perfume_id');
      joins.push('JOIN Category c ON pc.category_id = c.category_id');
      whereClauses.push('c.name = ?');
      queryParams.push(category);
    }

    if (note) {
      joins.push('JOIN PerfumeNote pn ON p.perfume_id = pn.perfume_id');
      joins.push('JOIN Note n ON pn.note_id = n.note_id');
      whereClauses.push('n.note_name = ?');
      queryParams.push(note);
    }

    let countQuery = `
      SELECT COUNT(DISTINCT p.perfume_id) as total
      FROM Perfume p
      LEFT JOIN Brand b ON p.brand_id = b.brand_id
    `;
    if (joins.length > 0) countQuery += ' ' + joins.join(' ');
    if (whereClauses.length > 0) countQuery += ' WHERE ' + whereClauses.join(' AND ');

    if (joins.length > 0) baseQuery += ' ' + joins.join(' ');
    if (whereClauses.length > 0) baseQuery += ' WHERE ' + whereClauses.join(' AND ');

    baseQuery += ' GROUP BY p.perfume_id ';

    let orderByClause = 'ORDER BY p.perfume_id ASC';
    if (sort === 'price_asc') {
      orderByClause = 'ORDER BY p.price ASC, p.perfume_id ASC';
    } else if (sort === 'price_desc') {
      orderByClause = 'ORDER BY p.price DESC, p.perfume_id ASC';
    } else if (sort === 'popularity_desc') {
      orderByClause = 'ORDER BY review_count DESC, avg_rating DESC, p.perfume_id ASC';
    } else if (sort === 'reviews_desc') {
      orderByClause = 'ORDER BY review_count DESC, p.perfume_id ASC';
    } else if (sort === 'rating_desc') {
      orderByClause = 'ORDER BY avg_rating DESC, p.perfume_id ASC';
    }

    baseQuery += ` ${orderByClause} LIMIT ? OFFSET ?`;
    
    // Get total count
    const [countResult] = await pool.query(countQuery, queryParams);
    const totalCount = countResult[0].total;

    queryParams.push(Number(limit), Number(offset));

    const [results] = await pool.query(baseQuery, queryParams);
    res.json({ results, page: Number(page), limit: Number(limit), total: totalCount, totalPages: Math.ceil(totalCount / limit) });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Perfume Detail View
router.get('/:id', async (req, res) => {
  try {
    const perfumeId = req.params.id;

    const [perfumes] = await pool.execute(`
      SELECT p.*, b.brand_name, b.origin_country, bt.type_name as brand_type, 
             pf.longevity, pf.sillage
      FROM Perfume p
      LEFT JOIN Brand b ON p.brand_id = b.brand_id
      LEFT JOIN BrandType bt ON b.brand_type_id = bt.brand_type_id
      LEFT JOIN Performance pf ON p.perfume_id = pf.perfume_id
      WHERE p.perfume_id = ?
    `, [perfumeId]);

    if (perfumes.length === 0) {
      return res.status(404).json({ error: 'Perfume not found' });
    }
    
    const perfume = perfumes[0];

    // Fetch notes
    const [notes] = await pool.execute(`
      SELECT n.note_name, n.note_type
      FROM PerfumeNote pn
      JOIN Note n ON pn.note_id = n.note_id
      WHERE pn.perfume_id = ?
    `, [perfumeId]);

    // Fetch seasons
    const [seasons] = await pool.execute(`
      SELECT s.name
      FROM PerfumeSeason ps
      JOIN Season s ON ps.season_id = s.season_id
      WHERE ps.perfume_id = ?
    `, [perfumeId]);

    // Fetch categories
    const [categories] = await pool.execute(`
      SELECT c.name
      FROM PerfumeCategory pc
      JOIN Category c ON pc.category_id = c.category_id
      WHERE pc.perfume_id = ?
    `, [perfumeId]);
    
    // Fetch reviews
    const [reviews] = await pool.execute(`
      SELECT r.review_id, r.rating, r.comment, r.review_date, u.username
      FROM Review r
      JOIN Users u ON r.user_id = u.user_id
      WHERE r.perfume_id = ?
      ORDER BY r.review_date DESC
    `, [perfumeId]);

    perfume.notes = notes;
    perfume.seasons = seasons.map(s => s.name);
    perfume.categories = categories.map(c => c.name);
    perfume.reviews = reviews;

    res.json(perfume);
  } catch (error) {
    console.error('Detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const { authenticateToken } = require('../middleware/authMiddleware');

// Add a Perfume (Authenticated - Demonstrates Transactions)
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, brand_id, gender, release_year, price, image_url, description, notes, categories, seasons, performance } = req.body;

    // 1. Insert Perfume
    const [perfumeResult] = await connection.execute(`
      INSERT INTO Perfume (name, brand_id, gender, release_year, price, image_url, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, brand_id, gender, release_year, price, image_url, description]);

    const perfumeId = perfumeResult.insertId;

    // 2. Insert Performance (1:1)
    if (performance) {
      await connection.execute(`
        INSERT INTO Performance (perfume_id, longevity, sillage)
        VALUES (?, ?, ?)
      `, [perfumeId, performance.longevity, performance.sillage]);
    }

    // 3. Insert Notes (M:N)
    if (notes && notes.length > 0) {
      for (const noteId of notes) {
        await connection.execute('INSERT INTO PerfumeNote (perfume_id, note_id) VALUES (?, ?)', [perfumeId, noteId]);
      }
    }

    // 4. Insert Categories (M:N)
    if (categories && categories.length > 0) {
      for (const catId of categories) {
        await connection.execute('INSERT INTO PerfumeCategory (perfume_id, category_id) VALUES (?, ?)', [perfumeId, catId]);
      }
    }

    // 5. Insert Seasons (M:N)
    if (seasons && seasons.length > 0) {
      for (const seasonId of seasons) {
        await connection.execute('INSERT INTO PerfumeSeason (perfume_id, season_id) VALUES (?, ?)', [perfumeId, seasonId]);
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Perfume created successfully', perfumeId });

  } catch (error) {
    await connection.rollback();
    console.error('Create perfume error:', error);
    res.status(500).json({ error: 'Failed to create perfume, transaction rolled back', details: error.message });
  } finally {
    connection.release();
  }
});

// Delete a Perfume (Authenticated - Demonstrates Cascading Deletes)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const perfumeId = req.params.id;

    // Because of ON DELETE CASCADE, deleting from Perfume will automatically
    // delete associated Reviews, Performance, PerfumeNote, PerfumeSeason, etc.
    const [result] = await pool.execute('DELETE FROM Perfume WHERE perfume_id = ?', [perfumeId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Perfume not found' });
    }

    res.json({ message: 'Perfume and all associated data deleted successfully (Cascade Delete)' });
  } catch (error) {
    console.error('Delete perfume error:', error);
    // Explicitly pass through DB constraint errors (e.g. if we tried to delete a brand with perfumes)
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
