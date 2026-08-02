const lookupService = require('../services/lookupService');

// --- Generic lookup CRUD (seasons, occasions, categories, brandtypes) ---
async function getAll(req, res, next) {
  try { res.json(await lookupService.getAll(req.params.type)); }
  catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json(await lookupService.create(req.params.type, req.body.name)); }
  catch (err) { next(err); }
}

async function update(req, res, next) {
  try { res.json(await lookupService.update(req.params.type, req.params.id, req.body.name)); }
  catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const deleted = await lookupService.remove(req.params.type, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}

// --- Notes (special — has note_type ENUM) ---
async function getAllNotes(_req, res, next) {
  try { res.json(await lookupService.getAllNotes()); }
  catch (err) { next(err); }
}

async function getNoteById(req, res, next) {
  try {
    const note = await lookupService.getNoteById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) { next(err); }
}

async function createNote(req, res, next) {
  try { res.status(201).json(await lookupService.createNote(req.body)); }
  catch (err) { next(err); }
}

async function updateNote(req, res, next) {
  try { res.json(await lookupService.updateNote(req.params.id, req.body)); }
  catch (err) { next(err); }
}

async function deleteNote(req, res, next) {
  try {
    const deleted = await lookupService.deleteNote(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) { next(err); }
}

module.exports = { getAll, create, update, remove, getAllNotes, getNoteById, createNote, updateNote, deleteNote };
