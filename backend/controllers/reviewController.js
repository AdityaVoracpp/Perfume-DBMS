const reviewService = require('../services/reviewService');

async function getByPerfume(req, res, next) {
  try { res.json(await reviewService.getByPerfumeId(req.params.perfumeId)); }
  catch (err) { next(err); }
}

async function getByUser(req, res, next) {
  try { res.json(await reviewService.getByUserId(req.params.userId)); }
  catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const review = await reviewService.create({
      ...req.body,
      user_id: req.user.user_id
    });
    res.status(201).json(review);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const deleted = await reviewService.remove(req.params.id, req.user.user_id);
    if (!deleted) return res.status(404).json({ error: 'Review not found or not yours' });
    res.json({ message: 'Review deleted' });
  } catch (err) { next(err); }
}

module.exports = { getByPerfume, getByUser, create, remove };
