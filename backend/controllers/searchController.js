const searchService = require('../services/searchService');

async function search(req, res, next) {
  try {
    // Parse array params from query string
    const filters = { ...req.query };
    ['season_ids', 'occasion_ids', 'category_ids', 'note_ids', 'brand_type_ids'].forEach(key => {
      if (filters[key]) {
        filters[key] = Array.isArray(filters[key]) ? filters[key] : filters[key].split(',');
      }
    });
    res.json(await searchService.search(filters));
  } catch (err) { next(err); }
}

module.exports = { search };
