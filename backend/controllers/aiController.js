const aiService = require('../services/aiService');

async function recommend(req, res, next) {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });
    const result = await aiService.recommend(query);
    res.json(result);
  } catch (err) { next(err); }
}

async function chat(req, res, next) {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const result = await aiService.chat(message, history || []);
    res.json(result);
  } catch (err) { next(err); }
}

async function generateDescription(req, res, next) {
  try {
    const result = await aiService.generateDescription(req.params.perfumeId);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { recommend, chat, generateDescription };
