const router = require('express').Router();
const ctrl = require('../controllers/aiController');

router.post('/recommend', ctrl.recommend);
router.post('/chat', ctrl.chat);
router.get('/describe/:perfumeId', ctrl.generateDescription);

module.exports = router;
