const pool = require('../config/db');

// ───────────────────────────────────────────────
// GET REVIEWS for a perfume
// Showcases: Review → User join, ORDER BY, aggregation
// ───────────────────────────────────────────────
async function getByPerfumeId(perfumeId) {
  const [rows] = await pool.execute(
    `SELECT r.review_id, r.rating, r.comment, r.review_date,
            u.user_id, u.username
     FROM Review r
     JOIN \`User\` u ON r.user_id = u.user_id
     WHERE r.perfume_id = ?
     ORDER BY r.review_date DESC`,
    [perfumeId]
  );
  return rows;
}

// ───────────────────────────────────────────────
// GET REVIEWS by a user (for profile page)
// ───────────────────────────────────────────────
async function getByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT r.review_id, r.rating, r.comment, r.review_date,
            p.perfume_id, p.name AS perfume_name, p.image_url,
            b.brand_name
     FROM Review r
     JOIN Perfume p ON r.perfume_id = p.perfume_id
     LEFT JOIN Brand b ON p.brand_id = b.brand_id
     WHERE r.user_id = ?
     ORDER BY r.review_date DESC`,
    [userId]
  );
  return rows;
}

// ───────────────────────────────────────────────
// CREATE — user submits a review
// Showcases: INSERT with CHECK constraint (rating 1-5)
// ───────────────────────────────────────────────
async function create({ perfume_id, user_id, rating, comment }) {
  if (!perfume_id || !user_id || !rating) {
    const err = new Error('perfume_id, user_id, and rating are required');
    err.status = 400;
    throw err;
  }
  if (rating < 1 || rating > 5) {
    const err = new Error('Rating must be between 1 and 5');
    err.status = 400;
    throw err;
  }

  const [result] = await pool.execute(
    `INSERT INTO Review (perfume_id, user_id, rating, comment, review_date)
     VALUES (?, ?, ?, ?, CURDATE())`,
    [perfume_id, user_id, rating, comment || null]
  );

  return { review_id: result.insertId, perfume_id, user_id, rating, comment, review_date: new Date().toISOString().split('T')[0] };
}

async function remove(reviewId, userId) {
  // Only the review author can delete
  const [result] = await pool.execute(
    'DELETE FROM Review WHERE review_id = ? AND user_id = ?',
    [reviewId, userId]
  );
  return result.affectedRows > 0;
}

module.exports = { getByPerfumeId, getByUserId, create, remove };
