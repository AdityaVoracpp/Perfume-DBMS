const pool = require('../config/db');

// ───────────────────────────────────────────────
// GET ALL — with BrandType join and perfume count
// Showcases: Brand → BrandType (FK), aggregate COUNT
// ───────────────────────────────────────────────
async function getAll() {
  const [rows] = await pool.execute(
    `SELECT b.brand_id, b.brand_name, b.origin_country,
            bt.brand_type_id, bt.type_name AS brand_type,
            COUNT(p.perfume_id) AS perfume_count
     FROM Brand b
     LEFT JOIN BrandType bt ON b.brand_type_id = bt.brand_type_id
     LEFT JOIN Perfume p ON b.brand_id = p.brand_id
     GROUP BY b.brand_id
     ORDER BY b.brand_name`
  );
  return rows;
}

// ───────────────────────────────────────────────
// GET BY ID — brand detail + its perfumes
// Showcases: 1:N Brand → Perfume relationship
// ───────────────────────────────────────────────
async function getById(id) {
  const [brandRows] = await pool.execute(
    `SELECT b.*, bt.type_name AS brand_type
     FROM Brand b
     LEFT JOIN BrandType bt ON b.brand_type_id = bt.brand_type_id
     WHERE b.brand_id = ?`,
    [id]
  );
  if (brandRows.length === 0) return null;

  const [perfumes] = await pool.execute(
    `SELECT p.perfume_id, p.name, p.gender, p.release_year, p.price, p.image_url,
            perf.longevity, perf.sillage
     FROM Perfume p
     LEFT JOIN Performance perf ON p.perfume_id = perf.perfume_id
     WHERE p.brand_id = ?
     ORDER BY p.release_year DESC`,
    [id]
  );

  return { ...brandRows[0], perfumes };
}

async function create({ brand_name, origin_country, brand_type_id }) {
  const [result] = await pool.execute(
    'INSERT INTO Brand (brand_name, origin_country, brand_type_id) VALUES (?, ?, ?)',
    [brand_name, origin_country || null, brand_type_id || null]
  );
  return getById(result.insertId);
}

async function update(id, { brand_name, origin_country, brand_type_id }) {
  await pool.execute(
    'UPDATE Brand SET brand_name=?, origin_country=?, brand_type_id=? WHERE brand_id=?',
    [brand_name, origin_country || null, brand_type_id || null, id]
  );
  return getById(id);
}

async function remove(id) {
  const [result] = await pool.execute('DELETE FROM Brand WHERE brand_id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { getAll, getById, create, update, remove };
