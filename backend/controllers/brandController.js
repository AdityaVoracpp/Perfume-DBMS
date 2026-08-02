const brandService = require('../services/brandService');

async function getAll(_req, res, next) {
  try { res.json(await brandService.getAll()); }
  catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const brand = await brandService.getById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json(await brandService.create(req.body)); }
  catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const brand = await brandService.update(req.params.id, req.body);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const deleted = await brandService.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Brand not found' });
    res.json({ message: 'Brand deleted' });
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove };
