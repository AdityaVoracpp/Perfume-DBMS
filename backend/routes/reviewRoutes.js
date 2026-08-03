const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Add a review (Authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { perfume_id, rating, comment } = req.body;
    const user_id = req.user.userId;

    if (!perfume_id || !rating) {
      return res.status(400).json({ error: 'perfume_id and rating are required' });
    }

    // Insert review, demonstrating CHECK constraints since DB will reject ratings outside 1-5
    const [result] = await pool.execute(`
      INSERT INTO Review (perfume_id, user_id, rating, comment, review_date)
      VALUES (?, ?, ?, ?, CURRENT_DATE)
    `, [perfume_id, user_id, rating, comment || null]);

    res.status(201).json({ message: 'Review added successfully', reviewId: result.insertId });
  } catch (error) {
    console.error('Add review error:', error);
    // Explicitly pass through DB constraint errors
    if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
      return res.status(400).json({ error: 'Database constraint violation', details: 'Rating must be between 1 and 5.' });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete a review (Authenticated)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const user_id = req.user.userId;

    // Optional: Only allow user to delete their own review
    const [result] = await pool.execute(`
      DELETE FROM Review 
      WHERE review_id = ? AND user_id = ?
    `, [reviewId, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
