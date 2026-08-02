const pool = require('../config/db');

/**
 * Advanced multi-dimensional search.
 * Showcases: Dynamic WHERE + HAVING with multiple junction table JOINs.
 *
 * This is the most complex query in the system — it demonstrates why
 * the schema's M:N tagging design (Season, Occasion, Category) is powerful.
 *
 * Filters: gender, minPrice, maxPrice, longevity, sillage,
 *          season_ids[], occasion_ids[], category_ids[], note_ids[], brand_type_ids[]
 */
async function search(filters) {
  const conditions = [];
  const havings = [];
  const params = [];
  const joins = new Set();

  // --- Direct column filters on Perfume ---
  if (filters.gender) {
    conditions.push('p.gender = ?');
    params.push(filters.gender);
  }
  if (filters.minPrice) {
    conditions.push('p.price >= ?');
    params.push(parseFloat(filters.minPrice));
  }
  if (filters.maxPrice) {
    conditions.push('p.price <= ?');
    params.push(parseFloat(filters.maxPrice));
  }
  if (filters.q) {
    conditions.push('(p.name LIKE ? OR b.brand_name LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  // --- Performance ENUM filters ---
  if (filters.longevity) {
    joins.add('LEFT JOIN Performance perf ON p.perfume_id = perf.perfume_id');
    conditions.push('perf.longevity = ?');
    params.push(filters.longevity);
  }
  if (filters.sillage) {
    joins.add('LEFT JOIN Performance perf ON p.perfume_id = perf.perfume_id');
    conditions.push('perf.sillage = ?');
    params.push(filters.sillage);
  }

  // --- Junction table filters (M:N) ---
  // Season
  if (filters.season_ids?.length) {
    joins.add('LEFT JOIN PerfumeSeason ps ON p.perfume_id = ps.perfume_id');
    const placeholders = filters.season_ids.map(() => '?').join(',');
    havings.push(`SUM(ps.season_id IN (${placeholders})) >= ${filters.season_ids.length}`);
    params.push(...filters.season_ids.map(Number));
  }

  // Occasion
  if (filters.occasion_ids?.length) {
    joins.add('LEFT JOIN PerfumeOccasion po ON p.perfume_id = po.perfume_id');
    const placeholders = filters.occasion_ids.map(() => '?').join(',');
    havings.push(`SUM(po.occasion_id IN (${placeholders})) >= ${filters.occasion_ids.length}`);
    params.push(...filters.occasion_ids.map(Number));
  }

  // Category
  if (filters.category_ids?.length) {
    joins.add('LEFT JOIN PerfumeCategory pc ON p.perfume_id = pc.perfume_id');
    const placeholders = filters.category_ids.map(() => '?').join(',');
    havings.push(`SUM(pc.category_id IN (${placeholders})) >= ${filters.category_ids.length}`);
    params.push(...filters.category_ids.map(Number));
  }

  // Note
  if (filters.note_ids?.length) {
    joins.add('LEFT JOIN PerfumeNote pnf ON p.perfume_id = pnf.perfume_id');
    const placeholders = filters.note_ids.map(() => '?').join(',');
    havings.push(`SUM(pnf.note_id IN (${placeholders})) >= ${filters.note_ids.length}`);
    params.push(...filters.note_ids.map(Number));
  }

  // Brand type
  if (filters.brand_type_ids?.length) {
    const placeholders = filters.brand_type_ids.map(() => '?').join(',');
    conditions.push(`b.brand_type_id IN (${placeholders})`);
    params.push(...filters.brand_type_ids.map(Number));
  }

  // Build query
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const havingClause = havings.length ? `HAVING ${havings.join(' AND ')}` : '';
  const joinClause = [...joins].join('\n     ');

  const sql = `
    SELECT p.perfume_id, p.name, p.gender, p.release_year, p.price, p.image_url,
           b.brand_name, bt.type_name AS brand_type
    FROM Perfume p
    LEFT JOIN Brand b ON p.brand_id = b.brand_id
    LEFT JOIN BrandType bt ON b.brand_type_id = bt.brand_type_id
    ${joinClause}
    ${whereClause}
    GROUP BY p.perfume_id
    ${havingClause}
    ORDER BY p.name
    LIMIT 50`;

  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { search };
