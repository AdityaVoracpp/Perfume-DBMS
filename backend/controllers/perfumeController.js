const perfumeService = require('../services/perfumeService');

async function getAll(req, res, next) {
  try {
    const result = await perfumeService.getAll(req.query);
    res.json(result);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const perfume = await perfumeService.getById(req.params.id);
    if (!perfume) return res.status(404).json({ error: 'Perfume not found' });
    res.json(perfume);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const perfume = await perfumeService.create(req.body);
    res.status(201).json(perfume);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const perfume = await perfumeService.update(req.params.id, req.body);
    if (!perfume) return res.status(404).json({ error: 'Perfume not found' });
    res.json(perfume);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const deleted = await perfumeService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Perfume not found' });
    res.json({ message: 'Perfume deleted' });
  } catch (err) { next(err); }
}

async function findSimilar(req, res, next) {
  try {
    const similar = await perfumeService.findSimilar(req.params.id, req.query.limit);
    res.json(similar);
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove, findSimilar };
