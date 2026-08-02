const pool = require('../config/db');

// ───────────────────────────────────────────────
// GET ALL — with Brand join, pagination, sorting
// Showcases: Perfume → Brand (1:N FK join)
// ───────────────────────────────────────────────
async function getAll({ page = 1, limit = 20, sort = 'name', order = 'ASC', gender }) {
  const offset = (page - 1) * limit;
  const allowedSorts = ['name', 'price', 'release_year', 'perfume_id'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'name';
  const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  let where = '';
  const params = [];
  if (gender) {
    where = 'WHERE p.gender = ?';
    params.push(gender);
  }

  const [rows] = await pool.execute(
    `SELECT p.perfume_id, p.name, p.gender, p.release_year, p.price, p.image_url,
            b.brand_id, b.brand_name, bt.type_name AS brand_type
     FROM Perfume p
     LEFT JOIN Brand b ON p.brand_id = b.brand_id
     LEFT JOIN BrandType bt ON b.brand_type_id = bt.brand_type_id
     ${where}
     ORDER BY p.${sortCol} ${sortOrder}
     LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
    params
  );

  const [countResult] = await pool.execute(
    `SELECT COUNT(*) as total FROM Perfume p ${where}`,
    params
  );

  return { perfumes: rows, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) };
}

// ───────────────────────────────────────────────
// GET BY ID — full detail with ALL relationships
// Showcases: 6-table JOIN — the crown jewel query
// ───────────────────────────────────────────────
async function getById(id) {
  // Core perfume + brand + performance
  const [perfumeRows] = await pool.execute(
    `SELECT p.*, b.brand_name, b.origin_country, bt.type_name AS brand_type,
            perf.longevity, perf.sillage
     FROM Perfume p
     LEFT JOIN Brand b ON p.brand_id = b.brand_id
     LEFT JOIN BrandType bt ON b.brand_type_id = bt.brand_type_id
     LEFT JOIN Performance perf ON p.perfume_id = perf.perfume_id
     WHERE p.perfume_id = ?`,
    [id]
  );

  if (perfumeRows.length === 0) return null;
  const perfume = perfumeRows[0];

  // Notes (M:N via PerfumeNote)
  const [notes] = await pool.execute(
    `SELECT n.note_id, n.note_name, n.note_type
     FROM Note n
     JOIN PerfumeNote pn ON n.note_id = pn.note_id
     WHERE pn.perfume_id = ?
     ORDER BY FIELD(n.note_type, 'Top', 'Middle', 'Base'), n.note_name`,
    [id]
  );

  // Seasons (M:N via PerfumeSeason)
  const [seasons] = await pool.execute(
    `SELECT s.season_id, s.name
     FROM Season s
     JOIN PerfumeSeason ps ON s.season_id = ps.season_id
     WHERE ps.perfume_id = ?`,
    [id]
  );

  // Occasions (M:N via PerfumeOccasion)
  const [occasions] = await pool.execute(
    `SELECT o.occasion_id, o.name
     FROM Occasion o
     JOIN PerfumeOccasion po ON o.occasion_id = po.occasion_id
     WHERE po.perfume_id = ?`,
    [id]
  );

  // Categories (M:N via PerfumeCategory)
  const [categories] = await pool.execute(
    `SELECT c.category_id, c.name
     FROM Category c
     JOIN PerfumeCategory pc ON c.category_id = pc.category_id
     WHERE pc.perfume_id = ?`,
    [id]
  );

  // Reviews with usernames
  const [reviews] = await pool.execute(
    `SELECT r.review_id, r.rating, r.comment, r.review_date,
            u.user_id, u.username
     FROM Review r
     JOIN \`User\` u ON r.user_id = u.user_id
     WHERE r.perfume_id = ?
     ORDER BY r.review_date DESC`,
    [id]
  );

  // Average rating
  const [avgRow] = await pool.execute(
    `SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
     FROM Review WHERE perfume_id = ?`,
    [id]
  );

  return {
    ...perfume,
    notes,
    seasons,
    occasions,
    categories,
    reviews,
    avg_rating: avgRow[0].avg_rating ? parseFloat(avgRow[0].avg_rating).toFixed(1) : null,
    review_count: avgRow[0].review_count
  };
}

// ───────────────────────────────────────────────
// CREATE — with transaction for junction tables
// Showcases: Transactions across 5+ tables
// ───────────────────────────────────────────────
async function create(data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert perfume
    const [result] = await conn.execute(
      `INSERT INTO Perfume (name, brand_id, gender, release_year, price, image_url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.brand_id, data.gender, data.release_year, data.price, data.image_url || null, data.description || null]
    );
    const perfumeId = result.insertId;

    // Insert performance (1:1)
    if (data.longevity || data.sillage) {
      await conn.execute(
        'INSERT INTO Performance (perfume_id, longevity, sillage) VALUES (?, ?, ?)',
        [perfumeId, data.longevity || null, data.sillage || null]
      );
    }

    // Insert junction table rows
    if (data.note_ids?.length) {
      const placeholders = data.note_ids.map(() => '(?, ?)').join(', ');
      const params = data.note_ids.flatMap(nid => [perfumeId, nid]);
      await conn.execute(`INSERT INTO PerfumeNote (perfume_id, note_id) VALUES ${placeholders}`, params);
    }

    if (data.season_ids?.length) {
      const placeholders = data.season_ids.map(() => '(?, ?)').join(', ');
      const params = data.season_ids.flatMap(sid => [perfumeId, sid]);
      await conn.execute(`INSERT INTO PerfumeSeason (perfume_id, season_id) VALUES ${placeholders}`, params);
    }

    if (data.occasion_ids?.length) {
      const placeholders = data.occasion_ids.map(() => '(?, ?)').join(', ');
      const params = data.occasion_ids.flatMap(oid => [perfumeId, oid]);
      await conn.execute(`INSERT INTO PerfumeOccasion (perfume_id, occasion_id) VALUES ${placeholders}`, params);
    }

    if (data.category_ids?.length) {
      const placeholders = data.category_ids.map(() => '(?, ?)').join(', ');
      const params = data.category_ids.flatMap(cid => [perfumeId, cid]);
      await conn.execute(`INSERT INTO PerfumeCategory (perfume_id, category_id) VALUES ${placeholders}`, params);
    }

    await conn.commit();
    return getById(perfumeId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ───────────────────────────────────────────────
// UPDATE — transaction: update core + replace junctions
// ───────────────────────────────────────────────
async function update(id, data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE Perfume SET name=?, brand_id=?, gender=?, release_year=?, price=?, image_url=?, description=?
       WHERE perfume_id=?`,
      [data.name, data.brand_id, data.gender, data.release_year, data.price, data.image_url || null, data.description || null, id]
    );

    // Upsert performance
    await conn.execute('DELETE FROM Performance WHERE perfume_id = ?', [id]);
    if (data.longevity || data.sillage) {
      await conn.execute(
        'INSERT INTO Performance (perfume_id, longevity, sillage) VALUES (?, ?, ?)',
        [id, data.longevity || null, data.sillage || null]
      );
    }

    // Replace junction rows (delete + re-insert)
    await conn.execute('DELETE FROM PerfumeNote WHERE perfume_id = ?', [id]);
    await conn.execute('DELETE FROM PerfumeSeason WHERE perfume_id = ?', [id]);
    await conn.execute('DELETE FROM PerfumeOccasion WHERE perfume_id = ?', [id]);
    await conn.execute('DELETE FROM PerfumeCategory WHERE perfume_id = ?', [id]);

    if (data.note_ids?.length) {
      const placeholders = data.note_ids.map(() => '(?, ?)').join(', ');
      const params = data.note_ids.flatMap(nid => [id, nid]);
      await conn.execute(`INSERT INTO PerfumeNote (perfume_id, note_id) VALUES ${placeholders}`, params);
    }
    if (data.season_ids?.length) {
      const placeholders = data.season_ids.map(() => '(?, ?)').join(', ');
      const params = data.season_ids.flatMap(sid => [id, sid]);
      await conn.execute(`INSERT INTO PerfumeSeason (perfume_id, season_id) VALUES ${placeholders}`, params);
    }
    if (data.occasion_ids?.length) {
      const placeholders = data.occasion_ids.map(() => '(?, ?)').join(', ');
      const params = data.occasion_ids.flatMap(oid => [id, oid]);
      await conn.execute(`INSERT INTO PerfumeOccasion (perfume_id, occasion_id) VALUES ${placeholders}`, params);
    }
    if (data.category_ids?.length) {
      const placeholders = data.category_ids.map(() => '(?, ?)').join(', ');
      const params = data.category_ids.flatMap(cid => [id, cid]);
      await conn.execute(`INSERT INTO PerfumeCategory (perfume_id, category_id) VALUES ${placeholders}`, params);
    }

    await conn.commit();
    return getById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ───────────────────────────────────────────────
// DELETE — cascade handled by ON DELETE CASCADE
// ───────────────────────────────────────────────
async function remove(id) {
  const [result] = await pool.execute('DELETE FROM Perfume WHERE perfume_id = ?', [id]);
  return result.affectedRows > 0;
}

// ───────────────────────────────────────────────
// FIND SIMILAR — perfumes sharing the most notes
// Showcases: Self-join on PerfumeNote junction table
// ───────────────────────────────────────────────
async function findSimilar(id, limit = 5) {
  const [rows] = await pool.execute(
    `SELECT p.perfume_id, p.name, p.price, p.image_url, p.gender,
            b.brand_name, COUNT(pn2.note_id) AS shared_notes
     FROM PerfumeNote pn1
     JOIN PerfumeNote pn2 ON pn1.note_id = pn2.note_id AND pn2.perfume_id != pn1.perfume_id
     JOIN Perfume p ON pn2.perfume_id = p.perfume_id
     LEFT JOIN Brand b ON p.brand_id = b.brand_id
     WHERE pn1.perfume_id = ?
     GROUP BY p.perfume_id
     ORDER BY shared_notes DESC
     LIMIT ${parseInt(limit)}`,
    [id]
  );
  return rows;
}

module.exports = { getAll, getById, create, update, remove, findSimilar };
