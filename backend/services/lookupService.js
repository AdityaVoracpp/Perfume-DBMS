const pool = require('../config/db');

/**
 * Generic CRUD for lookup tables: Season, Occasion, Category, BrandType, Note.
 * Showcases: how the schema uses small lookup tables referenced by junction tables.
 *
 * TABLE_CONFIG maps a type name to its table, PK column, and name column.
 */
const TABLE_CONFIG = {
  seasons:     { table: 'Season',    pk: 'season_id',     nameCol: 'name' },
  occasions:   { table: 'Occasion',  pk: 'occasion_id',   nameCol: 'name' },
  categories:  { table: 'Category',  pk: 'category_id',   nameCol: 'name' },
  brandtypes:  { table: 'BrandType', pk: 'brand_type_id', nameCol: 'type_name' },
};

function getConfig(type) {
  const config = TABLE_CONFIG[type];
  if (!config) {
    const err = new Error(`Unknown lookup type: ${type}. Valid types: ${Object.keys(TABLE_CONFIG).join(', ')}`);
    err.status = 400;
    throw err;
  }
  return config;
}

async function getAll(type) {
  const { table, pk, nameCol } = getConfig(type);
  const [rows] = await pool.execute(`SELECT ${pk}, ${nameCol} FROM ${table} ORDER BY ${nameCol}`);
  return rows;
}

async function create(type, name) {
  const { table, pk, nameCol } = getConfig(type);
  const [result] = await pool.execute(`INSERT INTO ${table} (${nameCol}) VALUES (?)`, [name]);
  return { [pk]: result.insertId, [nameCol]: name };
}

async function update(type, id, name) {
  const { table, pk, nameCol } = getConfig(type);
  await pool.execute(`UPDATE ${table} SET ${nameCol} = ? WHERE ${pk} = ?`, [name, id]);
  return { [pk]: parseInt(id), [nameCol]: name };
}

async function remove(type, id) {
  const { table, pk } = getConfig(type);
  const [result] = await pool.execute(`DELETE FROM ${table} WHERE ${pk} = ?`, [id]);
  return result.affectedRows > 0;
}

// ───────────────────────────────────────────────
// NOTES — special handling because of note_type ENUM
// Showcases: ENUM constraint and pyramid layer classification
// ───────────────────────────────────────────────
async function getAllNotes() {
  const [rows] = await pool.execute(
    `SELECT n.note_id, n.note_name, n.note_type,
            COUNT(pn.perfume_id) AS usage_count
     FROM Note n
     LEFT JOIN PerfumeNote pn ON n.note_id = pn.note_id
     GROUP BY n.note_id
     ORDER BY n.note_type, n.note_name`
  );
  return rows;
}

async function getNoteById(id) {
  const [noteRows] = await pool.execute('SELECT * FROM Note WHERE note_id = ?', [id]);
  if (noteRows.length === 0) return null;

  // Get perfumes that use this note
  const [perfumes] = await pool.execute(
    `SELECT p.perfume_id, p.name, p.image_url, p.price, b.brand_name
     FROM Perfume p
     JOIN PerfumeNote pn ON p.perfume_id = pn.perfume_id
     LEFT JOIN Brand b ON p.brand_id = b.brand_id
     WHERE pn.note_id = ?
     ORDER BY p.name`,
    [id]
  );

  return { ...noteRows[0], perfumes };
}

async function createNote({ note_name, note_type }) {
  const [result] = await pool.execute(
    'INSERT INTO Note (note_name, note_type) VALUES (?, ?)',
    [note_name, note_type]
  );
  return { note_id: result.insertId, note_name, note_type };
}

async function updateNote(id, { note_name, note_type }) {
  await pool.execute(
    'UPDATE Note SET note_name = ?, note_type = ? WHERE note_id = ?',
    [note_name, note_type, id]
  );
  return { note_id: parseInt(id), note_name, note_type };
}

async function deleteNote(id) {
  const [result] = await pool.execute('DELETE FROM Note WHERE note_id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { getAll, create, update, remove, getAllNotes, getNoteById, createNote, updateNote, deleteNote };
